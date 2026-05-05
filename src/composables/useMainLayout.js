import {
    computed,
    onMounted,
    ref,
    watch
} from 'vue'
import {
    useRouter
} from 'vue-router'
import {
    useAuthStore
} from '@/stores/authStore'
import {
    useServerStore
} from '@/stores/serverStore'
import {
    useChatStore
} from '@/stores/chatStore'
import {
    useVoiceStore
} from '@/stores/voiceStore'
import {
    useToast
} from '@/composables/useToast'

export const useMainLayout = () => {
    const router = useRouter()
    const authStore = useAuthStore()
    const serverStore = useServerStore()
    const chatStore = useChatStore()
    const voiceStore = useVoiceStore()
    const {
        showToast
    } = useToast()

    const targetChannel = ref(null)

    const showCreateServerModal = ref(false)
    const showCreateChannelModal = ref(false)
    const showRenameChannelModal = ref(false)
    const showDeleteChannelModal = ref(false)
    const showEditServerModal = ref(false)
    const showDeleteServerModal = ref(false)

    const currentUser = computed(() => authStore.user || {
        displayName: 'Guest',
        loginName: 'Guest'
    })
    const servers = computed(() => serverStore.servers)
    const channels = computed(() => serverStore.channels)
    const currentServerId = computed(() => serverStore.activeServerId)
    const currentServerName = computed(() => serverStore.activeServer?.name || 'Server')
    const currentChannelId = computed(() => chatStore.currentChannelId)
    const selectedChannel = computed(() => channels.value.find((c) => c.id === chatStore.currentChannelId) || null)
    const currentChannelName = computed(() => channels.value.find((c) => c.id === chatStore.currentChannelId)?.name || 'general')
    const isCurrentChannelVoice = computed(() => selectedChannel.value?.type === 'VOICE')
    const messages = computed(() => chatStore.messages)
    const botMode = computed(() => chatStore.botMode)
    const botBusy = computed(() => chatStore.botBusy)

    const activeVoiceChannelName = computed(() => voiceStore.activeVoiceChannelName || '')

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

    const clearCurrentChannel = async () => {
        if (voiceStore.activeVoiceChannelId) {
            await voiceStore.leaveVoiceChannel()
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
            chatStore.messages = []
            chatStore.currentChannelId = channelId

            const joined = await voiceStore.joinVoiceChannel(channelId, selected?.name || '')
            if (!joined) {
                showToast('Không thể tham gia voice channel.', 'error')
            }
            return
        }

        chatStore.unsubscribeFromChannel()
        chatStore.messages = []
        chatStore.currentChannelId = channelId

        const history = await chatStore.fetchMessageHistory(channelId)

        if (chatStore.isConnected && chatStore.currentChannelId === channelId) {
            chatStore.subscribeToChannel(channelId)
        }

        if (serverStore.activeServerId) {
            serverStore.setLastTextChannelForServer(serverStore.activeServerId, channelId)
        }

        return history
    }

    const selectPreferredChannel = async (serverId, channelList) => {
        const preferredId = serverStore.getPreferredChannelId(serverId, channelList)

        if (preferredId) {
            await handleSelectChannel(preferredId)
            return
        }

        await clearCurrentChannel()
    }

    const handleSelectServer = async (serverId) => {
        const server = servers.value.find((s) => s.id === serverId)
        if (!server) return

        serverStore.setActiveServer(server)
        const nextChannels = await serverStore.fetchChannelsByServer(serverId)
        await selectPreferredChannel(serverId, nextChannels)
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
        await selectPreferredChannel(created.id, nextChannels)
    }

    const handleChannelCreated = async (created) => {
        const createdId = getChannelId(created)
        if (createdId) {
            await handleSelectChannel(createdId)
        }
    }

    const handleChannelDeleted = async (channelIdToDelete) => {
        if (chatStore.currentChannelId !== channelIdToDelete) return

        const nextPreferred = serverStore.getPreferredChannelId(serverStore.activeServerId, channels.value)
        if (nextPreferred) {
            await handleSelectChannel(nextPreferred)
            return
        }

        await clearCurrentChannel()
    }

    const handleServerUpdated = () => {
        showEditServerModal.value = false
    }

    const handleServerDeleted = async () => {
        if (!serverStore.activeServerId) {
            await clearCurrentChannel()
            return
        }

        const nextChannels = await serverStore.fetchChannelsByServer(serverStore.activeServerId)
        const firstChannel = nextChannels?.[0]
        if (firstChannel?.id) {
            await handleSelectChannel(firstChannel.id)
            return
        }

        await clearCurrentChannel()
    }

    const handleToggleBotMode = () => {
        chatStore.setBotMode(!chatStore.botMode)
    }

    const handleSendMessage = async (content) => {
        if (!chatStore.currentChannelId || !content?.trim()) return

        if (isCurrentChannelVoice.value) {
            showToast('Bot chỉ hoạt động trong text channel.', 'warning')
            return
        }

        const trimmed = content.trim()
        const isBot = chatStore.isBotCommand(trimmed) || chatStore.botMode

        if (isBot) {
            const result = await chatStore.sendBotMessage(chatStore.currentChannelId, trimmed)
            if (!result?.ok) {
                if (result?.error === 'missing_question') {
                    showToast('Vui lòng nhập câu hỏi sau /bot.', 'warning')
                    return
                }

                if (result?.error === 'not_bot') {
                    showToast('Lệnh bot không hợp lệ.', 'warning')
                    return
                }

                if (result?.error === 'busy') {
                    showToast('Bot đang trả lời, vui lòng chờ một chút.', 'warning')
                    return
                }

                showToast('Bot hiện không phản hồi được, vui lòng thử lại.', 'error')
            }
            chatStore.setBotMode(false)
            return
        }

        const wasPublished = chatStore.sendMessage(chatStore.currentChannelId, content)
        if (!wasPublished) {
            showToast('Không thể gửi tin nhắn. Vui lòng thử lại.', 'error')
        }
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

        const wasViewingVoice = isCurrentChannelVoice.value

        await voiceStore.leaveVoiceChannel()

        if (!wasViewingVoice) return

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

        await clearCurrentChannel()
    }

    const handleLogout = async () => {
        voiceStore.reset()
        chatStore.reset()
        serverStore.reset()
        authStore.logout()
        await router.push({
            name: 'login'
        })
    }

    onMounted(async () => {
        if (authStore.token) {
            chatStore.connectWebSocket(authStore.token)
        }

        await serverStore.fetchServers()

        if (serverStore.activeServerId) {
            const nextChannels = await serverStore.fetchChannelsByServer(serverStore.activeServerId)
            await selectPreferredChannel(serverStore.activeServerId, nextChannels)
        }
    })

    watch(
        () => chatStore.isConnected,
        async (connected) => {
            if (!connected) return

            if (chatStore.currentChannelId && !isCurrentChannelVoice.value) {
                chatStore.subscribeToChannel(chatStore.currentChannelId)
            }

            if (voiceStore.activeVoiceChannelId) {
                const reloaded = await voiceStore.syncVoiceState(voiceStore.activeVoiceChannelId)
                if (!reloaded) {
                    showToast('Không thể khôi phục voice channel sau khi reconnect.', 'warning')
                }
            }
        },
    )

    return {
        router,
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
        botMode,
        botBusy,
        activeVoiceChannelName,
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
        handleToggleBotMode,
        handleLeaveVoiceChannel,
        handleLogout,
    }
}