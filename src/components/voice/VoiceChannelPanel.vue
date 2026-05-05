<script setup>
import { computed } from "vue";
import {
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  Volume2,
  AudioLines,
  ScreenShare,
  ScreenShareOff,
} from "lucide-vue-next";
import VoiceScreenShareStage from "./VoiceScreenShareStage.vue";

const props = defineProps({
  channel: { type: Object, default: () => null },
  currentUser: { type: Object, default: () => null },
  participants: { type: Array, default: () => [] },
  activeSpeakerId: { type: String, default: null },
  muted: { type: Boolean, default: false },
  deafened: { type: Boolean, default: false },
  screenSharing: { type: Boolean, default: false },
  remoteScreenElements: { type: Object, default: () => ({}) },
  latestChannelState: { type: Object, default: () => null },
  activeScreenTrackSid: { type: String, default: null },
});

const emit = defineEmits([
  "toggle-mute",
  "toggle-deafen",
  "toggle-screen-share",
  "select-user-stream",
  "leave",
]);

const participantItems = computed(() => props.participants || []);
const participantCount = computed(() => participantItems.value.length);
const getDisplayName = (user) =>
  user?.displayName ||
  user?.profileName ||
  user?.loginName ||
  user?.name ||
  user?.username ||
  "Unknown";
const initial = (name) => (name || "U").charAt(0).toUpperCase();
const getScreenTrackTarget = (user) => {
  if (!user) return null;

  const trackSidFromUser = user.screenShareTrackSid || null;
  if (trackSidFromUser) return trackSidFromUser;

  const screenEntries = Object.entries(props.remoteScreenElements || {});
  const matchByParticipantId = screenEntries.find(([, element]) => element?.dataset?.participantId === user.id);
  if (matchByParticipantId) return matchByParticipantId[1]?.dataset?.trackSid || matchByParticipantId[0];

  const stateParticipant = (props.latestChannelState?.participants || []).find(
    (participant) => participant?.id === user.id || participant?.participantId === user.id,
  );
  if (stateParticipant?.screenShareTrackSid) return stateParticipant.screenShareTrackSid;

  return user.screenSharing ? user.id : null;
};

const onUserCardClick = (user) => {
  const trackSid = getScreenTrackTarget(user);
  if (!trackSid) return;
  emit("select-user-stream", {
    trackSid,
    userId: user?.userId || user?.id || null,
    participantId: user?.participantId || user?.id || null,
    screenShareTrackSid: trackSid,
  });
};

</script>

<template>
  <section class="voice-panel">
    <header class="voice-panel__header">
      <div>
        <h2 class="voice-panel__title">
          <Volume2 :size="16" />
          {{ channel?.name || "Voice Channel" }}
        </h2>
        <p class="voice-panel__subtitle">
          {{ participantCount }} người đang tham gia
        </p>
      </div>

      <div class="voice-panel__presence">
        <span class="voice-panel__live-indicator" />
        LiveKit
      </div>
    </header>

    <div class="voice-panel__scroll">
      <VoiceScreenShareStage
        :remote-screen-elements="remoteScreenElements"
        :latest-channel-state="latestChannelState"
        :active-screen-track-sid="activeScreenTrackSid"
        @select-screen="emit('select-user-stream', $event)"
      />

      <section class="voice-panel__participants" aria-label="Người tham gia">
        <div class="voice-panel__participants-header">
          <h3 class="voice-panel__participants-title">Người tham gia</h3>
        </div>

        <div class="voice-panel__grid">
          <article
            v-for="user in participantItems"
            :key="user.id"
            class="voice-panel__card"
            :class="{
              'voice-panel__card--speaking':
                user.id === activeSpeakerId || user.speaking,
              'voice-panel__card--self': currentUser?.id === user.id,
              'voice-panel__card--sharing': user.screenSharing,
              'voice-panel__card--active': activeScreenTrackSid && getScreenTrackTarget(user) === activeScreenTrackSid,
            }"
            @click="onUserCardClick(user)"
          >
            <div
              class="voice-panel__avatar"
              :class="{ 'voice-panel__avatar--local': user.isLocal }"
            >
              <img
                v-if="user.avatarUrl"
                :src="user.avatarUrl"
                :alt="getDisplayName(user) || 'Avatar'"
                class="voice-panel__avatar-image"
              />
              <div v-else class="voice-panel__avatar-fallback">
                {{ initial(getDisplayName(user)) }}
              </div>
              <span v-if="user.screenSharing" class="voice-panel__share-badge"
                ><ScreenShare :size="10" /> Screen</span
              >
            </div>

            <div class="voice-panel__meta">
              <p class="voice-panel__username">
                {{ getDisplayName(user) }}
                <span
                  v-if="currentUser?.id === user.id"
                  class="voice-panel__you"
                  >(Bạn)</span
                >
              </p>
              <p class="voice-panel__status">
                <AudioLines
                  v-if="user.id === activeSpeakerId || user.speaking"
                  :size="12"
                />
                <span>{{
                  user.id === activeSpeakerId || user.speaking
                    ? "Đang nói"
                    : user.isLocal
                      ? "Bạn"
                      : "Đang online"
                }}</span>
              </p>
              <p v-if="user.screenSharing" class="voice-panel__share-status">
                <ScreenShare :size="12" />
                <span>Click để ghim stream</span>
              </p>
            </div>
          </article>
        </div>
      </section>
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
        {{ muted ? "Unmute" : "Mute" }}
      </button>
      <button
        type="button"
        class="voice-panel__control-btn"
        :class="{ 'voice-panel__control-btn--danger': deafened }"
        @click="emit('toggle-deafen')"
      >
        <Headphones :size="16" />
        {{ deafened ? "Undeafen" : "Deafen" }}
      </button>
      <button
        type="button"
        class="voice-panel__control-btn"
        :class="{ 'voice-panel__control-btn--danger': screenSharing }"
        @click="emit('toggle-screen-share')"
      >
        <component
          :is="screenSharing ? ScreenShareOff : ScreenShare"
          :size="16"
        />
        {{ screenSharing ? "Stop share" : "Share screen" }}
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
  min-height: 0;
  height: 100%;
}
.voice-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #1f2937;
  padding: 16px;
  flex: 0 0 auto;
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
.voice-panel__scroll {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  flex: 1 1 auto;
  padding-bottom: 96px;
}
.voice-panel__participants {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  padding-bottom: 20px;
}
.voice-panel__participants-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 6px 0;
  background: linear-gradient(
    180deg,
    rgba(17, 24, 39, 0.98),
    rgba(17, 24, 39, 0.86)
  );
  backdrop-filter: blur(8px);
}
.voice-panel__participants-title {
  margin: 0;
  font-size: 13px;
  color: #e5e7eb;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.voice-panel__participants-count {
  margin: 0;
  font-size: 12px;
  color: #9ca3af;
}
.voice-panel__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 220px));
  justify-content: start;
  align-items: start;
  gap: 10px;
  padding: 0;
  width: 100%;
  min-height: 0;
  overflow: visible;
}
.voice-panel__card {
  flex: none;
  width: 100%;
  aspect-ratio: 7 / 4;
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 10px;
  align-items: center;
  border-radius: 14px;
  border: 1px solid #1f2937;
  background: #0f172a;
  padding: 10px 12px;
  transition:
    border-color 180ms ease,
    transform 180ms ease,
    box-shadow 180ms ease;
  cursor: pointer;
}

