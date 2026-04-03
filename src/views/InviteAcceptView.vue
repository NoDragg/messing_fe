<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useServerStore } from '@/stores/serverStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const serverStore = useServerStore()

const isLoading = ref(true)
const message = ref('Đang xử lý lời mời...')
const error = ref('')

onMounted(async () => {
  const code = String(route.params.code || '')

  if (!code) {
    error.value = 'Mã mời không hợp lệ.'
    isLoading.value = false
    return
  }

  if (!authStore.isAuthenticated) {
    await router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }

  try {
    const response = await serverStore.acceptInvite(code)
    message.value = response?.message || 'Tham gia server thành công. Đang chuyển hướng...'
    await router.push({ name: 'home' })
  } catch (err) {
    error.value = err.response?.data?.message || 'Không thể tham gia server bằng mã mời này.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="flex h-screen w-screen items-center justify-center bg-gray-900 px-4 text-gray-100">
    <div class="w-full max-w-md rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-2xl">
      <h1 class="mb-2 text-center text-xl font-bold text-white">Tham gia server</h1>

      <p v-if="isLoading" class="text-center text-sm text-gray-300">{{ message }}</p>
      <p v-else-if="error" class="text-center text-sm text-red-400">{{ error }}</p>
      <p v-else class="text-center text-sm text-emerald-400">{{ message }}</p>

      <div class="mt-6 flex justify-center">
        <RouterLink
          v-if="error"
          :to="{ name: 'home' }"
          class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Về trang chính
        </RouterLink>
      </div>
    </div>
  </div>
</template>
