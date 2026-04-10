<script setup>
import { ref } from 'vue'
import AppModal from '@/components/AppModal.vue'
import { useServerStore } from '@/stores/serverStore'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  show: Boolean,
})
const emit = defineEmits(['update:show', 'created'])

const serverStore = useServerStore()
const { showToast } = useToast()

const newChannelName = ref('')
const channelType = ref('TEXT')
const modalError = ref('')
const isCreating = ref(false)

const close = () => {
  emit('update:show', false)
  modalError.value = ''
  newChannelName.value = ''
  channelType.value = 'TEXT'
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
      type: channelType.value,
    })

    const channelKindLabel = channelType.value === 'VOICE' ? 'voice channel' : 'text channel'
    showToast(`Tạo ${channelKindLabel} thành công.`, 'success')
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
    subtitle="Chọn loại channel và đặt tên."
    confirm-text="Tạo"
    cancel-text="Hủy"
    :loading="isCreating"
    @close="close"
    @confirm="handleConfirm"
  >
    <div class="channel-type-picker">
      <label class="channel-type-picker__option">
        <input
          v-model="channelType"
          type="radio"
          value="TEXT"
          name="channelType"
        />
        <span># Text channel</span>
      </label>

      <label class="channel-type-picker__option">
        <input
          v-model="channelType"
          type="radio"
          value="VOICE"
          name="channelType"
        />
        <span>🔊 Voice channel</span>
      </label>
    </div>

    <input
      v-model="newChannelName"
      type="text"
      class="modal-input"
      :placeholder="channelType === 'VOICE' ? 'Ví dụ: Meeting Room' : 'Ví dụ: general'"
      maxlength="50"
    />
    <p v-if="modalError" class="modal-error">{{ modalError }}</p>
  </AppModal>
</template>

<style scoped>
.channel-type-picker {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.channel-type-picker__option {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #4b5563;
  border-radius: 8px;
  background: #111827;
  color: #f9fafb;
  padding: 10px;
  cursor: pointer;
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

.modal-error {
  margin: 8px 0 0;
  color: #fca5a5;
  font-size: 13px;
}
</style>
