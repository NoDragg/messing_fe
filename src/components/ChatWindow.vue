<script setup>
import { Mic, MicOff, Headphones, HeadphoneOff, PhoneOff, Volume2, PanelLeftOpen, PanelLeftClose, ChevronLeft } from 'lucide-vue-next'
import MessageList from '@/components/chat/MessageList.vue'
import MessageComposer from '@/components/chat/MessageComposer.vue'

defineProps({
  channelName: {
    type: String,
    default: 'general',
  },
  messages: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  // Voice props
  isInVoice: {
    type: Boolean,
    default: false,
  },
  voiceChannelName: {
    type: String,
    default: '',
  },
  muted: {
    type: Boolean,
    default: false,
  },
  deafened: {
    type: Boolean,
    default: false,
  },
  channelSidebarCollapsed: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['send-message', 'send-image', 'voice-mute', 'voice-deafen', 'voice-leave', 'toggle-channel-sidebar', 'back'])
</script>

<template>
  <section class="chat-window">
    <header class="chat-window__header">
      <!-- Mobile back button -->
      <button
        type="button"
        class="chat-window__back-btn"
        title="Quay lại"
        @click="emit('back')"
      >
        <ChevronLeft :size="18" />
      </button>

      <!-- Desktop: toggle channel sidebar -->
      <button
        type="button"
        class="chat-window__toggle-btn"
        :title="channelSidebarCollapsed ? 'Mở danh sách kênh' : 'Thu gọn danh sách kênh'"
        @click="emit('toggle-channel-sidebar')"
      >
        <PanelLeftOpen v-if="channelSidebarCollapsed" :size="17" />
        <PanelLeftClose v-else :size="17" />
      </button>

      <h2 class="chat-window__title"># {{ channelName }}</h2>

      <!-- Voice Controls: chỉ hiện khi đang trong voice channel -->
      <div v-if="isInVoice" class="chat-window__voice-controls">
        <div class="chat-window__voice-label">
          <Volume2 :size="13" />
          <span>{{ voiceChannelName }}</span>
        </div>

        <button
          class="chat-window__voice-btn"
          :class="{ 'chat-window__voice-btn--active': muted }"
          :title="muted ? 'Bỏ tắt tiếng' : 'Tắt tiếng'"
          @click="emit('voice-mute')"
        >
          <MicOff v-if="muted" :size="14" />
          <Mic v-else :size="14" />
        </button>

        <button
          class="chat-window__voice-btn"
          :class="{ 'chat-window__voice-btn--active': deafened }"
          :title="deafened ? 'Bỏ chặn âm thanh' : 'Chặn âm thanh'"
          @click="emit('voice-deafen')"
        >
          <HeadphoneOff v-if="deafened" :size="14" />
          <Headphones v-else :size="14" />
        </button>

        <button
          class="chat-window__voice-btn chat-window__voice-btn--leave"
          title="Rời voice channel"
          @click="emit('voice-leave')"
        >
          <PhoneOff :size="14" />
          <span>Leave</span>
        </button>
      </div>
    </header>

    <MessageList
      :channel-name="channelName"
      :messages="messages"
      :loading="loading"
    />

    <MessageComposer
      :channel-name="channelName"
      @send-message="emit('send-message', $event)"
      @send-image="emit('send-image', $event)"
    />
  </section>
</template>

<style scoped>
.chat-window {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(17, 23, 38, 0.8), rgba(12, 16, 28, 0.94));
  position: relative;
  animation: chat-window-entrance 420ms cubic-bezier(.2,.8,.2,1);
}

.chat-window::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at 20% 0%, rgba(124, 140, 255, 0.08), transparent 30%);
}

.chat-window__header {
  display: flex;
  height: 60px;
  align-items: center;
  border-bottom: 1px solid rgba(148, 163, 184, 0.09);
  padding: 0 14px 0 10px;
  gap: 8px;
  background: rgba(9, 12, 20, 0.38);
  backdrop-filter: blur(16px);
}

.chat-window__toggle-btn,
.chat-window__back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #8897b8;
  padding: 8px;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    color 150ms ease,
    background-color 150ms ease,
    transform 150ms ease;
}

.chat-window__toggle-btn:hover,
.chat-window__back-btn:hover {
  color: #ffffff;
  background: rgba(124, 140, 255, 0.12);
  transform: translateY(-1px);
}

/* Mobile: show back-btn, hide toggle-btn */
.chat-window__back-btn {
  display: none;
}

@media (max-width: 768px) {
  .chat-window__toggle-btn {
    display: none;
  }
  .chat-window__back-btn {
    display: inline-flex;
  }
}

.chat-window__title {
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  color: #f5f7ff;
  letter-spacing: 0.01em;
}

.chat-window__voice-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  animation: ui-fade-up 260ms ease;
}

.chat-window__voice-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #7ef0c6;
  font-weight: 700;
  padding: 0 10px 0 0;
  border-right: 1px solid rgba(148, 163, 184, 0.14);
  margin-right: 2px;
}

.chat-window__voice-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  color: #b2bdd6;
  padding: 8px 10px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition:
    transform var(--transition-fast),
    background-color var(--transition-fast),
    color var(--transition-fast),
    box-shadow var(--transition-fast);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.chat-window__voice-btn:hover {
  background: rgba(124, 140, 255, 0.12);
  color: #ffffff;
  transform: translateY(-1px);
}

.chat-window__voice-btn--active {
  color: #ffb3c0;
  background: rgba(248, 113, 113, 0.14);
  box-shadow: inset 0 0 0 1px rgba(248, 113, 113, 0.16);
}

.chat-window__voice-btn--active:hover {
  background: rgba(248, 113, 113, 0.22);
  color: #ffd5dd;
}

.chat-window__voice-btn--leave {
  color: #ffb3c0;
  background: rgba(248, 113, 113, 0.1);
  padding: 8px 12px;
}

.chat-window__voice-btn--leave:hover {
  background: rgba(220, 38, 38, 0.92);
  color: #ffffff;
}

@keyframes chat-window-entrance {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
