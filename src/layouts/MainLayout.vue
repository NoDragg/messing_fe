<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useServerStore } from '@/stores/serverStore'
import { useChatStore } from '@/stores/chatStore'
import { useToast } from '@/composables/useToast'

import ServerSidebar from '@/components/ServerSidebar.vue'
import ChannelSidebar from '@/components/ChannelSidebar.vue'
import ChatWindow from '@/components/ChatWindow.vue'

import CreateServerModal from '@/components/modals/CreateServerModal.vue'
import CreateChannelModal from '@/components/modals/CreateChannelModal.vue'
import RenameChannelModal from '@/components/modals/RenameChannelModal.vue'
import DeleteChannelModal from '@/components/modals/DeleteChannelModal.vue'
import DeleteServerModal from '@/components/modals/DeleteServerModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const serverStore = useServerStore()
const chatStore = useChatStore()
const { showToast } = useToast()

const currentUser = computed(() => authStore.user || { username: 'Guest' })
const servers = computed(() => serverStore.servers)
const channels = computed(() => serverStore.channels)
const currentServerId = computed(() => serverStore.activeServerId)
const currentServerName = computed(() => serverStore.activeServer?.name || 'Server')
const currentChannelId = computed(() => chatStore.currentChannelId)
const currentChannelName = computed(() => {
  const matched = channels.value.find((c) => c.id === chatStore.currentChannelId)
  return matched?.name || 'general'
})
const messages = computed(() => chatStore.messages)

// Modal visibility state
const showCreateServerModal = ref(false)
const showCreateChannelModal = ref(false)
const showRenameChannelModal = ref(false)
const showDeleteChannelModal = ref(false)
const showDeleteServerModal = ref(false)

const targetChannel = ref(null)

const getChannelId = (channel) => channel?.id ?? channel?.channelId ?? null

const handleSelectServer = async (serverId) => {
  const server = servers.value.find((s) => s.id === serverId)
  if (!server) return

  serverStore.setActiveServer(server)
  const nextChannels = await serverStore.fetchChannelsByServer(serverId)

  const firstChannelId = getChannelId(nextChannels[0])
  if (firstChannelId) {
    await handleSelectChannel(firstChannelId)
  } else {
    chatStore.currentChannelId = null
    chatStore.messages = []
  }
}

// Modal open handlers
const openCreateServerModal = () => {
  showCreateServerModal.value = true
}

const openDeleteServerModal = () => {
  if (!serverStore.activeServerId) {
    showToast('Bạn cần chọn server trước.', 'warning')
    return
  }

  const currentUserId = authStore.user?.id
  const ownerId = serverStore.activeServer?.ownerId
  if (currentUserId !== ownerId) {
    showToast('Chỉ owner của server mới có quyền xóa server.', 'error')
    return
  }

  showDeleteServerModal.value = true
}

const openCreateChannelModal = () => {
  if (!serverStore.activeServerId) {
    showToast('Bạn cần chọn server trước khi tạo channel.', 'warning')
    return
  }

  const currentUserId = authStore.user?.id
  const ownerId = serverStore.activeServer?.ownerId
  if (currentUserId !== ownerId) {
    showToast('Chỉ owner của server mới có quyền tạo channel.', 'error')
    return
  }

  showCreateChannelModal.value = true
}

const openRenameChannelModal = (channel) => {
  const currentUserId = authStore.user?.id
  const ownerId = serverStore.activeServer?.ownerId
  if (currentUserId !== ownerId) {
    showToast('Chỉ owner của server mới có quyền đổi tên channel.', 'error')
    return
  }

  if (!channel) return
  targetChannel.value = channel
  showRenameChannelModal.value = true
}

const openDeleteChannelModal = (channel) => {
  const currentUserId = authStore.user?.id
  const ownerId = serverStore.activeServer?.ownerId
  if (currentUserId !== ownerId) {
    showToast('Chỉ owner của server mới có quyền xóa channel.', 'error')
    return
  }

  if (!channel) return
  targetChannel.value = channel
  showDeleteChannelModal.value = true
}

