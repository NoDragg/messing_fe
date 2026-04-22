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
  width: 84px;
  background: linear-gradient(180deg, rgba(10, 14, 24, 0.94), rgba(7, 10, 18, 0.96));
  border-right: 1px solid rgba(129, 140, 248, 0.12);
  padding: 14px 12px;
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.02);
}

.server-sidebar__content {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  overflow-y: auto;
  animation: sidebar-entrance 420ms cubic-bezier(.2,.8,.2,1);
}

.server-sidebar__server-button,
.server-sidebar__create-button {
  position: relative;
  display: flex;
  height: 52px;
  width: 52px;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 18px;
  background: rgba(25, 31, 47, 0.98);
  color: var(--text);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform var(--transition-fast),
    border-radius var(--transition-fast),
    background-color var(--transition-fast),
    box-shadow var(--transition-fast),
    color var(--transition-fast);
  overflow: hidden;
  padding: 0;
  line-height: 0;
  appearance: none;
  -webkit-appearance: none;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.server-sidebar__server-icon {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
  flex-shrink: 0;
}

.server-sidebar__server-button:hover,
.server-sidebar__create-button:hover {
  background: linear-gradient(180deg, rgba(124, 140, 255, 0.22), rgba(86, 104, 255, 0.18));
  transform: translateY(-2px);
  border-radius: 16px;
  box-shadow: 0 14px 30px rgba(12, 18, 34, 0.45), 0 0 0 1px rgba(124, 140, 255, 0.16);
}

.server-sidebar__server-button--active {
  background: linear-gradient(180deg, rgba(124, 140, 255, 0.34), rgba(86, 104, 255, 0.22));
  box-shadow: 0 16px 30px rgba(20, 28, 48, 0.55), 0 0 0 1px rgba(165, 180, 252, 0.28), 0 0 0 6px rgba(124, 140, 255, 0.08);
  animation: ui-glow-pulse 2.8s ease-in-out infinite;
}

.server-sidebar__divider {
  margin: 4px 0;
  height: 1px;
  width: 34px;
  background: linear-gradient(90deg, transparent, rgba(129, 140, 248, 0.42), transparent);
}

.server-sidebar__create-button {
  background: linear-gradient(180deg, rgba(29, 185, 129, 0.9), rgba(18, 154, 106, 0.9));
  color: #effaf7;
}

.server-sidebar__create-button:hover {
  background: linear-gradient(180deg, rgba(45, 212, 191, 0.9), rgba(18, 154, 106, 0.96));
}

.server-sidebar__create-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}

.server-sidebar__create-loading {
  font-size: 14px;
}

@keyframes sidebar-entrance {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