@media (max-width: 640px) {
  .voice-panel__grid {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 0 12px 12px;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .voice-panel__card {
    aspect-ratio: 8 / 3;
    grid-template-columns: 40px 1fr;
    padding: 10px 12px;
  }

  .voice-panel__avatar-image,
  .voice-panel__avatar-fallback,
  .voice-panel__avatar-screen {
    width: 40px;
    height: 40px;
  }

  .voice-panel__username {
    font-size: 13px;
  }

  .voice-panel__status,
  .voice-panel__share-status {
    font-size: 11px;
  }
}
.voice-panel__card:hover {
  transform: translateY(-1px);
  border-color: rgba(96, 165, 250, 0.45);
}
.voice-panel__card--speaking {
  border-color: rgba(34, 197, 94, 0.7);
  box-shadow:
    0 0 0 1px rgba(34, 197, 94, 0.18),
    0 10px 24px rgba(0, 0, 0, 0.18);
}
.voice-panel__card--self {
  background: linear-gradient(
    180deg,
    rgba(99, 102, 241, 0.16),
    rgba(15, 23, 42, 1)
  );
}
.voice-panel__card--sharing {
  border-color: rgba(96, 165, 250, 0.7);
}
.voice-panel__card--active {
  border-color: rgba(59, 130, 246, 0.95);
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.24), 0 16px 28px rgba(2, 6, 23, 0.28);
}
.voice-panel__avatar {
  position: relative;
  flex: 0 0 auto;
}
.voice-panel__avatar--local::after {
  content: "";
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  border: 2px solid #0f172a;
  background: #22c55e;
}
.voice-panel__avatar-image,
.voice-panel__avatar-fallback,
.voice-panel__avatar-screen {
  width: 44px;
  height: 44px;
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
  font-size: 17px;
  font-weight: 800;
}
.voice-panel__avatar-screen {
  object-fit: cover;
  border: 1px solid rgba(96, 165, 250, 0.28);
  background: #020617;
}
.voice-panel__share-badge {
  position: absolute;
  left: 50%;
  bottom: -10px;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.95);
  color: #93c5fd;
  font-size: 10px;
  padding: 2px 6px;
  border: 1px solid rgba(96, 165, 250, 0.5);
  white-space: nowrap;
}
.voice-panel__meta {
  min-width: 0;
  overflow: hidden;
}
.voice-panel__username {
  margin: 0;
  color: #f9fafb;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.voice-panel__you {
  color: #9ca3af;
  font-weight: 500;
}
.voice-panel__status,
.voice-panel__share-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0 0;
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.voice-panel__share-status {
  color: #93c5fd;
}
.voice-panel__controls {
  display: flex;
  gap: 10px;
  border-top: 1px solid #1f2937;
  padding: 18px 16px 20px;
  background-color: #0b1220;
  flex-wrap: wrap;
  margin-top: auto;
  align-items: flex-end;
  position: relative;
  z-index: 1;
}
.voice-panel__control-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  border-radius: 10px;
  background-color: #1f2937;
  color: #f3f4f6;
  padding: 10px 14px;
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
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
