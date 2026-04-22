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
  scrollbar-color: rgba(124, 140, 255, 0.35) rgba(8, 12, 22, 0.7);
}

:deep(::-webkit-scrollbar) {
  width: 10px;
  height: 10px;
}

:deep(::-webkit-scrollbar-track) {
  background: rgba(8, 12, 22, 0.7);
}

:deep(::-webkit-scrollbar-thumb) {
  background: linear-gradient(180deg, rgba(124, 140, 255, 0.55), rgba(82, 97, 255, 0.32));
  border-radius: 999px;
  border: 2px solid rgba(8, 12, 22, 0.7);
}

:deep(::-webkit-scrollbar-thumb:hover) {
  background: linear-gradient(180deg, rgba(124, 140, 255, 0.8), rgba(82, 97, 255, 0.5));
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
