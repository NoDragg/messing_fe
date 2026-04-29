<script setup>
import { computed } from 'vue'
import { Mic, MicOff, Headphones, PhoneOff, Volume2, AudioLines } from 'lucide-vue-next'

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
  activeSpeakerId: {
    type: String,
    default: null,
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

const participantItems = computed(() => props.participants || [])
const participantCount = computed(() => participantItems.value.length)

const getDisplayName = (user) => user?.displayName || user?.profileName || user?.loginName || user?.name || user?.username || 'Unknown'
const initial = (name) => (name || 'U').charAt(0).toUpperCase()
</script>

<template>
  <section class="voice-panel">
    <header class="voice-panel__header">
      <div>
        <h2 class="voice-panel__title">
          <Volume2 :size="16" />
          {{ channel?.name || 'Voice Channel' }}
        </h2>
        <p class="voice-panel__subtitle">{{ participantCount }} người đang tham gia</p>
      </div>

      <div class="voice-panel__presence">
        <span class="voice-panel__live-indicator" />
        LiveKit
      </div>
    </header>

    <div class="voice-panel__grid">
      <article
        v-for="user in participantItems"
        :key="user.id"
        class="voice-panel__card"
        :class="{
          'voice-panel__card--speaking': user.id === activeSpeakerId || user.speaking,
          'voice-panel__card--self': currentUser?.id === user.id,
        }"
      >
        <div class="voice-panel__avatar" :class="{ 'voice-panel__avatar--local': user.isLocal }">
          <img
            v-if="user.avatarUrl"
            :src="user.avatarUrl"
            :alt="getDisplayName(user) || 'Avatar'"
            class="voice-panel__avatar-image"
          />
          <div v-else class="voice-panel__avatar-fallback">
            {{ initial(getDisplayName(user)) }}
          </div>
        </div>

        <div class="voice-panel__meta">
          <p class="voice-panel__username">
            {{ getDisplayName(user) }}
            <span v-if="currentUser?.id === user.id" class="voice-panel__you">(Bạn)</span>
          </p>
          <p class="voice-panel__status">
            <AudioLines v-if="user.id === activeSpeakerId || user.speaking" :size="12" />
            <span>{{ user.id === activeSpeakerId || user.speaking ? 'Đang nói' : user.isLocal ? 'Bạn' : 'Đang online' }}</span>
          </p>
        </div>
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
  background-color: #111827;
}

.voice-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #1f2937;
  padding: 16px;
}

.voice-panel__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #f9fafb;
}

.voice-panel__subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #9ca3af;
}

.voice-panel__presence {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 9999px;
  border: 1px solid rgba(34, 197, 94, 0.2);
  background: rgba(34, 197, 94, 0.08);
  padding: 6px 10px;
  color: #86efac;
  font-size: 12px;
  font-weight: 600;
}

.voice-panel__live-indicator {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: #22c55e;
  box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.12);
}

.voice-panel__grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  padding: 16px;
  overflow-y: auto;
}

.voice-panel__card {
  display: flex;
  gap: 12px;
  align-items: center;
  border-radius: 16px;
  border: 1px solid #1f2937;
  background: #0f172a;
  padding: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.voice-panel__card--speaking {
  border-color: rgba(34, 197, 94, 0.7);
  box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.18), 0 10px 24px rgba(0, 0, 0, 0.18);
}

.voice-panel__card--self {
  background: linear-gradient(180deg, rgba(99, 102, 241, 0.16), rgba(15, 23, 42, 1));
}

.voice-panel__avatar {
  position: relative;
  flex: 0 0 auto;
}

.voice-panel__avatar--local::after {
  content: '';
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 12px;
  height: 12px;
  border-radius: 9999px;
  border: 2px solid #0f172a;
  background: #22c55e;
}

.voice-panel__avatar-image,
.voice-panel__avatar-fallback {
  width: 52px;
  height: 52px;
  border-radius: 9999px;
}

.voice-panel__avatar-image {
  object-fit: cover;
}

.voice-panel__avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  font-size: 20px;
  font-weight: 800;
}

.voice-panel__meta {
  min-width: 0;
}

.voice-panel__username {
  margin: 0;
  color: #f9fafb;
  font-size: 14px;
  font-weight: 600;
}

.voice-panel__you {
  color: #9ca3af;
  font-weight: 500;
}

.voice-panel__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0 0;
  font-size: 12px;
  color: #9ca3af;
}

.voice-panel__controls {
  display: flex;
  gap: 10px;
  border-top: 1px solid #1f2937;
  padding: 12px 16px;
  background-color: #0b1220;
}

.voice-panel__control-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  border-radius: 10px;
  background-color: #1f2937;
  color: #f3f4f6;
  padding: 8px 12px;
  cursor: pointer;
}

.voice-panel__control-btn:hover {
  background-color: #374151;
}

.voice-panel__control-btn--danger {
  background-color: rgba(185, 28, 28, 0.92);
}

.voice-panel__control-btn--danger:hover {
  background-color: #dc2626;
}
</style>
