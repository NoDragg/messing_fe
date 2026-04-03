<script setup>
import { Hash, LogOut, Pencil, Trash2, Settings, UserPlus } from 'lucide-vue-next'

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
})

const emit = defineEmits(['select-channel', 'rename-channel', 'delete-channel', 'delete-server', 'open-settings', 'create-channel', 'logout'])

const serverStore = useServerStore()
const { showToast } = useToast()

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
  <aside class="channel-sidebar">
    <header class="channel-sidebar__header">
      <h2 class="channel-sidebar__server-name">{{ serverName }}</h2>
      <div class="channel-sidebar__actions">
        <button
          type="button"
          class="channel-sidebar__icon-button"
          title="Tạo channel"
          @click="emit('create-channel')"
        >
          <Hash :size="16" />
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
          <span class="channel-sidebar__channel-prefix">#</span>
          <span class="channel-sidebar__channel-name">{{ channel.name }}</span>
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
        <div class="channel-sidebar__avatar">
          {{ (currentUser?.username || 'G').charAt(0).toUpperCase() }}
        </div>
        <div class="channel-sidebar__user-name-wrap">
          <p class="channel-sidebar__user-name">{{ currentUser?.username || 'Guest' }}</p>
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
  width: 240px;
  flex-direction: column;
  background-color: #1f2937;
}

.channel-sidebar__header {
  display: flex;
  height: 56px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #374151;
  padding: 0 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.channel-sidebar__server-name {
  overflow: hidden;
  padding-right: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.channel-sidebar__icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  padding: 4px;
  color: #cbd5e1;
  cursor: pointer;
  transition: color 0.2s ease;
}

.channel-sidebar__icon-button:hover {
  color: #ffffff;
}

.channel-sidebar__icon-button--danger:hover {
  color: #f87171;
}

.channel-sidebar__channel-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.channel-sidebar__channel-row {
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  border-radius: 6px;
  padding: 0 6px;
  transition: background-color 0.2s ease;
}

.channel-sidebar__channel-row:hover {
  background-color: #374151;
}

.channel-sidebar__channel-row--active {
  background-color: #374151;
}

.channel-sidebar__channel-item {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  border: none;
  background: transparent;
  padding: 6px 2px;
  text-align: left;
  color: #d1d5db;
  font-size: 14px;
  cursor: pointer;
}

.channel-sidebar__channel-row:hover .channel-sidebar__channel-item,
.channel-sidebar__channel-row--active .channel-sidebar__channel-item {
  color: #f3f4f6;
}

.channel-sidebar__channel-rename-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  padding: 4px;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.2s ease;
}

.channel-sidebar__channel-rename-btn:hover {
  color: #ffffff;
}

.channel-sidebar__channel-actions {
  display: flex;
  align-items: center;
}

.channel-sidebar__channel-delete-btn:hover {
  color: #f87171;
}

.channel-sidebar__channel-prefix {
  margin-right: 8px;
  font-size: 16px;
  color: #6b7280;
}

.channel-sidebar__channel-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.channel-sidebar__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #374151;
  background-color: rgba(17, 24, 39, 0.6);
  padding: 8px 12px;
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
  border-radius: 9999px;
  background-color: #6366f1;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
}

.channel-sidebar__user-name-wrap {
  min-width: 0;
}

.channel-sidebar__user-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
}

.channel-sidebar__actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
