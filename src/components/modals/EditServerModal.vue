<script setup>
import { ref, watch } from 'vue'
import AppModal from '@/components/AppModal.vue'
import AvatarCropModal from '@/components/modals/AvatarCropModal.vue'
import { useServerStore } from '@/stores/serverStore'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  show: Boolean,
  server: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:show', 'updated'])

const serverStore = useServerStore()
const { showToast } = useToast()

const serverName = ref('')
const botDisplayName = ref('')
const selectedAvatarFile = ref(null)
const botAvatarPreview = ref('')
const pendingCropFile = ref(null)
const showCropModal = ref(false)
const modalError = ref('')
const isSaving = ref(false)

const getDisplayName = (value) => value?.displayName || value?.loginName || value?.username || value?.name || 'Messing Bot'

watch(
  () => props.show,
  (visible) => {
    if (!visible) return

    serverName.value = props.server?.name || ''
    botDisplayName.value = getDisplayName(props.server?.botUser) || props.server?.botDisplayName || 'Messing Bot'
    botAvatarPreview.value = props.server?.botUser?.avatarUrl || props.server?.botAvatarUrl || ''
    selectedAvatarFile.value = null
    modalError.value = ''
  },
)

const close = () => {
  emit('update:show', false)
  selectedAvatarFile.value = null
  modalError.value = ''
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
  botAvatarPreview.value = previewUrl
  pendingCropFile.value = null
  showCropModal.value = false
}

const handleConfirm = async () => {
  if (!props.server?.id) {
    modalError.value = 'Không tìm thấy server cần chỉnh sửa.'
    return
  }

  if (!serverName.value.trim()) {
    modalError.value = 'Vui lòng nhập tên server.'
    return
  }

  isSaving.value = true
  modalError.value = ''

  try {
    await serverStore.updateServer(props.server.id, {
      name: serverName.value.trim(),
    })

    const nextBotDisplayName = botDisplayName.value.trim()

    if (selectedAvatarFile.value || nextBotDisplayName) {
      await serverStore.updateServerBot(props.server.id, {
        displayName: nextBotDisplayName || undefined,
        avatarFile: selectedAvatarFile.value || null,
      })
    }

    showToast('Cập nhật server thành công.', 'success')
    emit('updated')
    close()
  } catch (error) {
    modalError.value = error.response?.data?.message || 'Cập nhật server thất bại.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <AppModal
    :show="show"
    title="Chỉnh sửa server"
    subtitle="Cập nhật tên và ảnh đại diện server"
    confirm-text="Lưu"
    cancel-text="Hủy"
    :loading="isSaving"
    @close="close"
    @confirm="handleConfirm"
  >
    <div class="edit-server-modal__content">
      <label class="edit-server-modal__label" for="server-name">Tên server</label>
      <input
        id="server-name"
        v-model="serverName"
        type="text"
        class="edit-server-modal__input"
        maxlength="100"
        placeholder="Nhập tên server"
      />

      <div class="edit-server-modal__section">
        <div class="edit-server-modal__section-title">Bot của server</div>
        <label class="edit-server-modal__label" for="bot-display-name">Tên hiển thị bot</label>
        <input
          id="bot-display-name"
          v-model="botDisplayName"
          type="text"
          class="edit-server-modal__input"
          maxlength="100"
          placeholder="Ví dụ: Messing Helper"
        />

        <label class="edit-server-modal__label" for="bot-avatar">Avatar bot</label>
        <div class="edit-server-modal__avatar-row">
          <img
            v-if="botAvatarPreview"
            :src="botAvatarPreview"
            alt="Bot avatar preview"
            class="edit-server-modal__avatar"
          />
          <div v-else class="edit-server-modal__avatar edit-server-modal__avatar--placeholder">
            {{ (botDisplayName || 'B').charAt(0).toUpperCase() }}
          </div>

          <input
            id="bot-avatar"
            type="file"
            accept="image/*"
            class="edit-server-modal__file-input"
            @change="handleAvatarSelected"
          />
        </div>
      </div>

      <p v-if="modalError" class="edit-server-modal__error">{{ modalError }}</p>
    </div>
  </AppModal>

  <AvatarCropModal
    v-model:show="showCropModal"
    :file="pendingCropFile"
    title="Cắt ảnh server"
    @cropped="handleAvatarCropped"
  />
</template>

<style scoped>
.edit-server-modal__content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.edit-server-modal__label {
  font-size: 13px;
  color: #cbd5e1;
}

.edit-server-modal__input {
  width: 100%;
  border: 1px solid #4b5563;
  border-radius: 8px;
  background: #111827;
  color: #f9fafb;
  padding: 10px 12px;
  box-sizing: border-box;
}

.edit-server-modal__input:focus {
  outline: 1px solid #6366f1;
}

.edit-server-modal__avatar-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.edit-server-modal__avatar {
  width: 48px;
  height: 48px;
  border-radius: 9999px;
  object-fit: cover;
  border: 1px solid #4b5563;
}

.edit-server-modal__avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #374151;
  color: #e5e7eb;
  font-weight: 700;
}

.edit-server-modal__file-input {
  color: #d1d5db;
  font-size: 12px;
}

.edit-server-modal__error {
  margin: 0;
  color: #fca5a5;
  font-size: 13px;
}
</style>
