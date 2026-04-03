<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'success',
  },
  size: {
    type: String,
    default: 'md',
  },
  position: {
    type: String,
    default: 'bottom-right',
  },
})

const variantClass = computed(() => {
  if (props.type === 'danger' || props.type === 'error') return 'app-toast--danger'
  if (props.type === 'warning') return 'app-toast--warning'
  if (props.type === 'info') return 'app-toast--info'
  return 'app-toast--success'
})
</script>

<template>
  <div
    v-if="show"
    class="app-toast"
    :class="[
      variantClass,
      `app-toast--${size}`,
      `app-toast--pos-${position}`,
    ]"
  >
    {{ message }}
  </div>
</template>

<style scoped>
.app-toast {
  position: fixed;
  z-index: 60;
  border-radius: 10px;
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}

.app-toast--sm {
  padding: 8px 10px;
  font-size: 12px;
}

.app-toast--md {
  padding: 10px 12px;
  font-size: 14px;
}

.app-toast--lg {
  padding: 12px 14px;
  font-size: 15px;
}

.app-toast--pos-bottom-right {
  right: 16px;
  bottom: 16px;
}

.app-toast--pos-bottom-left {
  left: 16px;
  bottom: 16px;
}

.app-toast--pos-top-right {
  right: 16px;
  top: 16px;
}

.app-toast--pos-top-left {
  left: 16px;
  top: 16px;
}

.app-toast--success {
  background: #16a34a;
}

.app-toast--danger {
  background: #dc2626;
}

.app-toast--warning {
  background: #d97706;
}

.app-toast--info {
  background: #2563eb;
}
</style>
