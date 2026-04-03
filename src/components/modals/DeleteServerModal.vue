<script setup>
import { ref } from 'vue'
import AppModal from '@/components/AppModal.vue'
import { useServerStore } from '@/stores/serverStore'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  show: Boolean
})
const emit = defineEmits(['update:show', 'deleted'])

const serverStore = useServerStore()
const { showToast } = useToast()

const modalError = ref('')
const isDeleting = ref(false)

const close = () => {
  emit('update:show', false)
  modalError.value = ''
}

const handleConfirm = async () => {
  if (!serverStore.activeServerId) return

  isDeleting.value = true
  try {
    await serverStore.deleteServer(serverStore.activeServerId)
    
    showToast('Xóa server thành công.', 'success')
    emit('deleted')
    close()
  } catch (error) {
    modalError.value = error.response?.data?.message || 'Xóa server thất bại.'
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <AppModal
    :show="show"
    title="Xóa server"
    subtitle="Bạn có chắc chắn muốn xóa server này không? Tất cả channel và tin nhắn sẽ bị xóa vĩnh viễn."
    confirm-text="Xóa"
    cancel-text="Hủy"
    :loading="isDeleting"
    @close="close"
    @confirm="handleConfirm"
  >
    <p v-if="modalError" class="modal-error">{{ modalError }}</p>
  </AppModal>
</template>

<style scoped>
.modal-error {
  margin: 8px 0 0;
  color: #fca5a5;
  font-size: 13px;
}
</style>
