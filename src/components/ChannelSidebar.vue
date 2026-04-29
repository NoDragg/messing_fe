<script setup>
import { LogOut, Pencil, Trash2, Settings, UserPlus, Volume2, PlusCircle } from 'lucide-vue-next'

import { useServerStore } from '@/stores/serverStore'
import { useToast } from '@/composables/useToast'

defineProps({
  serverName: {
    type: String,
    default: 'Server',
  },
  channels: {
    type: Array,
    default: () => [],
  },
  currentChannelId: {
    type: [String, Number, null],
    default: null,
  },
  currentUser: {
    type: Object,
    default: () => ({ username: 'Guest' }),
  },
  voiceActiveChannelId: {
    type: [String, Number],
    default: null,
  },
  voiceParticipantCounts: {
    type: Object,
    default: () => ({}),
  },
  collapsed: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select-channel', 'rename-channel', 'delete-channel', 'edit-server', 'delete-server', 'open-settings', 'create-channel', 'logout', 'toggle-collapse'])

const serverStore = useServerStore()
const { showToast } = useToast()

const getDisplayName = (user) => user?.displayName || user?.profileName || user?.loginName || user?.username || 'Guest'

const handleInviteUser = async () => {
  if (!serverStore.activeServerId) {
    showToast('Bạn cần chọn server trước khi tạo lời mời.', 'error')
    return
  }

  try {
    const response = await serverStore.createInviteLink(serverStore.activeServerId)
    if (!response?.code) {
      showToast('Không thể tạo mã mời. Vui lòng thử lại.', 'error')
      return
    }

    const inviteText = `${window.location.origin}/invite/${response.code}`

    try {
      await navigator.clipboard.writeText(inviteText)
      showToast(`Đã tạo mã mời ${response.code}. Link đã được copy.`)
    } catch {
      showToast(`Đã tạo mã mời ${response.code}. Không copy được, vui lòng sao chép thủ công.`, 'error')
    }
  } catch (error) {
    showToast(error.response?.data?.message || 'Tạo lời mời thất bại', 'error')
  }
}
</script>

<template>
  <aside class="channel-sidebar" :class="{ 'channel-sidebar--collapsed': collapsed }">
    <header class="channel-sidebar__header">
      <h2 class="channel-sidebar__server-name">{{ serverName }}</h2>
      <div class="channel-sidebar__actions">
        <button
          type="button"
          class="channel-sidebar__icon-button"
          title="Tạo channel"
          @click="emit('create-channel')"
        >
          <PlusCircle :size="16" />
        </button>

        <button
          type="button"
          class="channel-sidebar__icon-button"
          title="Mời user vào server"
          @click="handleInviteUser"
        >
          <UserPlus :size="16" />
        </button>

        <button
          type="button"
          class="channel-sidebar__icon-button"
          title="Chỉnh sửa server"
          @click="emit('edit-server')"
        >
          <Pencil :size="16" />
        </button>

        <button
          type="button"
          class="channel-sidebar__icon-button channel-sidebar__icon-button--danger"
          title="Xóa server"
          @click="emit('delete-server')"
        >
          <Trash2 :size="16" />
        </button>
      </div>
    </header>

    <div class="channel-sidebar__channel-list">
      <div
        v-for="channel in channels"
        :key="channel.id"
        class="channel-sidebar__channel-row"
        :class="{
          'channel-sidebar__channel-row--active': currentChannelId === channel.id,
        }"
      >
        <button
          type="button"
          class="channel-sidebar__channel-item"
          @click="emit('select-channel', channel.id)"
        >
          <span class="channel-sidebar__channel-prefix">
            <Volume2 v-if="channel.type === 'VOICE'" :size="14" />
            <template v-else>#</template>
          </span>
          <span class="channel-sidebar__channel-name">{{ channel.name }}</span>
          <span
            v-if="channel.type === 'VOICE' && ((voiceParticipantCounts[channel.id] || 0) > 0 || voiceActiveChannelId === channel.id)"
            class="channel-sidebar__voice-count"
            :class="{ 'channel-sidebar__voice-count--active': voiceActiveChannelId === channel.id }"
          >
            {{ voiceParticipantCounts[channel.id] || 0 }}
          </span>
        </button>

        <div class="channel-sidebar__channel-actions">
          <button
            type="button"
            class="channel-sidebar__channel-rename-btn"
            title="Đổi tên channel"
            @click="emit('rename-channel', channel)"
          >
            <Pencil :size="14" />
          </button>
          
          <button
            type="button"
            class="channel-sidebar__channel-rename-btn channel-sidebar__channel-delete-btn"
            title="Xóa channel"
            @click="emit('delete-channel', channel)"
          >
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </div>

    <footer class="channel-sidebar__footer">
      <div class="channel-sidebar__user-wrap">
        <img
          v-if="currentUser?.avatarUrl"
          :src="currentUser.avatarUrl"
          alt="Avatar"
          class="channel-sidebar__avatar-image"
        />
        <div v-else class="channel-sidebar__avatar">
          {{ (getDisplayName(currentUser) || 'G').charAt(0).toUpperCase() }}
        </div>
        <div class="channel-sidebar__user-name-wrap">
          <p class="channel-sidebar__user-name">{{ getDisplayName(currentUser) }}</p>
        </div>
      </div>

      <div class="channel-sidebar__actions">
        <button
          type="button"
          class="channel-sidebar__icon-button"
          title="Cài đặt"
          @click="emit('open-settings')"
        >
          <Settings :size="16" />
        </button>

        <button
          type="button"
          class="channel-sidebar__icon-button channel-sidebar__icon-button--danger"
          title="Đăng xuất"
          @click="emit('logout')"
        >
          <LogOut :size="16" />
        </button>
      </div>
    </footer>
  </aside>
</template>

<style scoped>
.channel-sidebar {
  display: flex;
  width: 272px;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(13, 17, 28, 0.96), rgba(11, 14, 24, 0.98));
  border-right: 1px solid rgba(129, 140, 248, 0.12);
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.02);
  overflow: hidden;
  transition: width 240ms cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.channel-sidebar--collapsed {
  width: 0;
  border-right-color: transparent;
}

