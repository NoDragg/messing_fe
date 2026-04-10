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

const getMessageUsername = (message) => {
  const currentUserId = authStore.user?.id
  const msgSenderId = message.senderId || message.userId

  if (currentUserId && msgSenderId && currentUserId === msgSenderId) {
    return authStore.user.username
  }

  return message.senderUsername || message.username || 'Unknown'
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
    <div v-if="loading" class="message-list__loading">Đang tải tin nhắn...</div>

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
        {{ getMessageUsername(message).charAt(0).toUpperCase() }}
      </div>

      <div>
        <div class="message-list__meta">
          <p class="message-list__sender">{{ getMessageUsername(message) }}</p>
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

    <div v-if="!loading && messages.length === 0" class="message-list__empty">
      Chưa có tin nhắn nào trong #{{ channelName }}
    </div>
  </div>
</template>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  scrollbar-width: thin;
  scrollbar-color: #4b5563 transparent;
}

.message-list::-webkit-scrollbar {
  width: 8px;
}

.message-list::-webkit-scrollbar-track {
  background: transparent;
}

.message-list::-webkit-scrollbar-thumb {
  background-color: #4b5563;
  border-radius: 4px;
}

.message-list::-webkit-scrollbar-thumb:hover {
  background-color: #6b7280;
}

.message-list > * + * {
  margin-top: 16px;
}

.message-list__loading,
.message-list__empty {
  font-size: 14px;
  color: #d1d5db;
}

.message-list__item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.message-list__avatar {
  display: flex;
  height: 36px;
  width: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background-color: #6366f1;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
}

.message-list__avatar-image {
  height: 36px;
  width: 36px;
  border-radius: 9999px;
  object-fit: cover;
}

.message-list__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-list__sender {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.message-list__time {
  font-size: 12px;
  color: #d1d5db;
}

.message-list__content {
  margin: 2px 0 0;
  font-size: 14px;
  color: #f3f4f6;
}

.message-list__image {
  margin-top: 6px;
  max-width: 320px;
  max-height: 320px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #4b5563;
}

.message-list__content :deep(.message-list__text-link) {
  color: #60a5fa;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.message-list__content :deep(.message-list__text-link:hover) {
  color: #93c5fd;
}
</style>
