<script setup>
import { useToast } from '@/composables/useToast'
import AppToast from '@/components/AppToast.vue'

const { toastState } = useToast()
</script>

<template>
  <div class="app-shell">
    <RouterView />
    <AppToast :show="toastState.show" :message="toastState.message" :type="toastState.type" size="md" position="top-right" />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100svh;
  animation: ui-fade-in 240ms ease;
}

:deep(*) {
  scrollbar-color: rgba(255, 127, 193, 0.32) rgba(24, 15, 27, 0.7);
}

:deep(::-webkit-scrollbar) {
  width: 10px;
  height: 10px;
}

:deep(::-webkit-scrollbar-track) {
  background: rgba(24, 15, 27, 0.7);
}

:deep(::-webkit-scrollbar-thumb) {
  background: linear-gradient(180deg, rgba(255, 127, 193, 0.5), rgba(184, 106, 232, 0.34));
  border-radius: 999px;
  border: 2px solid rgba(24, 15, 27, 0.7);
}

:deep(::-webkit-scrollbar-thumb:hover) {
  background: linear-gradient(180deg, rgba(255, 127, 193, 0.74), rgba(184, 106, 232, 0.5));
}

@media (max-width: 768px) {
  .app-shell {
    min-height: 100dvh;
  }

  :deep(::-webkit-scrollbar) {
    width: 6px;
    height: 6px;
  }
}
</style>
