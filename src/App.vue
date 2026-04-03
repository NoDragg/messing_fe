<script setup>
import { useToast } from '@/composables/useToast'
import AppToast from '@/components/AppToast.vue'

const { toastState } = useToast()
</script>

<template>
  <RouterView />
  <AppToast :show="toastState.show" :message="toastState.message" :type="toastState.type" size="md" position="top-right" />
</template>
