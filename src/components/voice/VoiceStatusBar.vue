<script setup>
import { Mic, MicOff, Headphones, PhoneOff, Volume2 } from 'lucide-vue-next'

defineProps({
  channelName: {
    type: String,
    default: 'Voice Channel',
  },
  participantCount: {
    type: Number,
    default: 0,
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

const emit = defineEmits(['toggle-mute', 'toggle-deafen', 'leave', 'open-voice-channel'])
</script>

<template>
  <div class="voice-status-bar">
    <button
      type="button"
      class="voice-status-bar__meta"
      @click="emit('open-voice-channel')"
      title="Mở voice channel đang tham gia"
    >
      <Volume2 :size="16" />
      <div class="voice-status-bar__meta-text">
        <p class="voice-status-bar__title">{{ channelName }}</p>
        <p class="voice-status-bar__subtitle">{{ participantCount }} người đang trong voice</p>
      </div>
    </button>

    <div class="voice-status-bar__controls">
      <button
        type="button"
        class="voice-status-bar__btn"
        :class="{ 'voice-status-bar__btn--danger': muted }"
        @click="emit('toggle-mute')"
      >
        <MicOff v-if="muted" :size="14" />
        <Mic v-else :size="14" />
        {{ muted ? 'Unmute' : 'Mute' }}
      </button>

      <button
        type="button"
        class="voice-status-bar__btn"
        :class="{ 'voice-status-bar__btn--danger': deafened }"
        @click="emit('toggle-deafen')"
      >
        <Headphones :size="14" />
        {{ deafened ? 'Undeafen' : 'Deafen' }}
      </button>

      <button
        type="button"
        class="voice-status-bar__btn voice-status-bar__btn--danger"
        @click="emit('leave')"
      >
        <PhoneOff :size="14" />
        Leave
      </button>
    </div>
  </div>
</template>

<style scoped>
.voice-status-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 56px;
  border-top: 1px solid #4b5563;
  background-color: rgba(17, 24, 39, 0.96);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 20;
}

.voice-status-bar__meta {
  border: none;
  background: transparent;
  color: #e5e7eb;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: background-color 0.15s ease;
}

.voice-status-bar__meta:hover {
  background-color: rgba(255,255,255,0.06);
  color: #ffffff;
}

.voice-status-bar__meta-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.voice-status-bar__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #4ade80;
}

.voice-status-bar__subtitle {
  margin: 0;
  font-size: 11px;
  color: #9ca3af;
}

.voice-status-bar__controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.voice-status-bar__btn {
  border: none;
  border-radius: 8px;
  background-color: #374151;
  color: #f3f4f6;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.voice-status-bar__btn:hover {
  background-color: #4b5563;
}

.voice-status-bar__btn--danger {
  background-color: #7f1d1d;
}

.voice-status-bar__btn--danger:hover {
  background-color: #991b1b;
}
</style>
