import { ref } from 'vue'
import { defineStore } from 'pinia'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client/dist/sockjs'
import api from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { loadRuntimeConfig } from '@/config'

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
  const botBusy = ref(false)
  const botTyping = ref(false)
  const botMode = ref(false)
  const botRequestAbort = ref(null)
  let runtimeConfigPromise = null

  const BOT_COMMAND = '/bot'
  const BOT_ENDPOINT = '/api/bot/chat'

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
      currentChannelId.value = null
      return []
    }

    const token = ++requestToken.value
    isLoading.value = true
    error.value = ''
    messages.value = []
    currentChannelId.value = channelId

    try {
      const { data } = await api.get(`/api/channels/${channelId}/messages`)

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
      connectHeaders: { Authorization: `Bearer ${token}` },
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
    activeSubscription.value = stompClient.value.subscribe(`/topic/channels/${channelId}`, (payload) => {
      const message = JSON.parse(payload.body)

      removePendingMessage(channelId, message)

      const duplicateIndex = messages.value.findIndex((existing) => existing.id === message.id)
      if (duplicateIndex !== -1) {
        messages.value.splice(duplicateIndex, 1, message)
        return
      }

      messages.value.push(message)
    })
  }

  const addPendingMessage = (channelId, content) => {
    const currentUser = authStore.user || {}
    const trimmedContent = content.trim()
    const pendingMessage = {
      id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      channelId,
      content: trimmedContent,
      type: 'TEXT',
      createdAt: new Date().toISOString(),
      senderId: currentUser.id || '__pending__',
      senderUsername: currentUser.loginName || currentUser.username || 'You',
      senderAvatarUrl: currentUser.avatarUrl || null,
      pending: true,
    }

    messages.value.push(pendingMessage)
    return pendingMessage
  }

  const removePendingMessage = (channelId, message) => {
    if (!channelId || !message) return null

    const normalizedIncomingContent = (message.content || '').trim()
    const normalizedIncomingSenderId = message.senderId || message.userId || message.sender?.id || null
    const normalizedIncomingSenderName = message.senderUsername || message.senderDisplayName || message.sender?.username || message.sender?.displayName || null
    const currentUser = authStore.user || {}
    const currentUserId = currentUser.id || null
    const currentUserName = currentUser.loginName || currentUser.username || null

    const pendingIndex = messages.value.findIndex((existing) => {
      if (!existing.pending) return false
      if (existing.channelId !== channelId) return false
      if ((existing.content || '').trim() !== normalizedIncomingContent) return false

      const existingSenderId = existing.senderId || null
      const existingSenderName = existing.senderUsername || existing.senderDisplayName || null

      if (currentUserId && existingSenderId && existingSenderId === currentUserId) return true
      if (currentUserName && existingSenderName && existingSenderName === currentUserName) return true
      if (normalizedIncomingSenderId && existingSenderId && existingSenderId === normalizedIncomingSenderId) return true
      if (normalizedIncomingSenderName && existingSenderName && existingSenderName === normalizedIncomingSenderName) return true

      return false
    })

    if (pendingIndex === -1) return null

    const [removed] = messages.value.splice(pendingIndex, 1)
    return removed
  }

  const setBotTyping = (value) => {
    botTyping.value = Boolean(value)
  }

  const isBotCommand = (content) => {
    const trimmed = content?.trim() || ''
    return trimmed.toLowerCase().startsWith(BOT_COMMAND)
  }

  const extractBotQuestion = (content) => {
    const trimmed = content?.trim() || ''
    if (!trimmed.toLowerCase().startsWith(BOT_COMMAND)) return ''
    return trimmed.slice(BOT_COMMAND.length).trim()
  }

  const setBotMode = (value) => {
    botMode.value = Boolean(value)
  }

  const cancelBotRequest = () => {
    botRequestAbort.value?.abort?.()
    botRequestAbort.value = null
    botBusy.value = false
    botTyping.value = false
  }

  const sendMessage = (channelId, content) => {
    if (!stompClient.value || !isConnected.value || !channelId || !content?.trim()) {
      return false
    }

    addPendingMessage(channelId, content)

    stompClient.value.publish({
      destination: `/app/chat/${channelId}/sendMessage`,
      body: JSON.stringify({ content: content.trim() }),
    })

    return true
  }

  const sendBotMessage = async (channelId, content) => {
    if (!channelId || !content?.trim()) {
      return { ok: false, error: 'empty' }
    }

    const trimmed = content.trim()
    const question = extractBotQuestion(trimmed)
    if (question === '' && isBotCommand(trimmed)) {
      return { ok: false, error: 'missing_question' }
    }

    if (!question) {
      return { ok: false, error: 'not_bot' }
    }

    if (!stompClient.value || !isConnected.value) {
      return { ok: false, error: 'disconnected' }
    }

    if (botBusy.value) {
      return { ok: false, error: 'busy' }
    }

    const pendingMessage = addPendingMessage(channelId, trimmed)
    botBusy.value = true
    botTyping.value = true

    const controller = new AbortController()
    botRequestAbort.value = controller

    try {
      stompClient.value.publish({
        destination: `/app/chat/${channelId}/sendMessage`,
        body: JSON.stringify({ content: trimmed }),
      })

      const response = await fetch(`${api.defaults.baseURL.replace(/\/$/, '')}${BOT_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
        },
        body: JSON.stringify({
          channelId,
          question,
          stream: true,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        let message = 'Bot hiện không phản hồi được, vui lòng thử lại.'
        try {
          const errorBody = await response.json()
          message = errorBody?.message || errorBody?.error || message
        } catch (_parseError) {
          // ignore body parse errors
        }

        throw new Error(message)
      }

      return { ok: true, streaming: true, pendingMessageId: pendingMessage.id }
    } catch (error) {
      removePendingMessage(channelId, pendingMessage)
      return {
        ok: false,
        error,
      }
    } finally {
      botBusy.value = false
      botTyping.value = false
      botRequestAbort.value = null
    }
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

    const { data } = await api.post(`/api/channels/${channelId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return data
  }

  const disconnectWebSocket = () => {
    unsubscribeFromChannel()
    cancelBotRequest()

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
    botMode.value = false
    botBusy.value = false
    botTyping.value = false
  }

  return {
    currentChannelId,
    messages,
    stompClient,
    activeSubscription,
    isConnected,
    isLoading,
    error,
    botMode,
    botBusy,
    botTyping,
    fetchMessageHistory,
    connectWebSocket,
    subscribeToChannel,
    unsubscribeFromChannel,
    sendMessage,
    sendBotMessage,
    sendImage,
    isBotCommand,
    extractBotQuestion,
    setBotMode,
    setBotTyping,
    cancelBotRequest,
    disconnectWebSocket,
    reset,
  }
})
