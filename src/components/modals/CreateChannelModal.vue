<script setup>
import { ref } from 'vue'
import AppModal from '@/components/AppModal.vue'
import { useServerStore } from '@/stores/serverStore'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  show: Boolean
})
const emit = defineEmits(['update:show', 'created'])

const serverStore = useServerStore()
const { showToast } = useToast()

const newChannelName = ref('')
const modalError = ref('')
const isCreating = ref(false)

const close = () => {
  emit('update:show', false)
  modalError.value = ''
  newChannelName.value = ''
}

const handleConfirm = async () => {
  if (!serverStore.activeServerId) {
    showToast('Bạn cần chọn server trước khi tạo channel.', 'warning')
    return
  }

  if (!newChannelName.value.trim()) {
    modalError.value = 'Vui lòng nhập tên channel.'
    return
  }

  isCreating.value = true
  try {
    const created = await serverStore.createChannel(serverStore.activeServerId, {
      name: newChannelName.value.trim(),
    })
    
    showToast('Tạo channel thành công.', 'success')
    emit('created', created)
    close()
  } catch (error) {
    modalError.value = error.response?.data?.message || 'Tạo channel thất bại.'
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <AppModal
    :show="show"
    title="Tạo channel mới"
    subtitle="Nhập tên channel bạn muốn tạo."
    confirm-text="Tạo"
    cancel-text="Hủy"
    :loading="isCreating"
    @close="close"
    @confirm="handleConfirm"
  >
    <input
      v-model="newChannelName"
      type="text"
      class="modal-input"
      placeholder="Ví dụ: general"
      maxlength="50"
    />
    <p v-if="modalError" class="modal-error">{{ modalError }}</p>
  </AppModal>
</template>

<style scoped>
.modal-input {
  width: 100%;
  border: 1px solid #4b5563;
  border-radius: 8px;
  background: #111827;
  color: #f9fafb;
  padding: 10px 12px;
  box-sizing: border-box;
}

.modal-input:focus {
  outline: 1px solid #6366f1;
}

.modal-error {
  margin: 8px 0 0;
  color: #fca5a5;
  font-size: 13px;
}
</style>
