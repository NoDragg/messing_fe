<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { Pin, ScreenShareOff } from 'lucide-vue-next'

const props = defineProps({
  remoteScreenElements: { type: Object, default: () => ({}) },
  latestChannelState: { type: Object, default: () => null },
  activeScreenTrackSid: { type: String, default: null },
})

const emit = defineEmits(['select-screen'])

const videoStageRef = ref(null)
const screenDimensions = ref({})

const screenShareEntries = computed(() => {
  const entries = Object.entries(props.remoteScreenElements || {})
  const seen = new Set()
  return entries.filter(([key, element]) => {
    const trackSid = element?.dataset?.trackSid || ''
    const dedupeKey = trackSid || key
    if (seen.has(dedupeKey)) return false
    seen.add(dedupeKey)
    return true
  })
})

const activeScreenSharers = computed(() => {
  const stateParticipants = props.latestChannelState?.participants || []
  return stateParticipants.filter((participant) => participant.isScreenSharing)
})

const hasActiveScreenShare = computed(() => Boolean(screenShareEntries.value.length || activeScreenSharers.value.length))
const resolveScreenEntry = (trackSid) => {
  if (!trackSid) return null
  return screenShareEntries.value.find(([screenKey, element]) => {
    const participantId = element?.dataset?.participantId || ''
    const elementTrackSid = element?.dataset?.trackSid || ''
    return (
      elementTrackSid === trackSid ||
      screenKey === trackSid ||
      `${participantId}:${elementTrackSid || 'screen'}` === trackSid ||
      participantId === trackSid
    )
  }) || null
}

const featuredScreenElement = computed(() => {
  return resolveScreenEntry(props.activeScreenTrackSid)?.[1] || screenShareEntries.value[0]?.[1] || null
})
const featuredTrackSid = computed(() => featuredScreenElement.value?.dataset?.trackSid || resolveScreenEntry(props.activeScreenTrackSid)?.[0] || null)
const featuredScreenState = computed(() => {
  if (screenShareEntries.value.length) return 'live'
  if (activeScreenSharers.value.length) return 'stale'
  return 'idle'
})
const featuredOrientation = computed(() => 'landscape')

const featuredAspectRatio = computed(() => '16 / 9')
const featuredObjectPosition = computed(() => 'center center')

const featuredTitle = computed(() => {
  if (featuredScreenElement.value) return getDisplayName(featuredScreenElement.value?.dataset?.participantId)
  return activeScreenSharers.value.length ? getDisplayName(activeScreenSharers.value[0]) : 'Screen share live'
})
const showRemoteFallback = computed(() => featuredScreenState.value !== 'live')
const selectedTrackLabel = computed(() => props.activeScreenTrackSid ? 'Selected stream' : 'Auto-follow active stream')

const getDisplayName = (user) => user?.displayName || user?.profileName || user?.loginName || user?.name || user?.username || 'Unknown'

const attachElementToStage = (element) => {
  if (!element) return
  try {
    if (!videoStageRef.value) return
    if (element.parentElement !== videoStageRef.value) {
      videoStageRef.value.appendChild(element)
    }
    const trackSid = element?.dataset?.trackSid || element?.dataset?.participantId || element?.dataset?.source || 'local'
    const syncDimensions = () => {
      if (element.videoWidth > 0 && element.videoHeight > 0) {
        screenDimensions.value = { ...screenDimensions.value, [trackSid]: { width: element.videoWidth, height: element.videoHeight } }
      }
    }
    syncDimensions()
    const handlerKey = '__voicePanelLoadedMetadataHandler'
    const previousHandler = element[handlerKey]
    if (previousHandler) {
      element.removeEventListener('loadedmetadata', previousHandler)
      element.removeEventListener('resize', previousHandler)
    }
    const handler = () => syncDimensions()
    element[handlerKey] = handler
    element.addEventListener('loadedmetadata', handler)
    element.addEventListener('resize', handler)
  } catch (error) {
    console.error('[VoiceScreenShareStage] Failed to attach screen element', error)
  }
}

const attachFeaturedElement = async () => {
  await nextTick()
  if (!featuredScreenElement.value) return
  attachElementToStage(featuredScreenElement.value)
}

watch(
  () => [featuredScreenElement.value, screenShareEntries.value.length],
  attachFeaturedElement,
  { immediate: true },
)

watch(
  () => screenShareEntries.value.map(([screenKey, element]) => [screenKey, element?.dataset?.trackSid, element?.dataset?.loaded]),
  async () => {
    await nextTick()
    if (!featuredScreenElement.value) return
    attachElementToStage(featuredScreenElement.value)
  },
  { deep: true },
)
</script>

