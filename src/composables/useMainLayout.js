import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useServerStore } from '@/stores/serverStore'
import { useChatStore } from '@/stores/chatStore'
import { useVoiceStore } from '@/stores/voiceStore'
import { useToast } from '@/composables/useToast'

export const useMainLayout = () => {
  const router = useRouter()
  const authStore = useAuthStore()
  const serverStore = useServerStore()
  const chatStore = useChatStore()
  const voiceStore = useVoiceStore()
  const { showToast } = useToast()

  const targetChannel = ref(null)

  const showCreateServerModal = ref(false)
  const showCreateChannelModal = ref(false)
  const showRenameChannelModal = ref(false)
  const showDeleteChannelModal = ref(false)
  const showEditServerModal = ref(false)
  const showDeleteServerModal = ref(false)

  const currentUser = computed(() => authStore.user || { username: 'Guest' })
  const servers = computed(() => serverStore.servers)
  const channels = computed(() => serverStore.channels)
  const currentServerId = computed(() => serverStore.activeServerId)
  const currentServerName = computed(() => serverStore.activeServer?.name || 'Server')
  const currentChannelId = computed(() => chatStore.currentChannelId)
  const selectedChannel = computed(() => channels.value.find((c) => c.id === chatStore.currentChannelId) || null)
  const currentChannelName = computed(() => {
    const matched = channels.value.find((c) => c.id === chatStore.currentChannelId)
    return matched?.name || 'general'
  })
  const isCurrentChannelVoice = computed(() => selectedChannel.value?.type === 'VOICE')
  const activeVoiceChannel = computed(() => channels.value.find((c) => c.id === voiceStore.activeVoiceChannelId) || null)
  const messages = computed(() => chatStore.messages)

  // Voice channel computed
  const activeVoiceChannelName = computed(() => {
    const id = voiceStore.activeVoiceChannelId
    if (!id) return ''
    const ch = channels.value.find((c) => c.id === id)
    return ch?.name || 'Voice Channel'
  })
  const voiceParticipantCount = computed(() =>
    voiceStore.getParticipantCount(voiceStore.activeVoiceChannelId)
  )

  const getChannelId = (channel) => channel?.id ?? channel?.channelId ?? null

  const assertServerOwner = (actionLabel) => {
    const currentUserId = authStore.user?.id
    const ownerId = serverStore.activeServer?.ownerId

    if (currentUserId !== ownerId) {
      showToast(`Chỉ owner của server mới có quyền ${actionLabel}.`, 'error')
      return false
    }

    return true
  }

  const clearCurrentChannel = () => {
    if (voiceStore.activeVoiceChannelId) {
      voiceStore.leaveVoiceChannel()
    }
    chatStore.unsubscribeFromChannel()
    chatStore.currentChannelId = null
    chatStore.messages = []
  }

  const handleSelectChannel = async (channelId) => {
    if (!channelId) return

    const selected = channels.value.find((channel) => channel.id === channelId)
    const isVoice = selected?.type === 'VOICE'

    if (isVoice) {
      chatStore.unsubscribeFromChannel()
      chatStore.currentChannelId = channelId
      chatStore.messages = []

      const joined = await voiceStore.joinVoiceChannel(channelId)
      if (!joined) {
        showToast('Không thể tham gia voice channel.', 'error')
      }
      return
    }

    await chatStore.fetchMessageHistory(channelId)

    if (chatStore.isConnected) {
      chatStore.subscribeToChannel(channelId)
    }
  }

  const selectFirstChannel = async (channelList) => {
    const firstChannelId = getChannelId(channelList?.[0])

    if (firstChannelId) {
      await handleSelectChannel(firstChannelId)
      return
    }

    clearCurrentChannel()
  }

  const handleSelectServer = async (serverId) => {
    const server = servers.value.find((s) => s.id === serverId)
    if (!server) return

    serverStore.setActiveServer(server)
    const nextChannels = await serverStore.fetchChannelsByServer(serverId)
    await selectFirstChannel(nextChannels)
  }

  const openCreateServerModal = () => {
    showCreateServerModal.value = true
  }

  const openEditServerModal = () => {
    if (!serverStore.activeServerId) {
      showToast('Bạn cần chọn server trước.', 'warning')
      return
    }

    if (!assertServerOwner('chỉnh sửa server')) return

    showEditServerModal.value = true
  }

  const openDeleteServerModal = () => {
    if (!serverStore.activeServerId) {
      showToast('Bạn cần chọn server trước.', 'warning')
      return
    }

    if (!assertServerOwner('xóa server')) return

    showDeleteServerModal.value = true
  }

  const openCreateChannelModal = () => {
    if (!serverStore.activeServerId) {
      showToast('Bạn cần chọn server trước khi tạo channel.', 'warning')
      return
    }

    if (!assertServerOwner('tạo channel')) return

    showCreateChannelModal.value = true
  }

  const openRenameChannelModal = (channel) => {
    if (!channel) return
    if (!assertServerOwner('đổi tên channel')) return

    targetChannel.value = channel
    showRenameChannelModal.value = true
  }

  const openDeleteChannelModal = (channel) => {
    if (!channel) return
    if (!assertServerOwner('xóa channel')) return

    targetChannel.value = channel
    showDeleteChannelModal.value = true
  }

  const handleServerCreated = async (created) => {
    if (!created?.id) return

    const nextChannels = await serverStore.fetchChannelsByServer(created.id)
    await selectFirstChannel(nextChannels)
  }

  const handleChannelCreated = async (created) => {
    const createdId = getChannelId(created)
    if (createdId) {
      await handleSelectChannel(createdId)
    }
  }

  const handleChannelDeleted = async (channelIdToDelete) => {
    if (chatStore.currentChannelId !== channelIdToDelete) return

    if (channels.value.length > 0) {
      await handleSelectChannel(channels.value[0].id)
      return
    }

    clearCurrentChannel()
  }

  const handleServerUpdated = () => {
    showEditServerModal.value = false
  }

  const handleServerDeleted = async () => {
    if (!serverStore.activeServerId) {
      clearCurrentChannel()
      return
    }

    const nextChannels = await serverStore.fetchChannelsByServer(serverStore.activeServerId)
    await selectFirstChannel(nextChannels)
  }

  const handleSendMessage = (content) => {
    if (!chatStore.currentChannelId || !content?.trim()) return

    const wasPublished = chatStore.sendMessage(chatStore.currentChannelId, content)
    if (wasPublished) return

    chatStore.messages.push({
      id: Date.now(),
      senderId: authStore.user?.id,
      senderUsername: currentUser.value?.username || currentUser.value?.email || 'Guest',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    })
  }

  const handleSendImage = async (file) => {
    if (!chatStore.currentChannelId || !file) return

    try {
      await chatStore.sendImage(chatStore.currentChannelId, file)
    } catch (error) {
      showToast(error.response?.data?.message || 'Gửi ảnh thất bại', 'error')
    }
  }

  const handleLeaveVoiceChannel = async () => {
    const leavingChannelId = voiceStore.activeVoiceChannelId
    if (!leavingChannelId) return

    // Kiểm tra người dùng đang xem kênh nào
    const wasViewingVoice = isCurrentChannelVoice.value

    await voiceStore.leaveVoiceChannel()

    // Nếu đang xem TEXT channel → giữ nguyên, không navigate
    if (!wasViewingVoice) return

    // Đang xem VOICE channel → navigate về text channel đầu tiên
    const fallbackTextChannel = channels.value.find((channel) => channel.type !== 'VOICE')
    if (fallbackTextChannel?.id) {
      await handleSelectChannel(fallbackTextChannel.id)
      return
    }

    const fallbackAnyChannel = channels.value.find((channel) => channel.id !== leavingChannelId)
    if (fallbackAnyChannel?.id) {
      await handleSelectChannel(fallbackAnyChannel.id)
      return
    }

    clearCurrentChannel()
  }

  const handleLogout = async () => {
    voiceStore.reset()
    chatStore.reset()
    serverStore.reset()
    authStore.logout()
    await router.push({ name: 'login' })
  }

  onMounted(async () => {
    if (authStore.token) {
      chatStore.connectWebSocket(authStore.token)
    }

    await serverStore.fetchServers()

    if (serverStore.activeServerId) {
      const nextChannels = await serverStore.fetchChannelsByServer(serverStore.activeServerId)
      await selectFirstChannel(nextChannels)
    }
  })

  watch(
    () => chatStore.isConnected,
    async (connected) => {
      if (!connected) return

      const currentUserId = authStore.user?.id
      if (currentUserId) {
        chatStore.subscribeToCallSignals(currentUserId)
      }

      if (chatStore.currentChannelId && !isCurrentChannelVoice.value) {
        chatStore.subscribeToChannel(chatStore.currentChannelId)
      }

      if (voiceStore.activeVoiceChannelId) {
        const rejoined = await voiceStore.rejoinActiveVoiceChannel()
        if (!rejoined) {
          showToast('Không thể khôi phục voice channel sau khi reconnect.', 'warning')
        }
      }
    },
  )

  watch(
    () => chatStore.latestCallSignal,
    async (signal) => {
      if (!signal) return

      const voiceHandled = await voiceStore.handleVoiceSignal(signal)
      if (voiceHandled?.kind === 'error') {
        showToast(voiceHandled.message || 'Lỗi voice channel', 'error')
      }
    },
  )

  return {
    router,
    authStore,
    serverStore,
    chatStore,
    voiceStore,
    targetChannel,
    showCreateServerModal,
    showCreateChannelModal,
    showRenameChannelModal,
    showDeleteChannelModal,
    showEditServerModal,
    showDeleteServerModal,
    currentUser,
    servers,
    channels,
    currentServerId,
    currentServerName,
    currentChannelId,
    currentChannelName,
    isCurrentChannelVoice,
    selectedChannel,
    messages,
    activeVoiceChannelName,
    voiceParticipantCount,
    handleSelectServer,
    handleSelectChannel,
    openCreateServerModal,
    openEditServerModal,
    openDeleteServerModal,
    openCreateChannelModal,
    openRenameChannelModal,
    openDeleteChannelModal,
    handleServerCreated,
    handleChannelCreated,
    handleChannelDeleted,
    handleServerUpdated,
    handleServerDeleted,
    handleSendMessage,
    handleSendImage,
    handleLeaveVoiceChannel,
    handleLogout,
  }
}
