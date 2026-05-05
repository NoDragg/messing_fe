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
  const botMode = ref(false)
  const botPlaceholderId = ref(null)
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
    activeSubscription.value = stompClient.value.subscribe(`/topic/channels/${channelId}`, (payload) => {
      const message = JSON.parse(payload.body)

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
    const pendingMessage = {
      id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      channelId,
      content: content.trim(),
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

  const normalizeBotStreamChunk = (chunk) => {
    if (chunk == null) return ''
    if (typeof chunk === 'string') return chunk
    if (typeof chunk?.content === 'string') return chunk.content
    if (typeof chunk?.delta === 'string') return chunk.delta
    if (typeof chunk?.text === 'string') return chunk.text
    if (typeof chunk?.data === 'string') return chunk.data
    return ''
  }

  const upsertBotPlaceholder = (channelId, question) => {
    const placeholderId = `bot-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const botMessage = {
      id: placeholderId,
      channelId,
      content: question,
      type: 'TEXT',
      createdAt: new Date().toISOString(),
      senderId: 'bot',
      senderUsername: 'Bot',
      senderDisplayName: 'Bot',
      senderAvatarUrl: null,
      bot: true,
      streaming: true,
      pending: true,
    }

    messages.value.push(botMessage)
    botPlaceholderId.value = placeholderId
    return botMessage
  }

  const updateBotPlaceholder = (messageId, patch = {}) => {
    const index = messages.value.findIndex((message) => message.id === messageId)
    if (index === -1) return null

    messages.value[index] = {
      ...messages.value[index],
      ...patch,
    }

    return messages.value[index]
  }

  const appendBotChunk = (chunk) => {
    if (!botPlaceholderId.value) return null
    const text = normalizeBotStreamChunk(chunk)
    if (!text) return null

    const current = messages.value.find((message) => message.id === botPlaceholderId.value)
    if (!current) return null

    return updateBotPlaceholder(botPlaceholderId.value, {
      content: `${current.content || ''}${text}`,
      pending: false,
      streaming: true,
    })
  }

  const finalizeBotMessage = (messageId, { content, errorMessage } = {}) => {
    if (!messageId) return null
    const patch = {
      pending: false,
      streaming: false,
    }
    if (typeof content === 'string') patch.content = content
    if (errorMessage) {
      patch.error = true
      patch.content = errorMessage
    }
    const updated = updateBotPlaceholder(messageId, patch)
    if (botPlaceholderId.value === messageId) {
      botPlaceholderId.value = null
    }
    botBusy.value = false
    botRequestAbort.value = null
    return updated
  }

  const sendMessage = (channelId, content) => {
    if (!stompClient.value || !isConnected.value || !channelId || !content?.trim()) {
      return false
    }

    addPendingMessage(channelId, content)

    stompClient.value.publish({
      destination: `/app/chat/${channelId}/sendMessage`,
      body: JSON.stringify({
        content: content.trim(),
      }),
    })

    return true
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
  }

  const sendBotMessage = async (channelId, content) => {
    if (!channelId || !content?.trim()) {
      return {
        ok: false,
        error: 'empty',
      }
    }

    const question = extractBotQuestion(content)
    if (question === '' && isBotCommand(content)) {
      return {
        ok: false,
        error: 'missing_question',
      }
    }

    if (!question) {
      return {
        ok: false,
        error: 'not_bot',
      }
    }

    if (botBusy.value) {
      return {
        ok: false,
        error: 'busy',
      }
    }

    const placeholder = upsertBotPlaceholder(channelId, '')
    botBusy.value = true
    const controller = new AbortController()
    botRequestAbort.value = controller

    try {
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

      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('text/event-stream') || contentType.includes('text/plain')) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''

        if (reader) {
          while (true) {
            const { value, done } = await reader.read()
            if (done) break

            const chunkText = decoder.decode(value, { stream: true })
            const lines = chunkText.split(/\r?\n/).filter(Boolean)
            lines.forEach((line) => {
              const cleaned = line.replace(/^data:\s*/i, '')
              if (!cleaned || cleaned === '[DONE]') return
              accumulated += cleaned
              appendBotChunk(cleaned)
            })
          }
        }

        finalizeBotMessage(placeholder.id, { content: accumulated.trim() })
        return { ok: true, streaming: true }
      }

      const payload = await response.json().catch(async () => {
        const text = await response.text()
        return text
      })

      if (typeof payload === 'string') {
        finalizeBotMessage(placeholder.id, { content: payload })
        return { ok: true, streaming: false }
      }

      if (payload && typeof payload === 'object') {
        const finalContent = payload.content || payload.message || payload.answer || payload.data || ''
        finalizeBotMessage(placeholder.id, { content: finalContent })
        return { ok: true, streaming: false }
      }

      finalizeBotMessage(placeholder.id, { content: question })
      return { ok: true, streaming: false }
    } catch (error) {
      finalizeBotMessage(placeholder?.id, {
        errorMessage: error?.message || error?.response?.data?.message || 'Bot hiện không phản hồi được, vui lòng thử lại.',
      })
      return {
        ok: false,
        error,
      }
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
    botPlaceholderId.value = null
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
    cancelBotRequest,
    appendBotChunk,
    finalizeBotMessage,
    disconnectWebSocket,
    reset,
  }
})