// Logic sau khi tạo/xoá
const handleServerCreated = async (created) => {
  if (created?.id) {
    const nextChannels = await serverStore.fetchChannelsByServer(created.id)
    const firstChannelId = getChannelId(nextChannels[0])

    if (firstChannelId) {
      await handleSelectChannel(firstChannelId)
    }
  }
}

const handleChannelCreated = async (created) => {
  const createdId = getChannelId(created)
  if (createdId) {
    await handleSelectChannel(createdId)
  }
}

const handleChannelDeleted = async (channelIdToDelete) => {
  if (chatStore.currentChannelId === channelIdToDelete) {
    if (channels.value.length > 0) {
      await handleSelectChannel(channels.value[0].id)
    } else {
      chatStore.currentChannelId = null
      chatStore.messages = []
    }
  }
}

const handleServerDeleted = async () => {
  if (serverStore.activeServerId) {
    const nextChannels = await serverStore.fetchChannelsByServer(serverStore.activeServerId)
    const firstChannelId = getChannelId(nextChannels[0])
    if (firstChannelId) {
      await handleSelectChannel(firstChannelId)
    }
  } else {
    chatStore.currentChannelId = null
    chatStore.messages = []
  }
}

const handleSelectChannel = async (channelId) => {
  if (!channelId) return

  await chatStore.fetchMessageHistory(channelId)

  if (chatStore.isConnected) {
    chatStore.subscribeToChannel(channelId)
  }
}

const handleSendMessage = (content) => {
  if (!chatStore.currentChannelId || !content?.trim()) return

  const wasPublished = chatStore.sendMessage(chatStore.currentChannelId, content)

  if (!wasPublished) {
    chatStore.messages.push({
      id: Date.now(),
      senderUsername: currentUser.value?.username || currentUser.value?.email || 'Guest',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    })
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

const handleLogout = async () => {
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
    const firstChannelId = getChannelId(nextChannels[0])

    if (firstChannelId) {
      await handleSelectChannel(firstChannelId)
    }
  }
})

watch(
  () => chatStore.isConnected,
  (connected) => {
    if (connected && chatStore.currentChannelId) {
      chatStore.subscribeToChannel(chatStore.currentChannelId)
    }
  },
)
</script>

<template>
  <div class="main-layout">
    <ServerSidebar
      :servers="servers"
      :current-server-id="currentServerId"
      :is-creating-server="serverStore.isCreatingServer"
      @select-server="handleSelectServer"
      @create-server="openCreateServerModal"
    />

    <ChannelSidebar
      :server-name="currentServerName"
      :channels="channels"
      :current-channel-id="currentChannelId"
      :current-user="currentUser"
      @select-channel="handleSelectChannel"
      @rename-channel="openRenameChannelModal"
      @delete-channel="openDeleteChannelModal"
      @delete-server="openDeleteServerModal"
      @create-channel="openCreateChannelModal"
      @open-settings="router.push({ name: 'settings' })"
      @logout="handleLogout"
    />

    <ChatWindow
      :channel-name="currentChannelName"
      :messages="messages"
      :loading="chatStore.isLoading || serverStore.isLoadingChannels"
      @send-message="handleSendMessage"
      @send-image="handleSendImage"
    />

    <CreateServerModal
      v-model:show="showCreateServerModal"
      @created="handleServerCreated"
    />

    <CreateChannelModal
      v-model:show="showCreateChannelModal"
      @created="handleChannelCreated"
    />

    <RenameChannelModal
      v-model:show="showRenameChannelModal"
      :channel="targetChannel"
    />

    <DeleteChannelModal
      v-model:show="showDeleteChannelModal"
      :channel="targetChannel"
      @deleted="handleChannelDeleted"
    />

    <DeleteServerModal
      v-model:show="showDeleteServerModal"
      @deleted="handleServerDeleted"
    />
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: rgb(17 24 39);
  color: rgb(243 244 246);
}
</style>
