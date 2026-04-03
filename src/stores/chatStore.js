import { ref } from 'vue'
import { defineStore } from 'pinia'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client/dist/sockjs'
import api from '@/services/api'

export const useChatStore = defineStore('chat', () => {
  const currentChannelId = ref(null)
  const messages = ref([])
  const stompClient = ref(null)
  const activeSubscription = ref(null)
  const isConnected = ref(false)
  const isLoading = ref(false)
  const error = ref('')

  const fetchMessageHistory = async (channelId) => {
    if (!channelId) {
      messages.value = []
      return []
    }

    isLoading.value = true
    error.value = ''

    try {
      const { data } = await api.get(`/api/channels/${channelId}/messages`)
      const content = Array.isArray(data) ? data : data?.content
      messages.value = Array.isArray(content) ? [...content].reverse() : []
      currentChannelId.value = channelId
      return messages.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Không thể tải lịch sử tin nhắn.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const connectWebSocket = (token) => {
    if (!token || stompClient.value?.connected) {
      return
    }

    error.value = ''

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
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
        messages.value.push(message)
      },
    )
  }

  const sendMessage = (channelId, content) => {
    if (!stompClient.value || !isConnected.value || !channelId || !content?.trim()) {
      return false
    }

    stompClient.value.publish({
      destination: `/app/chat/${channelId}/sendMessage`,
      body: JSON.stringify({ content: content.trim() }),
    })

    return true
  }

  const sendImage = async (channelId, file) => {
    if (!channelId || !file) return null

    const formData = new FormData()
    formData.append('file', file)

    const { data } = await api.post(`/api/channels/${channelId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return data
  }

  const disconnectWebSocket = () => {
    if (activeSubscription.value) {
      activeSubscription.value.unsubscribe()
      activeSubscription.value = null
    }

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
    sendMessage,
    sendImage,
    disconnectWebSocket,
    reset,
  }
})