<template>
  <section v-if="hasActiveScreenShare" class="voice-screen-share">
    <header class="voice-screen-share__header">
      <div class="voice-screen-share__headline">
        <span class="voice-screen-share__eyebrow">Screen share live</span>
        <h3 class="voice-screen-share__title">{{ featuredTitle }}</h3>
        <p class="voice-screen-share__meta">
          <span class="voice-screen-share__live-dot" />
          {{ selectedTrackLabel }}
        </p>
      </div>

      <div class="voice-screen-share__actions">
        <button
          type="button"
          class="voice-screen-share__pin-btn"
          :disabled="!screenShareEntries.length"
          @click="emit('select-screen', featuredTrackSid || screenShareEntries[0]?.[0])"
        >
          <Pin :size="14" />
          {{ props.activeScreenTrackSid ? 'Switch stream' : 'Select stream' }}
        </button>
      </div>
    </header>

    <div class="voice-screen-share__stage-shell">
      <div
        class="voice-screen-share__stage-frame"
        :class="{
          'voice-screen-share__stage-frame--portrait': featuredOrientation === 'portrait',
          'voice-screen-share__stage-frame--landscape': featuredOrientation === 'landscape',
        }"
        :style="featuredScreenElement ? { aspectRatio: featuredAspectRatio } : null"
      >
        <div ref="videoStageRef" class="voice-screen-share__video-stage" :style="{ '--screen-object-position': featuredObjectPosition }" />

        <div v-if="showRemoteFallback" class="voice-screen-share__overlay">
          <div class="voice-screen-share__loader">
            <div class="voice-screen-share__loader-ring" />
            <div>
              <strong>{{ featuredScreenState === 'stale' ? 'Stream stopped' : 'Connecting stream' }}</strong>
              <p>{{ featuredScreenState === 'stale' ? 'Quay về màn gốc sau khi dừng chia sẻ.' : 'Đang đợi LiveKit render video...' }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="voice-screen-share__rail" aria-label="Screen share streams" />
    </div>
  </section>

  <section v-else class="voice-screen-share voice-screen-share--empty">
    <div class="voice-screen-share__empty">
      <div class="voice-screen-share__empty-icon">
        <ScreenShareOff :size="24" />
      </div>
      <h3 class="voice-screen-share__empty-title">Đang chờ stream LiveKit</h3>
    </div>
  </section>
</template>

<style scoped>
.voice-screen-share {
  display: flex;
  flex-direction: column;
  gap: 14px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 22px;
  background:
    radial-gradient(circle at top left, rgba(99, 102, 241, 0.14), transparent 34%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(9, 14, 26, 0.98));
  padding: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
}

.voice-screen-share__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.voice-screen-share__headline {
  display: grid;
  gap: 4px;
}

.voice-screen-share__eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #93c5fd;
}

.voice-screen-share__title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #f8fafc;
}

.voice-screen-share__meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #cbd5e1;
  font-size: 12px;
}

.voice-screen-share__live-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #34d399;
  box-shadow: 0 0 0 6px rgba(52, 211, 153, 0.14);
}

.voice-screen-share__actions {
  display: flex;
  align-items: center;
}

.voice-screen-share__pin-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.78);
  padding: 9px 12px;
  color: #e2e8f0;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.voice-screen-share__pin-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.voice-screen-share__stage-shell {
  display: grid;
  gap: 12px;
}

.voice-screen-share__stage-frame {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  background: #020617;
  border: 1px solid rgba(148, 163, 184, 0.14);
  min-height: 240px;
}

.voice-screen-share__stage-frame--portrait,
.voice-screen-share__stage-frame--landscape {
  width: 100%;
}

.voice-screen-share__video-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.voice-screen-share__video-stage :deep(video) {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center center;
  background: #020617;
}

.voice-screen-share__overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, rgba(2, 6, 23, 0.26), rgba(2, 6, 23, 0.68));
  backdrop-filter: blur(8px);
}

.voice-screen-share__loader {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.16);
  color: #e2e8f0;
}

.voice-screen-share__loader strong { display: block; font-size: 13px; }
.voice-screen-share__loader p { margin: 2px 0 0; font-size: 12px; color: #94a3b8; }

.voice-screen-share__loader-ring {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 2px solid rgba(148, 163, 184, 0.25);
  border-top-color: #60a5fa;
  animation: voice-spin 1s linear infinite;
}


.voice-screen-share__rail {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.voice-screen-share__card {
  display: grid;
  gap: 10px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.72);
  padding: 12px;
  color: #e2e8f0;
  text-align: left;
}

.voice-screen-share__card--active {
  border-color: rgba(96, 165, 250, 0.45);
  background: rgba(30, 41, 59, 0.92);
  box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.18);
}

.voice-screen-share__card-top,
.voice-screen-share__card-bottom {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
}

.voice-screen-share__card-name {
  font-weight: 700;
  color: #f8fafc;
}

.voice-screen-share__card-source {
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.voice-screen-share--empty {
  padding: 22px 16px;
}

.voice-screen-share__empty {
  display: grid;
  justify-items: center;
  gap: 10px;
  text-align: center;
  padding: 32px 16px;
  border-radius: 20px;
  border: 1px dashed rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.5);
}

.voice-screen-share__empty-icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: rgba(96, 165, 250, 0.12);
  color: #93c5fd;
}

.voice-screen-share__empty-title {
  margin: 0;
  font-size: 15px;
  color: #f8fafc;
}

.voice-screen-share__empty-text {
  max-width: 440px;
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.6;
}

@keyframes voice-spin {
  to { transform: rotate(360deg); }
}
</style>
