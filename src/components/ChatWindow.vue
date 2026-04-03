<script setup>
import { nextTick, ref, watch } from 'vue'

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

const emit = defineEmits(['send-message', 'logout'])

const newMessage = ref('')
const messageListRef = ref(null)

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
</script>

<template>
  <section class="flex flex-1 flex-col bg-gray-700">
    <header class="flex h-14 items-center justify-between border-b border-gray-600 px-4">
      <h2 class="text-sm font-semibold text-white"># {{ channelName }}</h2>
      <button
        type="button"
        class="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500"
        @click="emit('logout')"
      >
        Đăng xuất
      </button>
    </header>

    <div ref="messageListRef" class="flex-1 space-y-4 overflow-y-auto px-4 py-4">
      <div v-if="loading" class="text-sm text-gray-300">Đang tải tin nhắn...</div>

      <article
        v-for="message in messages"
        :key="message.id"
        class="flex items-start gap-3"
      >
        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold text-white">
          {{ (message.senderUsername || message.username || 'U').charAt(0).toUpperCase() }}
        </div>

        <div>
          <div class="flex items-center gap-2">
            <p class="text-sm font-semibold text-white">{{ message.senderUsername || message.username || 'Unknown' }}</p>
            <span class="text-xs text-gray-300">{{ formatTime(message.createdAt) }}</span>
          </div>
          <p class="text-sm text-gray-100">{{ message.content }}</p>
        </div>
      </article>

      <div v-if="!loading && messages.length === 0" class="text-sm text-gray-300">
        Chưa có tin nhắn nào trong #{{ channelName }}
      </div>
    </div>

    <div class="border-t border-gray-600 p-4">
      <form @submit.prevent="handleSubmit">
        <input
          v-model="newMessage"
          type="text"
          class="w-full rounded-lg bg-gray-600 px-4 py-2 text-sm text-white placeholder-gray-300 focus:outline-none"
          :placeholder="`Nhắn tin vào #${channelName}...`"
        />
      </form>
    </div>
  </section>
</template>
