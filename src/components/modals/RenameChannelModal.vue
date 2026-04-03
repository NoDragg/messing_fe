<script setup>
import { ref, watch } from 'vue'
import AppModal from '@/components/AppModal.vue'
import { useServerStore } from '@/stores/serverStore'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  show: Boolean,
  channel: Object
})
const emit = defineEmits(['update:show'])

const serverStore = useServerStore()
const { showToast } = useToast()

const renameChannelName = ref('')
const modalError = ref('')
const isRenaming = ref(false)

watch(() => props.channel, (newVal) => {
  if (newVal) renameChannelName.value = newVal.name || ''
})

const close = () => {
  emit('update:show', false)
  modalError.value = ''
}

const handleConfirm = async () => {
  if (!serverStore.activeServerId || !props.channel?.id) {
    showToast('Không tìm thấy channel để đổi tên.', 'warning')
    return
  }

  if (!renameChannelName.value.trim()) {
    modalError.value = 'Vui lòng nhập tên channel mới.'
    return
  }

  isRenaming.value = true
  try {
    await serverStore.renameChannel(serverStore.activeServerId, props.channel.id, {
      name: renameChannelName.value.trim(),
    })
    
    showToast('Đổi tên channel thành công.', 'success')
    close()
  } catch (error) {
    modalError.value = error.response?.data?.message || 'Đổi tên channel thất bại.'
  } finally {
    isRenaming.value = false
  }
}
</script>

<template>
  <AppModal
    :show="show"
    title="Đổi tên channel"
    subtitle="Nhập tên mới cho channel."
    confirm-text="Lưu"
    cancel-text="Hủy"
    :loading="isRenaming"
    @close="close"
    @confirm="handleConfirm"
  >
    <input
      v-model="renameChannelName"
      type="text"
      class="modal-input"
      placeholder="Ví dụ: announcements"
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
