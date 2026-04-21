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
  min-height: 100%;
  animation: ui-fade-in 240ms ease;
}
</style>
