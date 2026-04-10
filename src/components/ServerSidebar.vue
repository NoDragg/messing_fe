<script setup>
defineProps({
  servers: {
    type: Array,
    default: () => [],
  },
  currentServerId: {
    type: [String, Number, null],
    default: null,
  },
  isCreatingServer: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select-server', 'create-server'])

const getServerInitial = (server) => {
  return (server?.name || 'S').charAt(0).toUpperCase()
}
</script>

<template>
  <aside class="server-sidebar">
    <div class="server-sidebar__content">
      <button
        v-for="server in servers"
        :key="server.id"
        type="button"
        :title="server.name"
        class="server-sidebar__server-button"
        :class="{
          'server-sidebar__server-button--active': currentServerId === server.id,
        }"
        @click="emit('select-server', server.id)"
      >
        <img
          v-if="server.iconUrl"
          :src="server.iconUrl"
          :alt="server.name"
          class="server-sidebar__server-icon"
        />
        <span v-else>{{ getServerInitial(server) }}</span>
      </button>

      <div class="server-sidebar__divider"></div>

      <button
        type="button"
        class="server-sidebar__create-button"
        :disabled="isCreatingServer"
        title="Tạo server mới"
        @click="emit('create-server')"
      >
        <span v-if="!isCreatingServer">+</span>
        <span v-else class="server-sidebar__create-loading">...</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.server-sidebar {
  width: 72px;
  background-color: #111827;
  padding: 12px;
}

.server-sidebar__content {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  overflow-y: auto;
}

.server-sidebar__server-button {
  position: relative;
  display: flex;
  height: 48px;
  width: 48px;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 9999px;
  background-color: #374151;
  color: #f3f4f6;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  padding: 0;
  line-height: 0;
  appearance: none;
  -webkit-appearance: none;
}

.server-sidebar__server-icon {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
  flex-shrink: 0;
}

.server-sidebar__server-button:hover {
  background-color: #6366f1;
  transform: translateY(-1px);
}

.server-sidebar__server-button--active {
  background-color: #6366f1;
  box-shadow: 0 0 0 2px #a5b4fc;
}

.server-sidebar__divider {
  margin: 4px 0;
  height: 1px;
  width: 32px;
  background-color: #374151;
}

.server-sidebar__create-button {
  display: flex;
  height: 48px;
  width: 48px;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 9999px;
  background-color: #059669;
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.server-sidebar__create-button:hover {
  border-radius: 12px;
  background-color: #10b981;
}

.server-sidebar__create-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.server-sidebar__create-loading {
  font-size: 14px;
}
</style>
