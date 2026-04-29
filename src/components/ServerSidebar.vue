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

const getDisplayName = (value) => value?.displayName || value?.loginName || value?.username || value?.name || 'Unknown'
const getServerInitial = (server) => {
  return getDisplayName(server).charAt(0).toUpperCase()
}
</script>

<template>
  <aside class="server-sidebar">
    <div class="server-sidebar__content">
      <div
        v-for="server in servers"
        :key="server.id"
        class="server-sidebar__item-wrap"
      >
        <button
          type="button"
          class="server-sidebar__server-button"
          :class="{
            'server-sidebar__server-button--active': currentServerId === server.id,
          }"
          @click="emit('select-server', server.id)"
        >
          <img
            v-if="server.iconUrl"
            :src="server.iconUrl"
            :alt="getDisplayName(server)"
            class="server-sidebar__server-icon"
          />
          <span v-else>{{ getServerInitial(server) }}</span>
        </button>
        <div class="server-sidebar__tooltip" role="tooltip">{{ getDisplayName(server) }}</div>
      </div>

      <div class="server-sidebar__divider"></div>

      <div class="server-sidebar__item-wrap">
        <button
          type="button"
          class="server-sidebar__create-button"
          :disabled="isCreatingServer"
          @click="emit('create-server')"
        >
          <span v-if="!isCreatingServer">+</span>
          <span v-else class="server-sidebar__create-loading">...</span>
        </button>
        <div class="server-sidebar__tooltip" role="tooltip">Tạo server mới</div>
      </div>
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

.server-sidebar__item-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.server-sidebar__tooltip {
  pointer-events: none;
  position: absolute;
  left: calc(100% + 14px);
  top: 50%;
  transform: translateY(-50%) scale(0.88);
  transform-origin: left center;
  background: rgba(14, 18, 30, 0.97);
  border: 1px solid rgba(129, 140, 248, 0.18);
  color: #e8ecf8;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  padding: 7px 13px;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255,255,255,0.04);
  opacity: 0;
  transition:
    opacity 160ms ease,
    transform 160ms ease;
  z-index: 100;
}

.server-sidebar__tooltip::before {
  content: '';
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  border: 6px solid transparent;
  border-right-color: rgba(129, 140, 248, 0.18);
}

.server-sidebar__tooltip::after {
  content: '';
  position: absolute;
  right: calc(100% - 1px);
  top: 50%;
  transform: translateY(-50%);
  border: 6px solid transparent;
  border-right-color: rgba(14, 18, 30, 0.97);
}

.server-sidebar__item-wrap:hover .server-sidebar__tooltip {
  opacity: 1;
  transform: translateY(-50%) scale(1);
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
