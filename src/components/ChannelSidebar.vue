<script setup>
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

const emit = defineEmits(['select-channel', 'logout', 'invite-user'])
</script>

<template>
  <aside class="channel-sidebar">
    <header class="channel-sidebar__header">
      <h2 class="channel-sidebar__server-name">{{ serverName }}</h2>
      <button
        type="button"
        class="channel-sidebar__invite-button"
        title="Mời user vào server"
        @click="emit('invite-user')"
      >
        Mời
      </button>
    </header>

    <div class="channel-sidebar__channel-list">
      <button
        v-for="channel in channels"
        :key="channel.id"
        type="button"
        class="channel-sidebar__channel-item"
        :class="{
          'channel-sidebar__channel-item--active': currentChannelId === channel.id,
        }"
        @click="emit('select-channel', channel.id)"
      >
        <span class="channel-sidebar__channel-prefix">#</span>
        <span class="channel-sidebar__channel-name">{{ channel.name }}</span>
      </button>
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

      <button
        type="button"
        class="channel-sidebar__logout-button"
        title="Đăng xuất"
        @click="emit('logout')"
      >
        Logout
      </button>
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

.channel-sidebar__invite-button {
  border: none;
  border-radius: 4px;
  background-color: #4f46e5;
  padding: 4px 8px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.channel-sidebar__invite-button:hover {
  background-color: #6366f1;
}

.channel-sidebar__channel-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.channel-sidebar__channel-item {
  margin-bottom: 4px;
  display: flex;
  width: 100%;
  align-items: center;
  border: none;
  border-radius: 6px;
  background: transparent;
  padding: 6px 8px;
  text-align: left;
  color: #d1d5db;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.channel-sidebar__channel-item:hover {
  background-color: #374151;
  color: #f3f4f6;
}

.channel-sidebar__channel-item--active {
  background-color: #374151;
  color: #f3f4f6;
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

.channel-sidebar__logout-button {
  border: none;
  border-radius: 4px;
  background-color: #dc2626;
  padding: 4px 8px;
  color: #ffffff;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.channel-sidebar__logout-button:hover {
  background-color: #ef4444;
}
</style>
