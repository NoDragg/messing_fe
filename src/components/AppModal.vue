''<script setup>
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
  background: rgba(2, 6, 23, 0.68);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  box-sizing: border-box;
  backdrop-filter: blur(10px);
  animation: modal-backdrop-in 220ms ease;
}

.app-modal {
  width: 100%;
  border: 1px solid rgba(129, 140, 248, 0.14);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(17, 23, 38, 0.98), rgba(11, 15, 25, 0.98));
  padding: 18px;
  box-sizing: border-box;
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.56), 0 0 0 1px rgba(255, 255, 255, 0.02);
  animation: modal-pop-in 240ms cubic-bezier(.2,.8,.2,1);
}

.app-modal__title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #f9fbff;
}

.app-modal__subtitle {
  margin: 8px 0 12px;
  color: #9ca9c4;
  font-size: 13px;
  line-height: 1.5;
}

.app-modal__content {
  margin-top: 8px;
  animation: ui-fade-up 220ms ease;
}

.app-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.app-modal__btn {
  border: none;
  border-radius: 12px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 700;
  transition:
    transform var(--transition-fast),
    background-color var(--transition-fast),
    box-shadow var(--transition-fast),
    color var(--transition-fast);
}

.app-modal__btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.app-modal__btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.app-modal__btn--ghost {
  background: rgba(255, 255, 255, 0.04);
  color: #eef2ff;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.app-modal__btn--ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.06);
}

.app-modal__btn--primary {
  background: linear-gradient(180deg, rgba(124, 140, 255, 0.95), rgba(86, 104, 255, 0.95));
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(86, 104, 255, 0.24);
}

.app-modal__btn--primary:hover:not(:disabled) {
  box-shadow: 0 14px 28px rgba(86, 104, 255, 0.34);
}

@keyframes modal-pop-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes modal-backdrop-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
