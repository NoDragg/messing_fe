import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

const VOICE_SIGNAL_TYPES = {
  VOICE_JOIN: 'VOICE_JOIN',
  VOICE_LEAVE: 'VOICE_LEAVE',
  VOICE_PARTICIPANTS: 'VOICE_PARTICIPANTS',
  VOICE_OFFER: 'VOICE_OFFER',
  VOICE_ANSWER: 'VOICE_ANSWER',
  VOICE_ICE: 'VOICE_ICE',
  VOICE_ERROR: 'VOICE_ERROR',
}

const SPEAKING_THRESHOLD = 0.025
const SPEAKING_CHECK_INTERVAL = 180

export const useVoiceStore = defineStore('voice', () => {
  const authStore = useAuthStore()
  const chatStore = useChatStore()

  const activeVoiceChannelId = ref(null)
  const participants = ref([])
  const localStream = ref(null)
  const peerConnections = ref({})
  const remoteStreams = ref({})
  const muted = ref(false)
  const deafened = ref(false)
  const lastError = ref('')

  const participantCountByChannel = ref({})
  const activeSessionId = ref(null)
  const isSessionStarter = ref(false)
  const speakingUserIds = ref(new Set())

  const audioContext = ref(null)
  const speakingDetectors = ref({})

  const isInVoiceChannel = computed(() => Boolean(activeVoiceChannelId.value))

  const getPeerConnection = (peerUserId) => peerConnections.value[peerUserId] || null

  const setPeerConnection = (peerUserId, connection) => {
    peerConnections.value = {
      ...peerConnections.value,
      [peerUserId]: connection,
    }
  }

  const removePeerConnection = (peerUserId) => {
    const { [peerUserId]: _, ...rest } = peerConnections.value
    peerConnections.value = rest
  }

  const setRemoteStream = (peerUserId, stream) => {
    remoteStreams.value = {
      ...remoteStreams.value,
      [peerUserId]: stream,
    }

    attachSpeakingDetector(peerUserId, stream)
  }

  const removeRemoteStream = (peerUserId) => {
    detachSpeakingDetector(peerUserId)

    const { [peerUserId]: _, ...rest } = remoteStreams.value
    remoteStreams.value = rest
  }

  const getOrCreateAudioContext = () => {
    if (!audioContext.value) {
      const AudioContextCtor = window.AudioContext || window['webkitAudioContext']
      audioContext.value = new AudioContextCtor()
    }

    return audioContext.value
  }

  const clearSpeakingUser = (userId) => {
    if (!speakingUserIds.value.has(userId)) return

    const next = new Set(speakingUserIds.value)
    next.delete(userId)
    speakingUserIds.value = next
  }

  const setSpeakingUser = (userId, isSpeaking) => {
    const hasUser = speakingUserIds.value.has(userId)
    if (isSpeaking && !hasUser) {
      const next = new Set(speakingUserIds.value)
      next.add(userId)
      speakingUserIds.value = next
      return
    }

    if (!isSpeaking && hasUser) {
      clearSpeakingUser(userId)
    }
  }

  const detachSpeakingDetector = (userId) => {
    const detector = speakingDetectors.value[userId]
    if (!detector) return

    clearInterval(detector.intervalId)

    try {
      detector.source.disconnect()
    } catch {
      // noop
    }

    try {
      detector.analyser.disconnect()
    } catch {
      // noop
    }

    const { [userId]: _, ...rest } = speakingDetectors.value
    speakingDetectors.value = rest
    clearSpeakingUser(userId)
  }

  const attachSpeakingDetector = (userId, stream) => {
    if (!stream) return

    detachSpeakingDetector(userId)

    const context = getOrCreateAudioContext()
    const source = context.createMediaStreamSource(stream)
    const analyser = context.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.7
    source.connect(analyser)

    const buffer = new Float32Array(analyser.fftSize)

    const intervalId = setInterval(() => {
      analyser.getFloatTimeDomainData(buffer)
      let sum = 0
      for (let i = 0; i < buffer.length; i += 1) {
        const sample = buffer[i]
        sum += sample * sample
      }

      const rms = Math.sqrt(sum / buffer.length)
      setSpeakingUser(userId, rms > SPEAKING_THRESHOLD)
    }, SPEAKING_CHECK_INTERVAL)

    speakingDetectors.value = {
      ...speakingDetectors.value,
      [userId]: {
        source,
        analyser,
        intervalId,
      },
    }
  }

  const clearSpeakingDetectors = () => {
    Object.keys(speakingDetectors.value).forEach((userId) => {
      detachSpeakingDetector(userId)
    })

    speakingUserIds.value = new Set()
  }

  const clearAllPeers = () => {
    Object.values(peerConnections.value).forEach((pc) => {
      try {
        pc.close()
      } catch {
        // noop
      }
    })

    peerConnections.value = {}
    remoteStreams.value = {}
    clearSpeakingDetectors()
  }

  const stopLocalStream = () => {
    if (!localStream.value) return

    localStream.value.getTracks().forEach((track) => {
      try {
        track.stop()
      } catch {
        // noop
      }
    })

    localStream.value = null
  }

  const ensureLocalStream = async () => {
    if (localStream.value) return localStream.value

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    })

    stream.getAudioTracks().forEach((track) => {
      track.enabled = !muted.value && !deafened.value
    })

    localStream.value = stream
    return stream
  }

  const tryEnsureLocalStream = async () => {
    try {
      return await ensureLocalStream()
    } catch {
      return null
    }
  }

  const sendVoiceSignal = ({ toUserId, channelId, type, sdp, candidate, sdpMid, sdpMLineIndex, metadata }) => {
    const currentUserId = authStore.user?.id
    const roomId = channelId || activeVoiceChannelId.value

    if (!currentUserId || !roomId || !type) return false

    return chatStore.sendCallSignal({
      toUserId: toUserId || currentUserId,
      roomId,
      type,
      sdp,
      candidate,
      sdpMid,
      sdpMLineIndex,
      metadata,
    })
  }

  const applyMuteStateToTracks = () => {
    if (!localStream.value) return

    const enabled = !muted.value && !deafened.value
    localStream.value.getAudioTracks().forEach((track) => {
      track.enabled = enabled
    })
  }

  const toggleMute = () => {
    muted.value = !muted.value
    applyMuteStateToTracks()
  }

  const toggleDeafen = () => {
    deafened.value = !deafened.value
    applyMuteStateToTracks()
  }

  const createPeerConnection = async (peerUserId, channelId) => {
    let pc = getPeerConnection(peerUserId)
    if (pc) return pc

    pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    pc.onicecandidate = (event) => {
      if (!event.candidate) return

      sendVoiceSignal({
        toUserId: peerUserId,
        channelId,
        type: VOICE_SIGNAL_TYPES.VOICE_ICE,
        candidate: event.candidate.candidate,
        sdpMid: event.candidate.sdpMid,
        sdpMLineIndex: event.candidate.sdpMLineIndex,
      })
    }

    pc.ontrack = (event) => {
      const [stream] = event.streams
      if (!stream) return
      setRemoteStream(peerUserId, stream)
    }

    pc.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
        removePeerConnection(peerUserId)
        removeRemoteStream(peerUserId)
      }
    }

    const stream = await tryEnsureLocalStream()
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })
    }

    setPeerConnection(peerUserId, pc)
    return pc
  }

  const createAndSendOffer = async (peerUserId, channelId) => {
    const pc = await createPeerConnection(peerUserId, channelId)
    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false })

    await pc.setLocalDescription(offer)

    sendVoiceSignal({
      toUserId: peerUserId,
      channelId,
      type: VOICE_SIGNAL_TYPES.VOICE_OFFER,
      sdp: offer.sdp,
      metadata: { kind: 'mesh-audio' },
    })
  }

  const joinVoiceChannel = async (channelId) => {
    if (!channelId || !chatStore.isConnected) return false

    if (activeVoiceChannelId.value === channelId) {
      return sendVoiceSignal({ channelId, type: VOICE_SIGNAL_TYPES.VOICE_JOIN })
    }

    if (activeVoiceChannelId.value) {
      await leaveVoiceChannel()
    }

    const stream = await tryEnsureLocalStream()

    activeVoiceChannelId.value = channelId
    participants.value = []

    if (!stream) {
      lastError.value = 'Bạn đã vào chế độ nghe-only vì chưa cấp quyền microphone'
    } else {
      lastError.value = ''
    }

    return sendVoiceSignal({
      channelId,
      type: VOICE_SIGNAL_TYPES.VOICE_JOIN,
      metadata: {
        listenOnly: !stream,
      },
    })
  }

  const rejoinActiveVoiceChannel = async () => {
    if (!activeVoiceChannelId.value || !chatStore.isConnected) return false

    clearAllPeers()
    participants.value = []

    try {
      await ensureLocalStream()
      return sendVoiceSignal({
        channelId: activeVoiceChannelId.value,
        type: VOICE_SIGNAL_TYPES.VOICE_JOIN,
      })
    } catch {
      lastError.value = 'Không thể rejoin voice channel sau khi reconnect'
      return false
    }
  }

  const leaveVoiceChannel = async () => {
    const channelId = activeVoiceChannelId.value
    if (!channelId) return

    participantCountByChannel.value = {
      ...participantCountByChannel.value,
      [channelId]: 0,
    }

    sendVoiceSignal({
      channelId,
      type: VOICE_SIGNAL_TYPES.VOICE_LEAVE,
    })

    clearAllPeers()
    stopLocalStream()
    participants.value = []
    activeSessionId.value = null
    isSessionStarter.value = false
    activeVoiceChannelId.value = null
  }

  const updateParticipantCount = (channelId, users) => {
    if (!channelId) return
    participantCountByChannel.value = {
      ...participantCountByChannel.value,
      [channelId]: Array.isArray(users) ? users.length : 0,
    }
  }

  const getParticipantCount = (channelId) => participantCountByChannel.value[channelId] || 0

  const handleParticipantsUpdate = async (signal) => {
    const channelId = signal?.metadata?.channelId || signal?.roomId
    const users = Array.isArray(signal?.metadata?.users) ? signal.metadata.users : []
    const sessionId = signal?.metadata?.sessionId || null
    const isNewSession = Boolean(signal?.metadata?.isNewSession)

    activeSessionId.value = channelId === activeVoiceChannelId.value ? sessionId : activeSessionId.value
    isSessionStarter.value = channelId === activeVoiceChannelId.value ? isNewSession : false

    updateParticipantCount(channelId, users)

    if (channelId !== activeVoiceChannelId.value) return

    participants.value = users

    const currentUserId = authStore.user?.id
    const peerIds = users
      .map((user) => user?.id)
      .filter((id) => id && id !== currentUserId)

    const existingPeerIds = Object.keys(peerConnections.value)

    for (const stalePeerId of existingPeerIds) {
      if (!peerIds.includes(stalePeerId)) {
        const pc = getPeerConnection(stalePeerId)
        if (pc) {
          try {
            pc.close()
          } catch {
            // noop
          }
        }
        removePeerConnection(stalePeerId)
        removeRemoteStream(stalePeerId)
      }
    }

    for (const peerId of peerIds) {
      if (!getPeerConnection(peerId) && currentUserId && currentUserId < peerId) {
        await createAndSendOffer(peerId, channelId)
      }
    }
  }

  const handleOffer = async (signal) => {
    if (!signal?.fromUserId || !signal?.sdp) return
    if (signal.roomId !== activeVoiceChannelId.value) return

    const peerUserId = signal.fromUserId
    const pc = await createPeerConnection(peerUserId, signal.roomId)

    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    sendVoiceSignal({
      toUserId: peerUserId,
      channelId: signal.roomId,
      type: VOICE_SIGNAL_TYPES.VOICE_ANSWER,
      sdp: answer.sdp,
    })
  }

  const handleAnswer = async (signal) => {
    if (!signal?.fromUserId || !signal?.sdp) return

    const pc = getPeerConnection(signal.fromUserId)
    if (!pc) return

    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }))
  }

  const handleIce = async (signal) => {
    if (!signal?.fromUserId || !signal?.candidate) return

    const pc = getPeerConnection(signal.fromUserId)
    if (!pc) return

    await pc.addIceCandidate(
      new RTCIceCandidate({
        candidate: signal.candidate,
        sdpMid: signal.sdpMid,
        sdpMLineIndex: signal.sdpMLineIndex,
      }),
    )
  }

  const handleVoiceSignal = async (signal) => {
    if (!signal?.type) return null

    if (signal.type === VOICE_SIGNAL_TYPES.VOICE_PARTICIPANTS) {
      await handleParticipantsUpdate(signal)
      return { kind: 'participants' }
    }

    if (signal.type === VOICE_SIGNAL_TYPES.VOICE_OFFER) {
      await handleOffer(signal)
      return { kind: 'offer' }
    }

    if (signal.type === VOICE_SIGNAL_TYPES.VOICE_ANSWER) {
      await handleAnswer(signal)
      return { kind: 'answer' }
    }

    if (signal.type === VOICE_SIGNAL_TYPES.VOICE_ICE) {
      await handleIce(signal)
      return { kind: 'ice' }
    }

    if (signal.type === VOICE_SIGNAL_TYPES.VOICE_ERROR) {
      lastError.value = signal?.metadata?.message || 'Voice signaling error'
      return { kind: 'error', message: lastError.value }
    }

    return null
  }

  const reset = () => {
    leaveVoiceChannel()
    muted.value = false
    deafened.value = false
    lastError.value = ''
    participantCountByChannel.value = {}
    activeSessionId.value = null
    isSessionStarter.value = false
    clearSpeakingDetectors()

    if (audioContext.value) {
      audioContext.value.close().catch(() => {
        // noop
      })
      audioContext.value = null
    }
  }

  return {
    activeVoiceChannelId,
    participants,
    localStream,
    peerConnections,
    remoteStreams,
    muted,
    deafened,
    lastError,
    isInVoiceChannel,
    participantCountByChannel,
    activeSessionId,
    isSessionStarter,
    speakingUserIds,
    VOICE_SIGNAL_TYPES,
    joinVoiceChannel,
    rejoinActiveVoiceChannel,
    leaveVoiceChannel,
    toggleMute,
    toggleDeafen,
    getParticipantCount,
    handleVoiceSignal,
    reset,
  }
})
