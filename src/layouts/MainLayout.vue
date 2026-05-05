<script setup>
import { ref } from 'vue'
import { Hash, Server, MessageSquare } from 'lucide-vue-next'
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
} = useMainLayout()

const channelSidebarCollapsed = ref(false)
const toggleChannelSidebar = () => {
  channelSidebarCollapsed.value = !channelSidebarCollapsed.value
}

const activeMobileTab = ref('servers')

const onSelectServer = (id) => {
  handleSelectServer(id)
  activeMobileTab.value = 'channels'
}

const onSelectChannel = (id) => {
  handleSelectChannel(id)
  activeMobileTab.value = 'chat'
}

const onMobileBack = () => {
  activeMobileTab.value = 'channels'
}
</script>

<template>
  <div class="main-layout" :class="`main-layout--tab-${activeMobileTab}`">
    <ServerSidebar
      :servers="servers"
      :current-server-id="currentServerId"
      :is-creating-server="serverStore.isCreatingServer"
      class="main-layout__server-sidebar"
      @select-server="onSelectServer"
      @create-server="openCreateServerModal"
    />

    <ChannelSidebar
      :server-name="currentServerName"
      :channels="channels"
      :current-channel-id="currentChannelId"
      :current-user="currentUser"
      :collapsed="channelSidebarCollapsed"
      class="main-layout__channel-sidebar"
      @select-channel="onSelectChannel"
      @rename-channel="openRenameChannelModal"
      @delete-channel="openDeleteChannelModal"
      @edit-server="openEditServerModal"
      @delete-server="openDeleteServerModal"
      @create-channel="openCreateChannelModal"
      @open-settings="router.push({ name: 'settings' })"
      @logout="handleLogout"
    />

    <VoiceChannelPanel
      v-if="isCurrentChannelVoice"
      :channel="selectedChannel"
      :current-user="currentUser"
      :participants="voiceStore.participants"
      :muted="voiceStore.muted"
      :deafened="voiceStore.deafened"
      :screen-sharing="voiceStore.screenSharing"
      :remote-screen-elements="voiceStore.remoteScreenElements"
      :latest-channel-state="voiceStore.latestChannelState"
      :active-screen-track-sid="voiceStore.selectedScreenTrackSid"
      :active-speaker-id="voiceStore.activeSpeakerId"
      class="main-layout__chat-area"
      @toggle-mute="voiceStore.toggleMute"
      @toggle-deafen="voiceStore.toggleDeafen"
      @toggle-screen-share="async () => {
        try {
          const localScreenPublication = voiceStore.room?.localParticipant
            ? Array.from(voiceStore.room.localParticipant.trackPublications.values())
                .find((publication) => publication.track?.source === 'screen_share' || publication.track?.source === 'screenShare' || publication.track?.source === 'screen_share')
            : null
          if (voiceStore.screenSharing || localScreenPublication) {
            await voiceStore.stopScreenShare()
          } else {
            await voiceStore.startScreenShare()
          }
        } catch (error) {
          console.error('[MainLayout] screen share toggle failed', error)
        }
      }"
      @select-user-stream="voiceStore.selectUserStream"
      @leave="handleLeaveVoiceChannel"
    />

    <ChatWindow
      v-else
      :channel-name="currentChannelName"
      :messages="messages"
      :loading="chatStore.isLoading || serverStore.isLoadingChannels"
      :bot-mode="botMode"
      :bot-busy="botBusy"
      :is-in-voice="voiceStore.isInVoiceChannel"
      :voice-channel-name="activeVoiceChannelName"
      :muted="voiceStore.muted"
      :deafened="voiceStore.deafened"
      :channel-sidebar-collapsed="channelSidebarCollapsed"
      class="main-layout__chat-area"
      @send-message="handleSendMessage"
      @send-image="handleSendImage"
      @toggle-bot-mode="handleToggleBotMode"
      @voice-mute="voiceStore.toggleMute"
      @voice-deafen="voiceStore.toggleDeafen"
      @voice-leave="handleLeaveVoiceChannel"
      @toggle-channel-sidebar="toggleChannelSidebar"
      @back="onMobileBack"
    />

    <nav class="main-layout__bottom-nav">
      <button type="button" class="main-layout__tab-btn" :class="{ 'main-layout__tab-btn--active': activeMobileTab === 'servers' }" @click="activeMobileTab = 'servers'">
        <Server :size="20" />
        <span>Servers</span>
      </button>
      <button type="button" class="main-layout__tab-btn" :class="{ 'main-layout__tab-btn--active': activeMobileTab === 'channels' }" @click="activeMobileTab = 'channels'">
        <Hash :size="20" />
        <span>Kênh</span>
      </button>
      <button type="button" class="main-layout__tab-btn" :class="{ 'main-layout__tab-btn--active': activeMobileTab === 'chat' }" @click="activeMobileTab = 'chat'">
        <MessageSquare :size="20" />
        <span>Chat</span>
      </button>
    </nav>

    <CreateServerModal v-model:show="showCreateServerModal" @created="handleServerCreated" />
    <CreateChannelModal v-model:show="showCreateChannelModal" @created="handleChannelCreated" />
    <RenameChannelModal v-model:show="showRenameChannelModal" :channel="targetChannel" />
    <DeleteChannelModal v-model:show="showDeleteChannelModal" :channel="targetChannel" @deleted="handleChannelDeleted" />
    <EditServerModal v-model:show="showEditServerModal" :server="serverStore.activeServer" @updated="handleServerUpdated" />
    <DeleteServerModal v-model:show="showDeleteServerModal" @deleted="handleServerDeleted" />
  </div>
