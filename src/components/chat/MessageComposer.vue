<script setup>
import { ImagePlus } from 'lucide-vue-next'
import { ref } from 'vue'

const props = defineProps({
  channelName: {
    type: String,
    default: 'general',
  },
})

const emit = defineEmits(['send-message', 'send-image'])

const newMessage = ref('')
const fileInputRef = ref(null)

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
</script>

<template>
  <div class="message-composer">
    <form class="message-composer__form" @submit.prevent="handleSubmit">
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
        :placeholder="`Nhắn tin vào #${channelName}...`"
      />
    </form>
  </div>
</template>

<style scoped>
.message-composer {
  border-top: 1px solid #4b5563;
  padding: 16px;
}

.message-composer__form {
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-composer__icon-button {
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

.message-composer__icon-button:hover {
  color: #ffffff;
}

.message-composer__file-input {
  display: none;
}

.message-composer__input {
  width: 100%;
  border: none;
  border-radius: 8px;
  background-color: #4b5563;
  padding: 8px 16px;
  color: #ffffff;
  font-size: 14px;
  box-sizing: border-box;
}

.message-composer__input::placeholder {
  color: #d1d5db;
}

.message-composer__input:focus {
  outline: none;
}
</style>
