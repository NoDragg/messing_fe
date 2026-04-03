<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useServerStore } from '@/stores/serverStore'
import { useChatStore } from '@/stores/chatStore'
import ServerSidebar from '@/components/ServerSidebar.vue'
import ChannelSidebar from '@/components/ChannelSidebar.vue'
import ChatWindow from '@/components/ChatWindow.vue'

const router = useRouter()
const authStore = useAuthStore()
const serverStore = useServerStore()
const chatStore = useChatStore()

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

const handleCreateServer = async () => {
  const name = window.prompt('Nhập tên server mới:')
  if (!name?.trim()) return

  const payload = { name: name.trim() }
  const created = await serverStore.createServer(payload)

  if (created?.id) {
    const nextChannels = await serverStore.fetchChannelsByServer(created.id)
    const firstChannelId = getChannelId(nextChannels[0])

    if (firstChannelId) {
      await handleSelectChannel(firstChannelId)
    }
  }
}

const handleInviteUser = async () => {
  if (!serverStore.activeServerId) {
    window.alert('Bạn cần chọn server trước khi tạo lời mời.')
    return
  }

  try {
    const response = await serverStore.createInviteLink(serverStore.activeServerId)
    if (!response?.code) {
      window.alert('Không thể tạo mã mời. Vui lòng thử lại.')
      return
    }

    const inviteText = `${window.location.origin}/invite/${response.code}`

    try {
      await navigator.clipboard.writeText(inviteText)
      window.alert(`Đã tạo mã mời: ${response.code}\nLink đã được copy:\n${inviteText}`)
    } catch {
      window.alert(`Đã tạo mã mời: ${response.code}\nLink mời:\n${inviteText}`)
    }
  } catch (error) {
    window.alert(error.response?.data?.message || 'Tạo lời mời thất bại')
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
    const result = await chatStore.sendImage(chatStore.currentChannelId, file)

    if (result) {
      chatStore.messages.push({
        id: result.id || Date.now(),
        senderUsername: result.senderUsername || currentUser.value?.username || currentUser.value?.email || 'Guest',
        imageUrl: result.imageUrl || result.url || result.content,
        content: result.content || '',
        createdAt: result.createdAt || new Date().toISOString(),
      })
    }
  } catch (error) {
    window.alert(error.response?.data?.message || 'Gửi ảnh thất bại')
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
      @create-server="handleCreateServer"
    />

    <ChannelSidebar
      :server-name="currentServerName"
      :channels="channels"
      :current-channel-id="currentChannelId"
      :current-user="currentUser"
      @select-channel="handleSelectChannel"
      @invite-user="handleInviteUser"
      @logout="handleLogout"
    />

    <ChatWindow
      :channel-name="currentChannelName"
      :messages="messages"
      :loading="chatStore.isLoading || serverStore.isLoadingChannels"
      @send-message="handleSendMessage"
      @send-image="handleSendImage"
      @logout="handleLogout"
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
