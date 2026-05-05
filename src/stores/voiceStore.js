import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { Room, RoomEvent, Track } from 'livekit-client'
import api from '@/services/api'
import { useAuthStore } from '@/stores/authStore'

export const useVoiceStore = defineStore('voice', () => {
    const activeVoiceChannelId = ref(null)
    const activeVoiceChannelName = ref('')
    const activeSessionId = ref(null)
    const room = ref(null)
    const participants = ref([])
    const muted = ref(false)
    const deafened = ref(false)
    const screenSharing = ref(false)
    const screenShareTrack = ref(null)
    const screenShareSource = ref('')
    const lastError = ref('')
    const latestChannelState = ref(null)
    const remoteAudioElements = ref({})
    const remoteScreenElements = ref({})
    const pinnedScreenTrackSid = ref(null)
    const selectedScreenTrackSid = ref(null)
    const localScreenElementKey = 'local-screen'

    const isInVoiceChannel = computed(() => Boolean(room.value && room.value.state === 'connected'))
    const voiceParticipantCount = computed(() => participants.value.length)
    const activeScreenShareParticipants = computed(() => {
        const serverParticipants = latestChannelState.value?.participants || []
        return serverParticipants
            .filter((participant) => participant?.isScreenSharing && participant?.connectionState === 'CONNECTED')
            .map((participant) => ({
                participantId: participant.participantId || participant.id || participant.userId,
                userId: participant.userId,
                trackSid: participant.screenShareTrackSid || null,
                source: participant.screenShareSource || '',
            }))
    })

    const cleanupMediaElements = (elementsRef) => {
        Object.values(elementsRef.value).forEach((element) => {
            try { element.pause() } catch { /* noop */ }
            try { element.remove() } catch { /* noop */ }
        })
        elementsRef.value = {}
    }
    const cleanupRemoteAudioElements = () => cleanupMediaElements(remoteAudioElements)
    const cleanupRemoteScreenElements = () => cleanupMediaElements(remoteScreenElements)

    const parseParticipantMetadata = (participant) => {
        try { return participant?.metadata ? JSON.parse(participant.metadata) : {} } catch { return {} }
    }

    const mapParticipant = (participant, isLocal = false) => {
        const metadata = parseParticipantMetadata(participant)
        let avatarUrl = metadata.avatarUrl || ''
        let name = metadata.displayName || metadata.loginName || metadata.username || participant.name || participant.identity
        if (isLocal) {
            const authStore = useAuthStore()
            if (!avatarUrl && authStore.user?.avatarUrl) avatarUrl = authStore.user.avatarUrl
            if ((!metadata.displayName && !metadata.loginName && !metadata.username) || name === participant.identity) {
                name = authStore.user?.displayName || authStore.user?.profileName || authStore.user?.loginName || authStore.user?.username || name
            }
        }
        return { id: participant.identity, userId: metadata.userId || participant.identity, name, displayName: metadata.displayName || name, avatarUrl, speaking: participant.isSpeaking, isLocal, screenSharing: false, screenShareSources: [], screenShareTrackSid: null }
    }

    const getLocalScreenPublication = () => {
        if (!room.value?.localParticipant) return null
        const publications = Array.from(room.value.localParticipant.trackPublications.values())
        return publications.find((publication) => publication.track?.source === Track.Source.ScreenShare) || null
    }

    const enrichWithServerState = (items) => {
        const serverParticipants = latestChannelState.value?.participants || []
        const byUserId = new Map(serverParticipants.map((p) => [p.userId, p]))
        const localScreenPublication = getLocalScreenPublication()
        return items.map((item) => {
            const server = byUserId.get(item.userId)
            const localScreenTrackSid = item.isLocal ? localScreenPublication?.trackSid || item.screenShareTrackSid || null : item.screenShareTrackSid
            const localScreenSharing = item.isLocal ? Boolean(localScreenPublication?.track || screenSharing.value) : Boolean(server?.isScreenSharing)
            if (!server && !item.isLocal) return item
            const sources = item.isLocal
                ? (localScreenPublication?.track?.source ? [localScreenPublication.track.source] : item.screenShareSources || [])
                : Array.isArray(server?.screenShareSources)
                    ? server.screenShareSources
                    : server?.screenShareSource
                        ? [server.screenShareSource]
                        : []
            return {
                ...item,
                screenSharing: item.isLocal ? localScreenSharing : Boolean(server?.isScreenSharing),
                screenShareSources: sources,
                screenShareTrackSid: localScreenTrackSid || server?.screenShareTrackSid || null,
            }
        })
    }

    const refreshParticipants = () => {
        if (!room.value) { participants.value = []; return }
        const localParticipant = room.value.localParticipant?.identity ? [mapParticipant(room.value.localParticipant, true)] : []
        const remoteParticipants = Array.from(room.value.remoteParticipants.values()).map((participant) => mapParticipant(participant, false))
        participants.value = enrichWithServerState([...localParticipant, ...remoteParticipants])
    }

    const attachRemoteAudio = (track, participant) => {
        if (!track || track.kind !== Track.Kind.Audio || deafened.value) return
        const audioElement = track.attach()
        audioElement.autoplay = true
        audioElement.playsInline = true
        audioElement.dataset.participantId = participant.identity
        audioElement.style.display = 'none'
        document.body.appendChild(audioElement)
        remoteAudioElements.value = { ...remoteAudioElements.value, [participant.identity]: audioElement }
    }

    const detachRemoteAudio = (track, participantIdentity) => {
        try { track?.detach()?.forEach((element) => { try { element.pause() } catch { /* noop */ } try { element.remove() } catch { /* noop */ } }) } catch { /* noop */ }
        const audioElement = remoteAudioElements.value[participantIdentity]
        if (audioElement) { try { audioElement.remove() } catch { /* noop */ } }
        const { [participantIdentity]: _, ...rest } = remoteAudioElements.value
        remoteAudioElements.value = rest
    }

    const screenKey = (participantIdentity, trackSid) => `${participantIdentity}:${trackSid || 'screen'}`

    const resolveScreenSource = (publication) => {
        const source = publication?.source || publication?.track?.source || Track.Source.ScreenShare
        return source
    }

    const attachScreenElement = (track, participant, publication, { local = false } = {}) => {
        const trackSid = publication?.trackSid || track?.sid || ''
        const participantIdentity = participant?.identity || (local ? 'local' : '')
        const key = local ? (trackSid || localScreenElementKey) : screenKey(participantIdentity, trackSid)
        const existing = remoteScreenElements.value[key]
        if (existing) { try { existing.remove() } catch { /* noop */ } }
        const videoElement = document.createElement('video')
        videoElement.autoplay = true
        videoElement.playsInline = true
        videoElement.muted = true
        videoElement.controls = false
        videoElement.setAttribute('playsinline', '')
        videoElement.setAttribute('muted', '')
        videoElement.setAttribute('autoplay', '')
        if (local) {
            const mediaTrack = track instanceof MediaStreamTrack ? track : track?.mediaStreamTrack || null
            if (mediaTrack) videoElement.srcObject = new MediaStream([mediaTrack])
        } else if (track && typeof track.attach === 'function') {
            track.attach(videoElement)
        }
        videoElement.dataset.participantId = participantIdentity
        videoElement.dataset.trackSid = trackSid
        videoElement.dataset.source = resolveScreenSource(publication)
        videoElement.dataset.loaded = '0'
        const markLoaded = () => { videoElement.dataset.loaded = '1' }
        videoElement.addEventListener('loadedmetadata', markLoaded)
        videoElement.addEventListener('loadeddata', markLoaded)
        videoElement.addEventListener('canplay', markLoaded)
        videoElement.addEventListener('playing', markLoaded)
        const timer = window.setTimeout(markLoaded, 1200)
        videoElement.addEventListener('emptied', () => { window.clearTimeout(timer) }, { once: true })
        remoteScreenElements.value = { ...remoteScreenElements.value, [key]: videoElement }
    }

    const detachRemoteScreen = (track, participantIdentity, publication) => {
        const trackSid = publication?.trackSid || track?.sid || ''
        const key = screenKey(participantIdentity, trackSid)
        try { track?.detach()?.forEach((element) => { try { element.remove() } catch { /* noop */ } }) } catch { /* noop */ }
        const videoElement = remoteScreenElements.value[key]
        if (videoElement) { try { videoElement.remove() } catch { /* noop */ } }
        const { [key]: removedElement, ...rest } = remoteScreenElements.value
        remoteScreenElements.value = rest
        const remainingTrackSid = getFirstRemoteScreenTrackSid()
        const removedWasSelected = selectedScreenTrackSid.value === trackSid || selectedScreenTrackSid.value === key || removedElement?.dataset?.trackSid === selectedScreenTrackSid.value
        const removedWasPinned = pinnedScreenTrackSid.value === trackSid || pinnedScreenTrackSid.value === key || removedElement?.dataset?.trackSid === pinnedScreenTrackSid.value
        if (removedWasSelected || removedWasPinned) {
            selectedScreenTrackSid.value = remainingTrackSid
            pinnedScreenTrackSid.value = remainingTrackSid
        }
        if (!selectedScreenTrackSid.value && remainingTrackSid) selectedScreenTrackSid.value = remainingTrackSid
        if (!pinnedScreenTrackSid.value && remainingTrackSid) pinnedScreenTrackSid.value = remainingTrackSid
    }

    const bindRoomEvents = (lkRoom) => {
        lkRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
            if (!participant) return
            if (track.kind === Track.Kind.Audio) attachRemoteAudio(track, participant)
            if (track.kind === Track.Kind.Video && publication.source === Track.Source.ScreenShare) attachScreenElement(track, participant, publication)
            refreshParticipants()
        })
        lkRoom.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
            if (track.kind === Track.Kind.Audio && participant?.identity) detachRemoteAudio(track, participant.identity)
            if (track.kind === Track.Kind.Video && participant?.identity) detachRemoteScreen(track, participant.identity, publication)
            refreshParticipants()
        })
        lkRoom.on(RoomEvent.ParticipantConnected, refreshParticipants)
        lkRoom.on(RoomEvent.ParticipantDisconnected, refreshParticipants)
        lkRoom.on(RoomEvent.ActiveSpeakersChanged, refreshParticipants)
        lkRoom.on(RoomEvent.Disconnected, () => { cleanupRemoteAudioElements(); cleanupRemoteScreenElements(); refreshParticipants() })
    }

    const joinVoiceChannel = async (channelId, channelName = '', wantMic = true) => {
        if (!channelId) return null
        if (activeVoiceChannelId.value && activeVoiceChannelId.value !== channelId) await leaveVoiceChannel()
        const { data } = await api.post('/api/voice/join', { channelId, wantMic })
        const lkRoom = new Room({ adaptiveStream: true, dynacast: true })
        bindRoomEvents(lkRoom)
        await lkRoom.connect(data.livekitUrl, data.livekitToken)
        activeVoiceChannelId.value = channelId
        activeVoiceChannelName.value = channelName || ''
        activeSessionId.value = data.sessionId
        latestChannelState.value = data.channelState || null
        room.value = lkRoom
        muted.value = !wantMic || Boolean(data.listenOnly)
        deafened.value = false
        await lkRoom.localParticipant.setMicrophoneEnabled(!muted.value && !data.listenOnly)
        refreshParticipants()
        return data
    }

    const toggleMute = async () => { muted.value = !muted.value; if (room.value) await room.value.localParticipant.setMicrophoneEnabled(!muted.value) }
    const toggleDeafen = () => { deafened.value = !deafened.value; if (deafened.value) cleanupRemoteAudioElements() }

    const syncVoiceState = async (channelId) => {
        if (!channelId) return null
        const { data } = await api.get(`/api/voice/state/${channelId}`)
        latestChannelState.value = data
        refreshParticipants()
        return data
    }

    const toggleMicOnServer = async (enabled) => {
        if (!activeVoiceChannelId.value || !activeSessionId.value) return null
        const { data } = await api.post('/api/voice/mic', { channelId: activeVoiceChannelId.value, sessionId: activeSessionId.value, enabled })
        latestChannelState.value = data || null
        refreshParticipants()
        return data
    }

    const toggleScreenShareOnServer = async (enabled, trackSid = null, source = '') => {
        if (!activeVoiceChannelId.value || !activeSessionId.value) return null
        const { data } = await api.post('/api/voice/screen-share', { channelId: activeVoiceChannelId.value, sessionId: activeSessionId.value, enabled, trackSid, source })
        latestChannelState.value = data || null
        screenSharing.value = enabled
        screenShareSource.value = enabled ? source : ''
        refreshParticipants()
        return data
    }

    const startScreenShare = async () => {
        if (!room.value) return null
        if (screenSharing.value || getLocalScreenPublication()) return getLocalScreenPublication()?.track?.publication || getLocalScreenPublication() || null

        let mediaStream = null
        let videoTrack = null
        let publication = null

        try {
            // Step A: getDisplayMedia / lấy screen track
            mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
            ;[videoTrack] = mediaStream.getVideoTracks()
            if (!videoTrack) {
                throw new Error('No screen share track available')
            }

            // Step B: publish track lên LiveKit
            publication = await room.value.localParticipant.publishTrack(videoTrack, { name: 'screen-share', source: Track.Source.ScreenShare })
            attachScreenElement(publication?.track || videoTrack, room.value.localParticipant, publication, { local: true })

            screenSharing.value = true
            screenShareTrack.value = videoTrack
            screenShareSource.value = videoTrack.label || 'screen'
            videoTrack.addEventListener('ended', async () => { await stopScreenShare(false) })

            await toggleScreenShareOnServer(true, publication?.trackSid || null, screenShareSource.value)

            return publication
        } catch (error) {
            if (videoTrack) {
                try { videoTrack.stop() } catch { /* noop */ }
            }
            if (mediaStream) {
                try { mediaStream.getTracks().forEach((track) => track.stop()) } catch { /* noop */ }
            }
            if (!screenSharing.value) {
                screenSharing.value = false
                screenShareTrack.value = null
                screenShareSource.value = ''
            }
            throw error
        }
    }

    const stopScreenShare = async (notifyServer = true) => {
        if (!room.value) return
        const localIdentity = room.value.localParticipant?.identity || ''
        try {
            const publications = Array.from(room.value.localParticipant.trackPublications.values())
            const screenPublications = publications.filter((publication) => publication.track?.source === Track.Source.ScreenShare)
            for (const publication of screenPublications) {
                try { publication.track?.stop() } catch { /* noop */ }
                try { await room.value.localParticipant.unpublishTrack(publication.track, true) } catch { /* noop */ }
            }
        } catch { /* noop */ }
        if (screenShareTrack.value) { try { screenShareTrack.value.stop() } catch { /* noop */ } }
        Object.values(remoteScreenElements.value).forEach((element) => {
            const isLocalScreen = element?.dataset?.participantId === localIdentity || element?.dataset?.source === Track.Source.ScreenShare || element?.dataset?.source === 'screen_share'
            if (isLocalScreen) { try { element.remove() } catch { /* noop */ } }
        })
        const remainingScreens = Object.fromEntries(
            Object.entries(remoteScreenElements.value).filter(([, element]) => {
                const isLocalScreen = element?.dataset?.participantId === localIdentity || element?.dataset?.source === Track.Source.ScreenShare || element?.dataset?.source === 'screen_share'
                return !isLocalScreen
            }),
        )
        remoteScreenElements.value = remainingScreens
        if (pinnedScreenTrackSid.value && !remoteScreenElements.value[pinnedScreenTrackSid.value]) pinnedScreenTrackSid.value = null
        screenSharing.value = false
        screenShareTrack.value = null
        screenShareSource.value = ''
        refreshParticipants()
        if (notifyServer) await toggleScreenShareOnServer(false, null, '')
    }

    const getScreenElementTrackSid = (element, key = '') => element?.dataset?.trackSid || key || null
    const getFirstRemoteScreenTrackSid = () => {
        const entries = Object.entries(remoteScreenElements.value)
        const lastEntry = [...entries].reverse().find(([, element]) => Boolean(element))
        return lastEntry ? getScreenElementTrackSid(lastEntry[1], lastEntry[0]) : null
    }

    const getFirstActiveScreenShareTrackSid = () => {
        const participants = [...activeScreenShareParticipants.value]
        return participants.reverse().find((participant) => participant.trackSid)?.trackSid || null
    }

    const setActiveScreenTrackSid = (trackSid) => {
        const nextTrackSid = trackSid || getFirstActiveScreenShareTrackSid() || getFirstRemoteScreenTrackSid()
        selectedScreenTrackSid.value = nextTrackSid
        pinnedScreenTrackSid.value = nextTrackSid
    }
    const setPinnedScreenTrackSid = (trackSid) => {
        setActiveScreenTrackSid(trackSid)
    }
    const togglePinnedScreenTrackSid = (trackSid) => {
        setActiveScreenTrackSid(trackSid)
    }
    const selectUserStream = (target) => {
        if (!target) return
        if (typeof target === 'object') {
            const nextTrackSid = target.trackSid || target.screenShareTrackSid || target.participantId || target.userId || null
            setActiveScreenTrackSid(nextTrackSid)
            return
        }
        setActiveScreenTrackSid(target)
    }
    const resolveScreenElementByTrackSid = (trackSid) => {
        if (!trackSid) return null
        return remoteScreenElements.value[trackSid]
            || Object.values(remoteScreenElements.value).find((element) => {
                const elementTrackSid = element?.dataset?.trackSid || ''
                const participantId = element?.dataset?.participantId || ''
                return elementTrackSid === trackSid || participantId === trackSid
            })
            || Object.entries(remoteScreenElements.value).find(([key, element]) => {
                const elementTrackSid = element?.dataset?.trackSid || ''
                const participantId = element?.dataset?.participantId || ''
                return key === trackSid || elementTrackSid === trackSid || participantId === trackSid
            })?.[1]
            || null
    }

    const activePinnedScreenElement = computed(() => {
        return resolveScreenElementByTrackSid(selectedScreenTrackSid.value) || resolveScreenElementByTrackSid(pinnedScreenTrackSid.value)
    })

    watch(
        () => activeScreenShareParticipants.value.map((participant) => participant.trackSid).filter(Boolean),
        (trackSids) => {
            const currentTrackSid = selectedScreenTrackSid.value || pinnedScreenTrackSid.value
            if (currentTrackSid && trackSids.includes(currentTrackSid)) return

            const fallbackTrackSid = getFirstActiveScreenShareTrackSid() || getFirstRemoteScreenTrackSid()
            if (fallbackTrackSid) {
                selectedScreenTrackSid.value = fallbackTrackSid
                pinnedScreenTrackSid.value = fallbackTrackSid
            }
        },
        { immediate: true },
    )

    const leaveVoiceChannel = async () => {
        const channelId = activeVoiceChannelId.value
        const sessionId = activeSessionId.value
        if (channelId && sessionId) { try { const { data } = await api.post('/api/voice/leave', { channelId, sessionId }); latestChannelState.value = data || null } catch { /* noop */ } }
        cleanupRemoteAudioElements(); cleanupRemoteScreenElements()
        if (room.value) { try { await room.value.disconnect() } catch { /* noop */ } }
        room.value = null; participants.value = []; activeVoiceChannelId.value = null; activeVoiceChannelName.value = ''; activeSessionId.value = null; muted.value = false; deafened.value = false; screenSharing.value = false; screenShareTrack.value = null; screenShareSource.value = ''; lastError.value = ''; pinnedScreenTrackSid.value = null; selectedScreenTrackSid.value = null
    }

    const reset = async () => { await leaveVoiceChannel(); latestChannelState.value = null }

    return {
        activeVoiceChannelId, activeVoiceChannelName, room, participants, muted, deafened, screenSharing, screenShareSource, remoteScreenElements, latestChannelState, pinnedScreenTrackSid, selectedScreenTrackSid, activePinnedScreenElement,
        isInVoiceChannel, voiceParticipantCount,
        activeSpeakerId: computed(() => participants.value.find(p => p.speaking && !p.isLocal)?.id || null),
        joinVoiceChannel, leaveVoiceChannel, toggleMute, toggleDeafen, syncVoiceState, toggleMicOnServer, toggleScreenShareOnServer, startScreenShare, stopScreenShare, reset, togglePinnedScreenTrackSid, setPinnedScreenTrackSid, selectUserStream,
    }
})