.channel-sidebar__header {
  display: flex;
  height: 60px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(148, 163, 184, 0.09);
  padding: 0 14px;
  background: rgba(9, 12, 20, 0.4);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.02);
}

.channel-sidebar__server-name {
  overflow: hidden;
  padding-right: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.01em;
}

.channel-sidebar__icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 10px;
  background: transparent;
  padding: 7px;
  color: #b7c3e0;
  cursor: pointer;
  transition:
    transform var(--transition-fast),
    color var(--transition-fast),
    background-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.channel-sidebar__icon-button:hover {
  color: #ffffff;
  background: rgba(124, 140, 255, 0.12);
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.16);
}

.channel-sidebar__icon-button--danger:hover {
  color: #ffd0d8;
  background: rgba(255, 107, 136, 0.14);
}

.channel-sidebar__channel-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 8px 12px;
  animation: channel-list-entrance 520ms cubic-bezier(.2,.8,.2,1);
}

.channel-sidebar__channel-row {
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  border-radius: 14px;
  padding: 0 10px;
  transition:
    transform var(--transition-fast),
    background-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.channel-sidebar__channel-row:hover {
  background: rgba(30, 39, 58, 0.92);
  transform: translateX(2px);
}

.channel-sidebar__channel-row--active {
  background: linear-gradient(90deg, rgba(124, 140, 255, 0.16), rgba(30, 39, 58, 0.94));
  box-shadow: inset 0 0 0 1px rgba(129, 140, 248, 0.12);
}

.channel-sidebar__channel-item {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  border: none;
  background: transparent;
  padding: 10px 2px;
  text-align: left;
  color: #b9c4dc;
  font-size: 14px;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.channel-sidebar__channel-row:hover .channel-sidebar__channel-item,
.channel-sidebar__channel-row--active .channel-sidebar__channel-item {
  color: #f4f7ff;
}

.channel-sidebar__channel-rename-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 10px;
  background: transparent;
  padding: 6px;
  color: #91a0bc;
  cursor: pointer;
  transition:
    transform var(--transition-fast),
    color var(--transition-fast),
    background-color var(--transition-fast);
}

.channel-sidebar__channel-rename-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.04);
  transform: translateY(-1px);
}

.channel-sidebar__channel-actions {
  display: flex;
  align-items: center;
}

.channel-sidebar__channel-delete-btn:hover {
  color: #ffb3c0;
}

.channel-sidebar__channel-prefix {
  margin-right: 8px;
  font-size: 16px;
  color: #7683a6;
}

.channel-sidebar__channel-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.channel-sidebar__voice-count {
  margin-left: 8px;
  border-radius: 9999px;
  background: rgba(17, 24, 39, 0.95);
  color: #d1d9ee;
  font-size: 11px;
  line-height: 1;
  padding: 4px 7px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.channel-sidebar__voice-count--active {
  background: rgba(29, 78, 216, 0.28);
  color: #dbeafe;
  box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.22);
}

.channel-sidebar__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(148, 163, 184, 0.09);
  background: rgba(9, 12, 20, 0.52);
  padding: 10px 12px;
  backdrop-filter: blur(18px);
}

.channel-sidebar__user-wrap {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.channel-sidebar__avatar {
  display: flex;
  height: 32px;
  width: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(124, 140, 255, 0.32), rgba(86, 104, 255, 0.22));
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
}

.channel-sidebar__avatar-image {
  height: 32px;
  width: 32px;
  border-radius: 12px;
  object-fit: cover;
}

.channel-sidebar__user-name-wrap {
  min-width: 0;
}

.channel-sidebar__user-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.channel-sidebar__actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

@keyframes channel-list-entrance {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
