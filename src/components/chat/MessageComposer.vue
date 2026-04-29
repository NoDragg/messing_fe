<script setup>
import { Bot, ImagePlus } from 'lucide-vue-next'
import { computed, ref } from 'vue'

const props = defineProps({
  channelName: {
    type: String,
    default: 'general',
  },
  botMode: {
    type: Boolean,
    default: false,
  },
  botBusy: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['send-message', 'send-image', 'toggle-bot-mode'])

const newMessage = ref('')
const fileInputRef = ref(null)

const placeholderText = computed(() => {
  if (props.botMode) return `Hỏi Bot trong #${props.channelName}...`
  return `Nhắn tin vào #${props.channelName}... `
})

const handleSubmit = () => {
  if (!newMessage.value.trim()) return
  emit('send-message', newMessage.value)
  newMessage.value = ''
}

const handleKeydown = (event) => {
  if (event.key !== 'Enter') return
  event.preventDefault()
  handleSubmit()
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
</script>

<template>
  <div class="message-composer">
    <form class="message-composer__form" @submit.prevent="handleSubmit">
      <button
        type="button"
        class="message-composer__icon-button"
        :class="{ 'message-composer__icon-button--active': botMode }"
        title="Chế độ Bot"
        @click="emit('toggle-bot-mode')"
      >
        <Bot :size="18" />
      </button>

      <button
        type="button"
        class="message-composer__icon-button"
        title="Gửi ảnh"
        @click="triggerSelectImage"
      >
        <ImagePlus :size="18" />
      </button>

      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="message-composer__file-input"
        @change="handleFileSelected"
      />

      <input
        v-model="newMessage"
        type="text"
        class="message-composer__input"
        :placeholder="placeholderText"
        :disabled="botBusy"
        @keydown="handleKeydown"
      />
    </form>
  </div>
</template>

<style scoped>
.message-composer {
  border-top: 1px solid rgba(148, 163, 184, 0.09);
  padding: 16px 18px 18px;
  background: rgba(9, 12, 20, 0.34);
  backdrop-filter: blur(16px);
}

.message-composer__form {
  display: flex;
  align-items: center;
  gap: 10px;
}

.message-composer__icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  padding: 10px;
  color: #c8d1e7;
  cursor: pointer;
  transition:
    transform var(--transition-fast),
    background-color var(--transition-fast),
    color var(--transition-fast),
    box-shadow var(--transition-fast);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.message-composer__icon-button:hover {
  color: #ffffff;
  background: rgba(124, 140, 255, 0.12);
  transform: translateY(-1px);
}

.message-composer__icon-button--active {
  color: #a5b4fc;
  background: rgba(124, 140, 255, 0.16);
}

.message-composer__file-input {
  display: none;
}

.message-composer__input {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 14px;
  background: rgba(18, 24, 40, 0.95);
  padding: 13px 16px;
  color: #ffffff;
  font-size: 14px;
  box-sizing: border-box;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    background-color var(--transition-fast);
}

.message-composer__input::placeholder {
  color: #98a6c4;
}

.message-composer__input:focus {
  outline: none;
  border-color: rgba(124, 140, 255, 0.45);
  box-shadow: 0 0 0 4px rgba(124, 140, 255, 0.12);
  background: rgba(20, 26, 43, 0.98);
}
</style>
