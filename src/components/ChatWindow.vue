<script setup>
import { ImagePlus } from 'lucide-vue-next'
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

const emit = defineEmits(['send-message', 'send-image'])

const newMessage = ref('')
const fileInputRef = ref(null)
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
  } else {
    const dateString = date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })
    return `${dateString} ${timeString}`
  }
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

const handleSubmit = () => {
  if (!newMessage.value.trim()) return
  emit('send-message', newMessage.value)
  newMessage.value = ''
}

const triggerSelectImage = () => {
  fileInputRef.value?.click()
}

const handleFileSelected = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  emit('send-image', file)
  event.target.value = ''
}

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
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="chat-window__text-link">${url}</a>`
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
  <section class="chat-window">
    <header class="chat-window__header">
      <h2 class="chat-window__title"># {{ channelName }}</h2>
    </header>

    <div ref="messageListRef" class="chat-window__message-list">
      <div v-if="loading" class="chat-window__loading-text">Đang tải tin nhắn...</div>

      <article
        v-for="message in messages"
        :key="message.id"
        class="chat-window__message-item"
      >
        <img
          v-if="getMessageAvatarUrl(message)"
          :src="getMessageAvatarUrl(message)"
          alt="Avatar"
          class="chat-window__message-avatar-image"
        />
        <div v-else class="chat-window__message-avatar">
          {{ getMessageUsername(message).charAt(0).toUpperCase() }}
        </div>

        <div>
          <div class="chat-window__message-meta">
            <p class="chat-window__sender-name">{{ getMessageUsername(message) }}</p>
            <span class="chat-window__message-time">{{ formatTime(message.createdAt) }}</span>
          </div>
          <p 
            v-if="getTextContent(message)" 
            class="chat-window__message-content"
            v-html="formatTextContent(getTextContent(message))"
          ></p>
          <img
            v-if="getImageUrl(message)"
            :src="getImageUrl(message)"
            alt="chat image"
            class="chat-window__message-image"
          />
        </div>
      </article>

      <div v-if="!loading && messages.length === 0" class="chat-window__empty-text">
        Chưa có tin nhắn nào trong #{{ channelName }}
      </div>
    </div>

    <div class="chat-window__composer-wrap">
      <form class="chat-window__composer-form" @submit.prevent="handleSubmit">
        <button
          type="button"
          class="chat-window__icon-button"
          title="Gửi ảnh"
          @click="triggerSelectImage"
        >
          <ImagePlus :size="18" />
        </button>

        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          class="chat-window__file-input"
          @change="handleFileSelected"
        />

        <input
          v-model="newMessage"
          type="text"
          class="chat-window__composer-input"
          :placeholder="`Nhắn tin vào #${channelName}...`"
        />
      </form>
    </div>
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
  justify-content: space-between;
  border-bottom: 1px solid #4b5563;
  padding: 0 16px;
}

.chat-window__title {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.chat-window__logout-button {
  border: none;
  border-radius: 4px;
  background-color: #dc2626;
  padding: 6px 12px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.chat-window__logout-button:hover {
  background-color: #ef4444;
}

.chat-window__message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  
  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: #4b5563 transparent;
}

/* Chrome, Edge, Safari */
.chat-window__message-list::-webkit-scrollbar {
  width: 8px;
}

.chat-window__message-list::-webkit-scrollbar-track {
  background: transparent;
}

.chat-window__message-list::-webkit-scrollbar-thumb {
  background-color: #4b5563;
  border-radius: 4px;
}

.chat-window__message-list::-webkit-scrollbar-thumb:hover {
  background-color: #6b7280;
}

.chat-window__message-list > * + * {
  margin-top: 16px;
}

.chat-window__loading-text {
  font-size: 14px;
  color: #d1d5db;
}

.chat-window__message-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.chat-window__message-avatar {
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

.chat-window__message-avatar-image {
  height: 36px;
  width: 36px;
  border-radius: 9999px;
  object-fit: cover;
}

.chat-window__message-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-window__sender-name {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.chat-window__message-time {
  font-size: 12px;
  color: #d1d5db;
}

.chat-window__message-content {
  margin: 2px 0 0;
  font-size: 14px;
  color: #f3f4f6;
}

.chat-window__empty-text {
  font-size: 14px;
  color: #d1d5db;
}

.chat-window__message-image {
  margin-top: 6px;
  max-width: 320px;
  max-height: 320px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #4b5563;
}

.chat-window__composer-wrap {
  border-top: 1px solid #4b5563;
  padding: 16px;
}

.chat-window__composer-form {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-window__icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  padding: 4px;
  color: #cbd5e1;
  cursor: pointer;
  transition: color 0.2s ease;
}

.chat-window__icon-button:hover {
  color: #ffffff;
}

.chat-window__file-input {
  display: none;
}

.chat-window__composer-input {
  width: 100%;
  border: none;
  border-radius: 8px;
  background-color: #4b5563;
  padding: 8px 16px;
  color: #ffffff;
  font-size: 14px;
  box-sizing: border-box;
}

.chat-window__composer-input::placeholder {
  color: #d1d5db;
}

.chat-window__composer-input:focus {
  outline: none;
}

.chat-window__message-content :deep(.chat-window__text-link) {
  color: #60a5fa;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.chat-window__message-content :deep(.chat-window__text-link:hover) {
  color: #93c5fd;
}
</style>
