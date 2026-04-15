import { ref } from 'vue'
import { defineStore } from 'pinia'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client/dist/sockjs'
import api from '@/services/api'
import { loadRuntimeConfig } from '@/config'

export const useChatStore = defineStore('chat', () => {
  const currentChannelId = ref(null)
  const messages = ref([])
  const stompClient = ref(null)
  const activeSubscription = ref(null)
  const callSignalSubscription = ref(null)
  const latestCallSignal = ref(null)
  const isConnected = ref(false)
  const isLoading = ref(false)
  const isDemoing = ref(false)
  let demoInterval = null
  const error = ref('')
  let runtimeConfigPromise = null

  const getWsUrl = async () => {
    if (!runtimeConfigPromise) {
      runtimeConfigPromise = loadRuntimeConfig()
    }

    const { wsBaseUrl } = await runtimeConfigPromise
    return `${wsBaseUrl.replace(/\/$/, '')}/ws`
  }

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

  const unsubscribeFromChannel = () => {
    if (activeSubscription.value) {
      activeSubscription.value.unsubscribe()
      activeSubscription.value = null
    }
  }

  const subscribeToCallSignals = (userId) => {
    if (!stompClient.value || !isConnected.value || !userId) {
      return
    }

    if (callSignalSubscription.value) {
      callSignalSubscription.value.unsubscribe()
      callSignalSubscription.value = null
    }

    callSignalSubscription.value = stompClient.value.subscribe(
      `/queue/call-signals/${userId}`,
      (payload) => {
        latestCallSignal.value = JSON.parse(payload.body)
      },
    )
  }

  const sendCallSignal = (payload) => {
    if (!stompClient.value || !isConnected.value || !payload?.toUserId || !payload?.roomId || !payload?.type) {
      return false
    }

    stompClient.value.publish({
      destination: '/app/call/signal',
      body: JSON.stringify(payload),
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
    unsubscribeFromChannel()

    if (callSignalSubscription.value) {
      callSignalSubscription.value.unsubscribe()
      callSignalSubscription.value = null
    }

    if (stompClient.value) {
      stompClient.value.deactivate()
      stompClient.value = null
    }

    isConnected.value = false
  }

  const reset = () => {
    if (isDemoing.value) toggleDemoTraffic()
    disconnectWebSocket()
    currentChannelId.value = null
    messages.value = []
    latestCallSignal.value = null
    error.value = ''
  }

  const toggleDemoTraffic = () => {
    isDemoing.value = !isDemoing.value
    if (!isDemoing.value) {
      if (demoInterval) clearInterval(demoInterval)
      demoInterval = null
    } else {
      const fakeNames = ['Hải Yến', 'Minh Tuấn', 'Quốc Bảo', 'Lan Anh', 'Thanh Trúc', 'Hoàng Nam', 'Đức Mạnh', 'Mai Phương']
      const fakeMessages = [
        'Chào mọi người nhé!', 'Dự án sao rồi ae?', 'Chiều nay họp lúc mấy giờ nhỉ?',
        'Có ai giúp mình cái bug này được không?', 'UI/UX trông mượt phết', 
        'Vừa push code xong, ae check nhé', 'Tí đi cafe không ae?', 'Ok chốt vậy đi',
        'Quá đẳng cấp!', 'Haha đỉnh thật =)))', 'Thấy cũng ổn rồi đấy', 'Mình đang review code, chờ tý nhé.'
      ]
      demoInterval = setInterval(() => {
        if (!currentChannelId.value) return
        messages.value.push({
          id: Date.now() + Math.random(),
          senderId: 'demo-' + Math.floor(Math.random() * 1000),
          senderUsername: fakeNames[Math.floor(Math.random() * fakeNames.length)],
          content: fakeMessages[Math.floor(Math.random() * fakeMessages.length)],
          createdAt: new Date().toISOString(),
          isDemo: true
        })
      }, 600)
    }
  }

  return {
    currentChannelId,
    messages,
    stompClient,
    activeSubscription,
    callSignalSubscription,
    latestCallSignal,
    isConnected,
    isLoading,
    error,
    fetchMessageHistory,
    connectWebSocket,
    subscribeToChannel,
    unsubscribeFromChannel,
    subscribeToCallSignals,
    sendMessage,
    sendCallSignal,
    sendImage,
    disconnectWebSocket,
    reset,
    isDemoing,
    toggleDemoTraffic,
  }
})
