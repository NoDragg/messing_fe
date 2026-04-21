<script setup>
import { computed } from 'vue'
import { AudioLines } from 'lucide-vue-next'

const props = defineProps({
  participants: {
    type: Array,
    default: () => [],
  },
  currentUser: {
    type: Object,
    default: () => null,
  },
  activeSpeakerId: {
    type: String,
    default: null,
  },
})

const participantItems = computed(() => props.participants || [])

const initial = (name) => (name || 'U').charAt(0).toUpperCase()
</script>

<template>
  <div class="voice-participants-grid">
    <article
      v-for="user in participantItems"
      :key="user.id"
      class="voice-participants-grid__card"
      :class="{
        'voice-participants-grid__card--speaking': user.id === activeSpeakerId || user.speaking,
        'voice-participants-grid__card--self': currentUser?.id === user.id,
      }"
    >
      <div class="voice-participants-grid__avatar" :class="{ 'voice-participants-grid__avatar--local': user.isLocal }">
        <img
          v-if="user.avatarUrl"
          :src="user.avatarUrl"
          :alt="user.name || user.username || 'Avatar'"
          class="voice-participants-grid__avatar-image"
        />
        <div v-else class="voice-participants-grid__avatar-fallback">
          {{ initial(user.name || user.username) }}
        </div>
      </div>

      <div class="voice-participants-grid__meta">
        <p class="voice-participants-grid__username">
          {{ user.name || user.username || 'Unknown' }}
          <span v-if="currentUser?.id === user.id" class="voice-participants-grid__you">(Bạn)</span>
        </p>
        <p class="voice-participants-grid__status">
          <AudioLines v-if="user.id === activeSpeakerId || user.speaking" :size="12" />
          <span>{{ user.id === activeSpeakerId || user.speaking ? 'Đang nói' : user.isLocal ? 'Bạn' : 'Đang online' }}</span>
        </p>
      </div>
    </article>
  </div>
</template>

<style scoped>
.voice-participants-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  padding: 16px;
  overflow-y: auto;
}

.voice-participants-grid__card {
  display: flex;
  gap: 12px;
  align-items: center;
  border-radius: 14px;
  background-color: #1f2937;
  padding: 14px;
  border: 1px solid transparent;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.voice-participants-grid__card--speaking {
  border-color: #22c55e;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
}

.voice-participants-grid__card--self {
  background: linear-gradient(180deg, rgba(99, 102, 241, 0.16), rgba(31, 41, 55, 1));
}

.voice-participants-grid__avatar {
  position: relative;
  flex: 0 0 auto;
}

.voice-participants-grid__avatar--local::after {
  content: '';
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 12px;
  height: 12px;
  border-radius: 9999px;
  border: 2px solid #1f2937;
  background: #22c55e;
}

.voice-participants-grid__avatar-image,
.voice-participants-grid__avatar-fallback {
  width: 56px;
  height: 56px;
  border-radius: 9999px;
}

.voice-participants-grid__avatar-image {
  object-fit: cover;
}

.voice-participants-grid__avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #6366f1;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.voice-participants-grid__meta {
  min-width: 0;
}

.voice-participants-grid__username {
  margin: 0;
  color: #f3f4f6;
  font-size: 13px;
  font-weight: 600;
}

.voice-participants-grid__you {
  color: #9ca3af;
  font-weight: 500;
}

.voice-participants-grid__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0 0;
  font-size: 12px;
  color: #9ca3af;
}
</style>
