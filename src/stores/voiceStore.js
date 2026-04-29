import {
    computed,
    ref
} from 'vue'
import {
    defineStore
} from 'pinia'
import {
    Room,
    RoomEvent,
    Track
} from 'livekit-client'
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
    const lastError = ref('')
    const latestChannelState = ref(null)
    const remoteAudioElements = ref({})

    const isInVoiceChannel = computed(() => Boolean(room.value && room.value.state === 'connected'))
    const voiceParticipantCount = computed(() => participants.value.length)

    const cleanupRemoteAudioElements = () => {
        Object.values(remoteAudioElements.value).forEach((element) => {
            try {
                element.pause()
            } catch {
                // noop
            }
            try {
                element.remove()
            } catch {
                // noop
            }
        })

        remoteAudioElements.value = {}
    }

    const parseParticipantMetadata = (participant) => {
        try {
            return participant?.metadata ? JSON.parse(participant.metadata) : {}
        } catch {
            return {}
        }
    }

    const mapParticipant = (participant, isLocal = false) => {
        const metadata = parseParticipantMetadata(participant)
        
        let avatarUrl = metadata.avatarUrl || ''
        let name = metadata.displayName || metadata.loginName || metadata.username || participant.name || participant.identity

        // Fallback cho local participant vì LiveKit metadata có thể chưa sync liền lúc join
        if (isLocal) {
            const authStore = useAuthStore()
            if (!avatarUrl && authStore.user?.avatarUrl) {
                avatarUrl = authStore.user.avatarUrl
            }
            if ((!metadata.displayName && !metadata.loginName && !metadata.username) || name === participant.identity) {
                name = authStore.user?.displayName || authStore.user?.profileName || authStore.user?.loginName || authStore.user?.username || name
            }
        }

        return {
            id: participant.identity,
            userId: metadata.userId || participant.identity,
            name: name,
            displayName: metadata.displayName || name,
            avatarUrl: avatarUrl,
            speaking: participant.isSpeaking,
            isLocal,
        }
    }

    const refreshParticipants = () => {
        if (!room.value) {
            participants.value = []
            return
        }

        const localParticipant = room.value.localParticipant?.identity ?
            [mapParticipant(room.value.localParticipant, true)] :
            []

        const remoteParticipants = Array.from(room.value.remoteParticipants.values()).map((participant) =>
            mapParticipant(participant, false),
        )

        participants.value = [...localParticipant, ...remoteParticipants]
    }

    const attachRemoteAudio = (track, participant) => {
        if (!track || track.kind !== Track.Kind.Audio || deafened.value) return

        const audioElement = track.attach()
        audioElement.autoplay = true
        audioElement.playsInline = true
        audioElement.dataset.participantId = participant.identity
        audioElement.style.display = 'none'
        document.body.appendChild(audioElement)

        remoteAudioElements.value = {
            ...remoteAudioElements.value,
            [participant.identity]: audioElement,
        }
    }

    const detachRemoteAudio = (track, participantIdentity) => {
        try {
            track?.detach()?.forEach((element) => {
                try {
                    element.pause()
                } catch {
                    // noop
                }
                try {
                    element.remove()
                } catch {
                    // noop
                }
            })
        } catch {
            // noop
        }

        const audioElement = remoteAudioElements.value[participantIdentity]
        if (audioElement) {
            try {
                audioElement.pause()
            } catch {
                // noop
            }
            try {
                audioElement.remove()
            } catch {
                // noop
            }
        }

        const {
            [participantIdentity]: _, ...rest
        } = remoteAudioElements.value
        remoteAudioElements.value = rest
    }

    const bindRoomEvents = (lkRoom) => {
        lkRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
            if (!participant) return
            if (track.kind === Track.Kind.Audio) {
                attachRemoteAudio(track, participant)
            }
            refreshParticipants()
        })

        lkRoom.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
            if (participant?.identity) {
                detachRemoteAudio(track, participant.identity)
            }
            refreshParticipants()
        })

        lkRoom.on(RoomEvent.ParticipantConnected, () => {
            refreshParticipants()
        })

        lkRoom.on(RoomEvent.ParticipantDisconnected, () => {
            refreshParticipants()
        })

        lkRoom.on(RoomEvent.ActiveSpeakersChanged, () => {
            refreshParticipants()
        })

        lkRoom.on(RoomEvent.Disconnected, () => {
            refreshParticipants()
        })
    }

    const joinVoiceChannel = async (channelId, channelName = '', wantMic = true) => {
        if (!channelId) return null

        if (activeVoiceChannelId.value && activeVoiceChannelId.value !== channelId) {
            await leaveVoiceChannel()
        }

        const {
            data
        } = await api.post('/api/voice/join', {
            channelId,
            wantMic,
        })

        const lkRoom = new Room({
            adaptiveStream: true,
            dynacast: true,
        })

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

    const toggleMute = async () => {
        muted.value = !muted.value

        if (!room.value) return
        await room.value.localParticipant.setMicrophoneEnabled(!muted.value)
    }

    const toggleDeafen = () => {
        deafened.value = !deafened.value

        if (deafened.value) {
            cleanupRemoteAudioElements()
            return
        }

        if (!room.value) return

        room.value.remoteParticipants.forEach((participant) => {
            participant.trackPublications.forEach((publication) => {
                if (publication.kind === Track.Kind.Audio && publication.isSubscribed && publication.track) {
                    attachRemoteAudio(publication.track, participant)
                }
            })
        })
    }

    const syncVoiceState = async (channelId) => {
        if (!channelId) return null

        const {
            data
        } = await api.get(`/api/voice/state/${channelId}`)
        latestChannelState.value = data
        return data
    }

    const toggleMicOnServer = async (enabled) => {
        if (!activeVoiceChannelId.value || !activeSessionId.value) return null

        const {
            data
        } = await api.post('/api/voice/mic', {
            channelId: activeVoiceChannelId.value,
            sessionId: activeSessionId.value,
            enabled,
        })

        latestChannelState.value = data || null
        return data
    }

    const leaveVoiceChannel = async () => {
        const channelId = activeVoiceChannelId.value
        const sessionId = activeSessionId.value

        if (channelId && sessionId) {
            try {
                const {
                    data
                } = await api.post('/api/voice/leave', {
                    channelId,
                    sessionId,
                })
                latestChannelState.value = data || null
            } catch {
                // noop - vẫn phải disconnect client-side
            }
        }

        cleanupRemoteAudioElements()

        if (room.value) {
            try {
                await room.value.disconnect()
            } catch {
                // noop
            }
        }

        room.value = null
        participants.value = []
        activeVoiceChannelId.value = null
        activeVoiceChannelName.value = ''
        activeSessionId.value = null
        muted.value = false
        deafened.value = false
        lastError.value = ''
    }

    const reset = async () => {
        await leaveVoiceChannel()
        latestChannelState.value = null
    }

    return {
        activeVoiceChannelId,
        activeVoiceChannelName,
        room,
        participants,
        muted,
        deafened,
        isInVoiceChannel,
        voiceParticipantCount,
        activeSpeakerId: computed(() => {
            const speaker = participants.value.find(p => p.speaking && !p.isLocal)
            return speaker?.id || null
        }),
        joinVoiceChannel,
        leaveVoiceChannel,
        toggleMute,
        toggleDeafen,
        syncVoiceState,
        reset,
    }
})