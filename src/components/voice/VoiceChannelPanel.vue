<script setup>
import { computed, ref, watch } from 'vue'
import { Mic, MicOff, Headphones, PhoneOff } from 'lucide-vue-next'

const props = defineProps({
  channel: {
    type: Object,
    default: () => null,
  },
  currentUser: {
    type: Object,
    default: () => null,
  },
  participants: {
    type: Array,
    default: () => [],
  },
  remoteStreams: {
    type: Object,
    default: () => ({}),
  },
  speakingUserIds: {
    type: Object,
    default: () => new Set(),
  },
  sessionId: {
    type: String,
    default: null,
  },
  isSessionStarter: {
    type: Boolean,
    default: false,
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

const emit = defineEmits(['toggle-mute', 'toggle-deafen', 'leave'])

const audioRefs = ref({})

const ensureAudioPlayback = () => {
  Object.entries(props.remoteStreams || {}).forEach(([userId, stream]) => {
    const audioEl = audioRefs.value[userId]
    if (!audioEl || !stream) return

    if (audioEl.srcObject !== stream) {
      audioEl.srcObject = stream
    }

    audioEl.muted = false
    audioEl.play?.().catch(() => {
      // browser autoplay policy may block until user interaction
    })
  })
}

watch(
  () => props.remoteStreams,
  () => ensureAudioPlayback(),
  { deep: true },
)

const participantItems = computed(() => props.participants || [])

const initial = (name) => (name || 'U').charAt(0).toUpperCase()
</script>

<template>
  <section class="voice-panel">
    <header class="voice-panel__header">
      <div>
        <h2 class="voice-panel__title">🔊 {{ channel?.name || 'Voice Channel' }}</h2>
        <p class="voice-panel__subtitle">{{ participantItems.length }} người đang tham gia</p>
      </div>
      <div class="voice-panel__session-info">
        <p class="voice-panel__session-text">
          Session: {{ sessionId ? sessionId.slice(0, 8) : '---' }}
        </p>
        <span
          v-if="isSessionStarter"
          class="voice-panel__starter-badge"
        >
          Bạn là người bắt đầu session
        </span>
      </div>
    </header>

    <div class="voice-panel__grid">
      <article
        v-for="user in participantItems"
        :key="user.id"
        class="voice-panel__card"
        :class="{ 'voice-panel__card--speaking': speakingUserIds.has(user.id) }"
      >
        <img
          v-if="user.avatarUrl"
          :src="user.avatarUrl"
          alt="Avatar"
          class="voice-panel__avatar-image"
        />
        <div v-else class="voice-panel__avatar-fallback">
          {{ initial(user.username) }}
        </div>

        <p class="voice-panel__username">
          {{ user.username }}
          <span
            v-if="currentUser?.id === user.id"
            class="voice-panel__you"
          >(Bạn)</span>
        </p>

        <audio
          v-if="remoteStreams[user.id]"
          :ref="(el) => { if (el) audioRefs[user.id] = el }"
          autoplay
          playsinline
        />
      </article>
    </div>

    <footer class="voice-panel__controls">
      <button
        type="button"
        class="voice-panel__control-btn"
        :class="{ 'voice-panel__control-btn--danger': muted }"
        @click="emit('toggle-mute')"
      >
        <MicOff v-if="muted" :size="16" />
        <Mic v-else :size="16" />
        {{ muted ? 'Unmute' : 'Mute' }}
      </button>

      <button
        type="button"
        class="voice-panel__control-btn"
        :class="{ 'voice-panel__control-btn--danger': deafened }"
        @click="emit('toggle-deafen')"
      >
        <Headphones :size="16" />
        {{ deafened ? 'Undeafen' : 'Deafen' }}
      </button>

      <button
        type="button"
        class="voice-panel__control-btn voice-panel__control-btn--danger"
        @click="emit('leave')"
      >
        <PhoneOff :size="16" />
        Leave
      </button>
    </footer>
  </section>
</template>

<style scoped>
.voice-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  background-color: #374151;
}

.voice-panel__header {
  display: flex;
  height: 56px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #4b5563;
  padding: 0 16px;
}

.voice-panel__title {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.voice-panel__subtitle {
  font-size: 13px;
  color: #d1d5db;
}

.voice-panel__session-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.voice-panel__session-text {
  margin: 0;
  font-size: 12px;
  color: #9ca3af;
}

.voice-panel__starter-badge {
  border-radius: 9999px;
  background-color: rgba(34, 197, 94, 0.18);
  color: #86efac;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
}

.voice-panel__grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  padding: 16px;
  overflow-y: auto;
}

.voice-panel__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  background-color: #1f2937;
  padding: 14px 10px;
  border: 1px solid transparent;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.voice-panel__card--speaking {
  border-color: #22c55e;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
}

.voice-panel__avatar-image,
.voice-panel__avatar-fallback {
  width: 56px;
  height: 56px;
  border-radius: 9999px;
}

.voice-panel__avatar-image {
  object-fit: cover;
}

.voice-panel__avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #6366f1;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.voice-panel__username {
  color: #f3f4f6;
  font-size: 13px;
}

.voice-panel__you {
  color: #9ca3af;
}

.voice-panel__controls {
  display: flex;
  gap: 10px;
  border-top: 1px solid #4b5563;
  padding: 12px 16px;
  background-color: #1f2937;
}

.voice-panel__control-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  border-radius: 8px;
  background-color: #374151;
  color: #f3f4f6;
  padding: 8px 12px;
  cursor: pointer;
}

.voice-panel__control-btn:hover {
  background-color: #4b5563;
}

.voice-panel__control-btn--danger {
  background-color: #7f1d1d;
}

.voice-panel__control-btn--danger:hover {
  background-color: #991b1b;
}
</style>
