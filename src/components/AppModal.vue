<script setup>
const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  subtitle: {
    type: String,
    default: '',
  },
  confirmText: {
    type: String,
    default: 'Xác nhận',
  },
  cancelText: {
    type: String,
    default: 'Hủy',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  width: {
    type: String,
    default: '420px',
  },
})

const emit = defineEmits(['close', 'confirm'])
</script>

<template>
  <div v-if="props.show" class="app-modal__backdrop" @click="emit('close')">
    <div class="app-modal" :style="{ maxWidth: width }" @click.stop>
      <h3 class="app-modal__title">{{ title }}</h3>
      <p v-if="subtitle" class="app-modal__subtitle">{{ subtitle }}</p>

      <div class="app-modal__content">
        <slot />
      </div>

      <div class="app-modal__actions">
        <button type="button" class="app-modal__btn app-modal__btn--ghost" :disabled="loading" @click="emit('close')">
          {{ cancelText }}
        </button>
        <button type="button" class="app-modal__btn app-modal__btn--primary" :disabled="loading" @click="emit('confirm')">
          {{ loading ? 'Đang xử lý...' : confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-modal__backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(2, 6, 23, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
}

.app-modal {
  width: 100%;
  border: 1px solid #4b5563;
  border-radius: 12px;
  background: #1f2937;
  padding: 16px;
  box-sizing: border-box;
}

.app-modal__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #f9fafb;
}

.app-modal__subtitle {
  margin: 6px 0 12px;
  color: #9ca3af;
  font-size: 13px;
}

.app-modal__content {
  margin-top: 8px;
}

.app-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}

.app-modal__btn {
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 600;
}

.app-modal__btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.app-modal__btn--ghost {
  background: #374151;
  color: #f3f4f6;
}

.app-modal__btn--primary {
  background: #6366f1;
  color: #ffffff;
}
</style>
