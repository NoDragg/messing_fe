<script setup>
import { ref } from 'vue'
import AppModal from '@/components/AppModal.vue'
import { useServerStore } from '@/stores/serverStore'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  show: Boolean,
  channel: Object
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
  if (!serverStore.activeServerId || !props.channel?.id) {
    showToast('Không tìm thấy channel để xóa.', 'warning')
    return
  }

  isDeleting.value = true
  try {
    await serverStore.deleteChannel(serverStore.activeServerId, props.channel.id)
    
    showToast('Xóa channel thành công.', 'success')
    emit('deleted', props.channel.id)
    close()
  } catch (error) {
    modalError.value = error.response?.data?.message || 'Xóa channel thất bại.'
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <AppModal
    :show="show"
    title="Xóa channel"
    subtitle="Bạn có chắc chắn muốn xóa channel này không? Hành động này không thể hoàn tác."
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
