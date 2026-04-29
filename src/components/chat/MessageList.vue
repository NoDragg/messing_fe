<script setup>
import { nextTick, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

const props = defineProps({
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
})

const messageListRef = ref(null)

const formatTime = (time) => {
  if (!time) return ''

  const date = new Date(time)
  const now = new Date()

  const isToday = date.getDate() === now.getDate() &&
                  date.getMonth() === now.getMonth() &&
                  date.getFullYear() === now.getFullYear()

  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (isToday) {
    return timeString
  }

  const dateString = date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })
  return `${dateString} ${timeString}`
}

const scrollToBottom = async () => {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

watch(
  () => props.messages.length,
  () => {
    scrollToBottom()
  },
)

const isImageMessage = (message) => {
  const text = String(message?.content || '').trim()
  if (!text) return false

  const lower = text.toLowerCase()
  const isHttp = lower.startsWith('http://') || lower.startsWith('https://')
  const hasImageExt = /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(lower)

  return isHttp && hasImageExt
}

const getImageUrl = (message) => {
  if (message?.imageUrl) return message.imageUrl
  if (message?.url) return message.url
  if (message?.image) return message.image
  if (isImageMessage(message)) return message.content.trim()
  return null
}

const getTextContent = (message) => {
  if (!message?.content) return ''
  if (isImageMessage(message)) return ''
  return message.content
}

const formatTextContent = (text) => {
  if (!text) return ''

  const div = document.createElement('div')
  div.appendChild(document.createTextNode(text))
  const escapedText = div.innerHTML

  const urlRegex = /(https?:\/\/[^\s]+)/g
  return escapedText.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="message-list__text-link">${url}</a>`
  })
}

const getMessageDisplayName = (message) => {
  const currentUserId = authStore.user?.id
  const msgSenderId = message.senderId || message.userId

  if (currentUserId && msgSenderId && currentUserId === msgSenderId) {
    return authStore.user?.displayName || authStore.user?.profileName || authStore.user?.loginName || authStore.user?.username || 'You'
  }

  return message.senderDisplayName || message.displayName || message.senderLoginName || message.senderUsername || message.username || 'Unknown'
}

const getMessageAvatarUrl = (message) => {
  const currentUserId = authStore.user?.id
  const msgSenderId = message.senderId || message.userId

  if (currentUserId && msgSenderId && currentUserId === msgSenderId && authStore.user.avatarUrl) {
    return authStore.user.avatarUrl
  }

  return message.senderAvatarUrl || message.avatarUrl || message.userAvatarUrl || null
}
</script>

<template>
  <div ref="messageListRef" class="message-list">
    <div v-if="loading" class="message-list__skeleton-list" aria-busy="true" aria-live="polite">
      <div
        v-for="index in 6"
        :key="index"
        class="message-list__skeleton-item"
        :style="{ animationDelay: `${index * 90}ms` }"
      >
        <div class="message-list__skeleton-avatar"></div>
        <div class="message-list__skeleton-body">
          <div class="message-list__skeleton-headline">
            <span class="message-list__skeleton-line message-list__skeleton-line--name"></span>
            <span class="message-list__skeleton-line message-list__skeleton-line--time"></span>
          </div>
          <span class="message-list__skeleton-line message-list__skeleton-line--text"></span>
          <span class="message-list__skeleton-line message-list__skeleton-line--text message-list__skeleton-line--short"></span>
        </div>
      </div>
    </div>

    <template v-else>
      <article
        v-for="message in messages"
        :key="message.id"
        class="message-list__item"
      >
        <img
          v-if="getMessageAvatarUrl(message)"
          :src="getMessageAvatarUrl(message)"
          alt="Avatar"
          class="message-list__avatar-image"
        />
        <div v-else class="message-list__avatar">
          {{ getMessageDisplayName(message).charAt(0).toUpperCase() }}
        </div>

        <div>
          <div class="message-list__meta">
            <p class="message-list__sender">{{ getMessageDisplayName(message) }}</p>
            <span class="message-list__time">{{ formatTime(message.createdAt) }}</span>
          </div>
          <p
            v-if="getTextContent(message)"
            class="message-list__content"
            v-html="formatTextContent(getTextContent(message))"
          ></p>
          <img
            v-if="getImageUrl(message)"
            :src="getImageUrl(message)"
            alt="chat image"
            class="message-list__image"
          />
        </div>
      </article>

      <div v-if="messages.length === 0" class="message-list__empty">
        Chưa có tin nhắn nào trong #{{ channelName }}
      </div>
    </template>
  </div>
</template>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 18px 18px 20px;
  scrollbar-width: thin;
  scrollbar-color: rgba(124, 140, 255, 0.32) transparent;
}

.message-list::-webkit-scrollbar {
  width: 8px;
}

.message-list::-webkit-scrollbar-track {
  background: transparent;
}

.message-list::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(124, 140, 255, 0.44), rgba(86, 104, 255, 0.22));
  border-radius: 999px;
}

.message-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(124, 140, 255, 0.7), rgba(86, 104, 255, 0.42));
}

.message-list > * + * {
  margin-top: 16px;
}

.message-list__empty {
  font-size: 14px;
  color: #c8d1e7;
  animation: ui-fade-up 220ms ease;
}

.message-list__skeleton-list {
  display: grid;
  gap: 14px;
  animation: ui-fade-up 180ms ease;
}

.message-list__skeleton-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 12px 13px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
  position: relative;
  overflow: hidden;
}

.message-list__skeleton-item::before {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  animation: skeleton-shimmer 1.6s ease-in-out infinite;
}

.message-list__skeleton-avatar {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(124, 140, 255, 0.14), rgba(86, 104, 255, 0.08));
  flex-shrink: 0;
}

.message-list__skeleton-body {
  flex: 1;
  display: grid;
  gap: 9px;
  padding-top: 1px;
}

.message-list__skeleton-headline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-list__skeleton-line {
  display: block;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(124, 140, 255, 0.14), rgba(86, 104, 255, 0.08));
}

.message-list__skeleton-line--name {
  width: 110px;
  height: 12px;
}

.message-list__skeleton-line--time {
  width: 56px;
  height: 8px;
  opacity: 0.8;
}

.message-list__skeleton-line--text {
  width: 100%;
  max-width: 520px;
}

.message-list__skeleton-line--short {
  width: 72%;
}

.message-list__item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 16px;
  transition:
    background-color var(--transition-fast),
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
  animation: message-enter 260ms ease;
}

.message-list__item:hover {
  background: rgba(255, 255, 255, 0.02);
  transform: translateY(-1px);
  box-shadow: inset 0 0 0 1px rgba(129, 140, 248, 0.08);
}

.message-list__avatar {
  display: flex;
  height: 38px;
  width: 38px;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(124, 140, 255, 0.36), rgba(86, 104, 255, 0.22));
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.message-list__avatar-image {
  height: 38px;
  width: 38px;
  border-radius: 14px;
  object-fit: cover;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.message-list__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-list__sender {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
}

.message-list__time {
  font-size: 12px;
  color: #9ba8c5;
}

.message-list__content {
  margin: 3px 0 0;
  font-size: 14px;
  line-height: 1.55;
  color: #eef2ff;
}

.message-list__image {
  margin-top: 8px;
  max-width: min(420px, 100%);
  max-height: 340px;
  border-radius: 14px;
  object-fit: cover;
  border: 1px solid rgba(129, 140, 248, 0.18);
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.25);
}

.message-list__content :deep(.message-list__text-link) {
  color: #8eb4ff;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.message-list__content :deep(.message-list__text-link:hover) {
  color: #b8d0ff;
}

@keyframes message-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>
