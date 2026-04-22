import {
    ref
} from 'vue'
import {
    defineStore
} from 'pinia'
import {
    Client
} from '@stomp/stompjs'
import SockJS from 'sockjs-client/dist/sockjs'
import api from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import {
    loadRuntimeConfig
} from '@/config'

export const useChatStore = defineStore('chat', () => {
    const authStore = useAuthStore()
    const currentChannelId = ref(null)
    const messages = ref([])
    const stompClient = ref(null)
    const activeSubscription = ref(null)
    const isConnected = ref(false)
    const isLoading = ref(false)
    const error = ref('')
    const requestToken = ref(0)
    let runtimeConfigPromise = null

    const getWsUrl = async () => {
        if (!runtimeConfigPromise) {
            runtimeConfigPromise = loadRuntimeConfig()
        }

        const {
            wsBaseUrl
        } = await runtimeConfigPromise
        return `${wsBaseUrl.replace(/\/$/, '')}/ws`
    }

    const fetchMessageHistory = async (channelId) => {
        if (!channelId) {
            messages.value = []
            currentChannelId.value = null
            return []
        }

        const token = ++requestToken.value
        isLoading.value = true
        error.value = ''
        messages.value = []
        currentChannelId.value = channelId

        try {
            const {
                data
            } = await api.get(`/api/channels/${channelId}/messages`)

            if (token !== requestToken.value) {
                return []
            }

            const content = Array.isArray(data) ? data : data?.content
            messages.value = Array.isArray(content) ? [...content].reverse() : []
            return messages.value
        } catch (err) {
            if (token === requestToken.value) {
                error.value = err.response?.data?.message || 'Không thể tải lịch sử tin nhắn.'
            }
            throw err
        } finally {
            if (token === requestToken.value) {
                isLoading.value = false
            }
        }
    }

    const connectWebSocket = async (token) => {
        if (!token || stompClient.value?.connected) {
            return
        }

        error.value = ''
        const wsUrl = await getWsUrl()

        const client = new Client({
            webSocketFactory: () => new SockJS(wsUrl),
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            debug: () => {},
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
        })

        client.onConnect = () => {
            isConnected.value = true

            if (currentChannelId.value) {
                subscribeToChannel(currentChannelId.value)
            }
        }

        client.onStompError = (frame) => {
            error.value = frame.headers?.message || 'Lỗi kết nối WebSocket.'
        }

        client.onWebSocketClose = () => {
            isConnected.value = false
        }

        client.activate()
        stompClient.value = client
    }

    const subscribeToChannel = (channelId) => {
        if (!stompClient.value || !isConnected.value || !channelId) {
            return
        }

        if (activeSubscription.value) {
            activeSubscription.value.unsubscribe()
            activeSubscription.value = null
        }

        currentChannelId.value = channelId
        activeSubscription.value = stompClient.value.subscribe(
            `/topic/channels/${channelId}`,
            (payload) => {
                const message = JSON.parse(payload.body)
                const pendingIndex = messages.value.findIndex((existing) => {
                    return existing?.pending &&
                        existing.senderId === message.senderId &&
                        existing.content === message.content &&
                        existing.channelId === message.channelId
                })

                if (pendingIndex !== -1) {
                    messages.value.splice(pendingIndex, 1, {
                        ...message,
                        pending: false,
                    })
                    return
                }

                const duplicateIndex = messages.value.findIndex((existing) => {
                    return !existing?.pending &&
                        existing.id === message.id
                })

                if (duplicateIndex !== -1) {
                    messages.value.splice(duplicateIndex, 1, message)
                    return
                }

                messages.value.push(message)
            },
        )
    }

    const addPendingMessage = (channelId, content) => {
        const currentUser = authStore.user || {}
        const pendingMessage = {
            id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
            channelId,
            content: content.trim(),
            type: 'TEXT',
            createdAt: new Date().toISOString(),
            senderId: currentUser.id || '__pending__',
            senderUsername: currentUser.username || 'You',
            senderAvatarUrl: currentUser.avatarUrl || null,
            pending: true,
        }

        messages.value.push(pendingMessage)
        return pendingMessage
    }

    const sendMessage = (channelId, content) => {
        if (!stompClient.value || !isConnected.value || !channelId || !content?.trim()) {
            return false
        }

        addPendingMessage(channelId, content)

        stompClient.value.publish({
            destination: `/app/chat/${channelId}/sendMessage`,
            body: JSON.stringify({
                content: content.trim()
            }),
        })

        return true
    }

    const unsubscribeFromChannel = () => {
        if (activeSubscription.value) {
            activeSubscription.value.unsubscribe()
            activeSubscription.value = null
        }
    }

    const sendImage = async (channelId, file) => {
        if (!channelId || !file) return null

        const formData = new FormData()
        formData.append('file', file)

        const {
            data
        } = await api.post(`/api/channels/${channelId}/images`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })

        return data
    }

    const disconnectWebSocket = () => {
        unsubscribeFromChannel()

        if (stompClient.value) {
            stompClient.value.deactivate()
            stompClient.value = null
        }

        isConnected.value = false
    }

    const reset = () => {
        disconnectWebSocket()
        currentChannelId.value = null
        messages.value = []
        error.value = ''
    }

    return {
        currentChannelId,
        messages,
        stompClient,
        activeSubscription,
        isConnected,
        isLoading,
        error,
        fetchMessageHistory,
        connectWebSocket,
        subscribeToChannel,
        unsubscribeFromChannel,
        sendMessage,
        sendImage,
        disconnectWebSocket,
        reset,
    }
})