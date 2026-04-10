<script setup>
import { ref } from 'vue'
import AppModal from '@/components/AppModal.vue'
import AvatarCropModal from '@/components/modals/AvatarCropModal.vue'
import { useServerStore } from '@/stores/serverStore'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  show: Boolean
})
const emit = defineEmits(['update:show', 'created'])

const serverStore = useServerStore()
const { showToast } = useToast()

const newServerName = ref('')
const selectedAvatarFile = ref(null)
const avatarPreview = ref('')
const pendingCropFile = ref(null)
const showCropModal = ref(false)
const modalError = ref('')
const isCreating = ref(false)

const close = () => {
  emit('update:show', false)
  modalError.value = ''
  newServerName.value = ''
  selectedAvatarFile.value = null
  avatarPreview.value = ''
}

const handleAvatarSelected = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  pendingCropFile.value = file
  showCropModal.value = true
  event.target.value = ''
}

const handleAvatarCropped = ({ file, previewUrl }) => {
  selectedAvatarFile.value = file
  avatarPreview.value = previewUrl
  pendingCropFile.value = null
  showCropModal.value = false
}

const handleConfirm = async () => {
  if (!newServerName.value.trim()) {
    modalError.value = 'Vui lòng nhập tên server.'
    return
  }

  isCreating.value = true
  try {
    const payload = { name: newServerName.value.trim() }
    const created = await serverStore.createServer(payload)

    if (created?.id && selectedAvatarFile.value) {
      await serverStore.updateServerAvatar(created.id, selectedAvatarFile.value)
    }

    showToast('Tạo server thành công.')
    emit('created', created)
    close()
  } catch (error) {
    modalError.value = error.response?.data?.message || 'Tạo server thất bại.'
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <AppModal
    :show="show"
    title="Tạo server mới"
    subtitle="Nhập tên server bạn muốn tạo."
    confirm-text="Tạo"
    cancel-text="Hủy"
    :loading="isCreating"
    @close="close"
    @confirm="handleConfirm"
  >
    <div class="modal-content">
      <input
        v-model="newServerName"
        type="text"
        class="modal-input"
        placeholder="Ví dụ: Team Product"
        maxlength="50"
      />

      <div class="modal-avatar-row">
        <img
          v-if="avatarPreview"
          :src="avatarPreview"
          alt="Avatar preview"
          class="modal-avatar"
        />
        <div v-else class="modal-avatar modal-avatar--placeholder">
          {{ (newServerName || 'S').charAt(0).toUpperCase() }}
        </div>

        <input
          type="file"
          accept="image/*"
          class="modal-file-input"
          @change="handleAvatarSelected"
        />
      </div>
    </div>

    <p v-if="modalError" class="modal-error">{{ modalError }}</p>
  </AppModal>

  <AvatarCropModal
    v-model:show="showCropModal"
    :file="pendingCropFile"
    title="Cắt ảnh server"
    @cropped="handleAvatarCropped"
  />
</template>

<style scoped>
.modal-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

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

.modal-avatar-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-avatar {
  width: 44px;
  height: 44px;
  border-radius: 9999px;
  object-fit: cover;
  border: 1px solid #4b5563;
}

.modal-avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #374151;
  color: #e5e7eb;
  font-weight: 700;
}

.modal-file-input {
  color: #d1d5db;
  font-size: 12px;
}

.modal-error {
  margin: 8px 0 0;
  color: #fca5a5;
  font-size: 13px;
}
</style>