</template>

<style scoped>
.main-layout { display: flex; height: 100vh; width: 100vw; overflow: hidden; position: relative; color: rgb(243 244 246); background: radial-gradient(circle at top, rgba(124, 140, 255, 0.08), transparent 22%), linear-gradient(180deg, rgba(9, 13, 24, 0.98), rgba(5, 8, 22, 0.98)); animation: ui-fade-in 280ms ease; }
.main-layout > * { animation: ui-fade-up 280ms ease both; }
.main-layout__bottom-nav { display: none; }
@media (max-width: 768px) {
  .main-layout { flex-direction: column; padding-bottom: 64px; }
  .main-layout__server-sidebar,
  .main-layout__channel-sidebar,
  .main-layout__chat-area { position: absolute; top: 0; left: 0; width: 100%; height: calc(100% - 64px); transition: opacity 220ms ease, transform 220ms ease; will-change: transform, opacity; }
  .main-layout--tab-servers .main-layout__server-sidebar { opacity: 1; transform: translateX(0); pointer-events: auto; z-index: 10; }
  .main-layout--tab-servers .main-layout__channel-sidebar,
  .main-layout--tab-servers .main-layout__chat-area { opacity: 0; transform: translateX(100%); pointer-events: none; z-index: 5; }
  .main-layout--tab-channels .main-layout__server-sidebar { opacity: 0; transform: translateX(-100%); pointer-events: none; z-index: 5; }
  .main-layout--tab-channels .main-layout__channel-sidebar { opacity: 1; transform: translateX(0); pointer-events: auto; z-index: 10; width: 100% !important; }
  .main-layout--tab-channels .main-layout__chat-area { opacity: 0; transform: translateX(100%); pointer-events: none; z-index: 5; }
  .main-layout--tab-chat .main-layout__server-sidebar,
  .main-layout--tab-chat .main-layout__channel-sidebar { opacity: 0; transform: translateX(-100%); pointer-events: none; z-index: 5; }
  .main-layout--tab-chat .main-layout__chat-area { opacity: 1; transform: translateX(0); pointer-events: auto; z-index: 10; }
  .main-layout__channel-sidebar { width: 100% !important; border-right: none; }
  .main-layout__server-sidebar { width: 100%; border-right: none; padding: 16px; }
  .main-layout__bottom-nav { display: flex; position: fixed; bottom: 0; left: 0; right: 0; height: 64px; z-index: 50; background: rgba(8, 11, 20, 0.96); border-top: 1px solid rgba(129, 140, 248, 0.14); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
}
.main-layout__tab-btn { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; gap: 4px; border: none; background: transparent; color: #6b7a9e; font-size: 11px; font-weight: 600; cursor: pointer; padding: 8px 4px; transition: color 180ms ease, background-color 180ms ease; letter-spacing: 0.02em; }
.main-layout__tab-btn:active { background: rgba(124, 140, 255, 0.08); }
.main-layout__tab-btn--active { color: #a5b4fc; }
.main-layout__tab-btn--active svg { filter: drop-shadow(0 0 6px rgba(124, 140, 255, 0.5)); }
</style>
