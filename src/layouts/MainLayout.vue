<script setup>
import { useMainLayout } from '@/composables/useMainLayout'

import ServerSidebar from '@/components/ServerSidebar.vue'
import ChannelSidebar from '@/components/ChannelSidebar.vue'
import ChatWindow from '@/components/ChatWindow.vue'
import VoiceChannelPanel from '@/components/voice/VoiceChannelPanel.vue'

import CreateServerModal from '@/components/modals/CreateServerModal.vue'
import CreateChannelModal from '@/components/modals/CreateChannelModal.vue'
import RenameChannelModal from '@/components/modals/RenameChannelModal.vue'
import DeleteChannelModal from '@/components/modals/DeleteChannelModal.vue'
import EditServerModal from '@/components/modals/EditServerModal.vue'
import DeleteServerModal from '@/components/modals/DeleteServerModal.vue'

const {
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
  handleLeaveVoiceChannel,
  handleLogout,
} = useMainLayout()
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
      @edit-server="openEditServerModal"
      @delete-server="openDeleteServerModal"
      @create-channel="openCreateChannelModal"
      @open-settings="router.push({ name: 'settings' })"
      @logout="handleLogout"
    />

    <!-- Voice Channel Panel -->
    <VoiceChannelPanel
      v-if="isCurrentChannelVoice"
      :channel="selectedChannel"
      :current-user="currentUser"
      :participants="voiceStore.participants"
      :remote-streams="voiceStore.remoteStreams"
      :speaking-user-ids="voiceStore.speakingUserIds"
      :session-id="voiceStore.activeSessionId"
      :is-session-starter="voiceStore.isSessionStarter"
      :muted="voiceStore.muted"
      :deafened="voiceStore.deafened"
      @toggle-mute="voiceStore.toggleMute"
      @toggle-deafen="voiceStore.toggleDeafen"
      @leave="handleLeaveVoiceChannel"
    />

    <!-- Text Chat Window với voice controls tích hợp trong header -->
    <ChatWindow
      v-else
      :channel-name="currentChannelName"
      :messages="messages"
      :loading="chatStore.isLoading || serverStore.isLoadingChannels"
      :is-in-voice="voiceStore.isInVoiceChannel"
      :voice-channel-name="activeVoiceChannelName"
      :muted="voiceStore.muted"
      :deafened="voiceStore.deafened"
      @send-message="handleSendMessage"
      @send-image="handleSendImage"
      @voice-mute="voiceStore.toggleMute"
      @voice-deafen="voiceStore.toggleDeafen"
      @voice-leave="handleLeaveVoiceChannel"
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

    <EditServerModal
      v-model:show="showEditServerModal"
      :server="serverStore.activeServer"
      @updated="handleServerUpdated"
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
  position: relative;
}
</style>
