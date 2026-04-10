<script setup>
import { Mic, MicOff, Headphones, HeadphoneOff, PhoneOff, Volume2 } from 'lucide-vue-next'
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
})

const emit = defineEmits(['send-message', 'send-image', 'voice-mute', 'voice-deafen', 'voice-leave'])
</script>

<template>
  <section class="chat-window">
    <header class="chat-window__header">
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
  flex-direction: column;
  background-color: #374151;
}

.chat-window__header {
  display: flex;
  height: 56px;
  align-items: center;
  border-bottom: 1px solid #4b5563;
  padding: 0 16px;
  gap: 12px;
}

.chat-window__title {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  flex: 1;
}

/* Voice Controls */
.chat-window__voice-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.chat-window__voice-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #4ade80;
  font-weight: 600;
  padding: 0 8px;
  border-right: 1px solid #4b5563;
  margin-right: 2px;
}

.chat-window__voice-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: none;
  border-radius: 6px;
  background-color: transparent;
  color: #9ca3af;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.chat-window__voice-btn:hover {
  background-color: #4b5563;
  color: #ffffff;
}

.chat-window__voice-btn--active {
  color: #f87171;
  background-color: rgba(248, 113, 113, 0.12);
}

.chat-window__voice-btn--active:hover {
  background-color: rgba(248, 113, 113, 0.22);
  color: #fca5a5;
}

.chat-window__voice-btn--leave {
  color: #f87171;
  background-color: rgba(248, 113, 113, 0.1);
  padding: 6px 10px;
}

.chat-window__voice-btn--leave:hover {
  background-color: #dc2626;
  color: #ffffff;
}
</style>
