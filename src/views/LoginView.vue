<script setup>
import { onMounted, onUnmounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})

const handleLogin = async () => {
  try {
    await authStore.login(form.email, form.password)

    const redirectPath = typeof router.currentRoute.value.query.redirect === 'string'
      ? router.currentRoute.value.query.redirect
      : null

    if (redirectPath) {
      await router.push(redirectPath)
      return
    }

    await router.push({ name: 'home' })
  } catch {
    // Error state is managed in authStore.error
  }
}

onMounted(() => {
  authStore.resetAuthUiState()
})

onUnmounted(() => {
  authStore.resetAuthUiState()
})
</script>

<template>
  <div class="flex h-screen w-screen items-center justify-center bg-gray-900 px-4">
    <!-- Form Card -->
    <div class="w-[480px] max-w-full rounded-md bg-gray-800 p-8 shadow-2xl">
      <h1 class="text-center text-2xl font-bold text-white">Chào mừng trở lại!</h1>
      <p class="mt-2 text-center text-sm text-gray-400">Rất vui khi thấy bạn quay lại!</p>

      <form class="mt-6 space-y-4" @submit.prevent="handleLogin">
        <div>
          <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-300">
            Email <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.email"
            type="email"
            required
            class="w-full rounded bg-gray-900 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-0"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-300">
            Mật khẩu <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.password"
            type="password"
            required
            class="w-full rounded bg-gray-900 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-0"
            placeholder="••••••••"
          />

          <button type="button" class="mt-2 text-xs font-medium text-blue-400 hover:underline">Quên mật khẩu?</button>
        </div>

        <p v-if="authStore.error" class="text-sm text-red-500">{{ authStore.error }}</p>

        <button
          type="submit"
          :disabled="authStore.isLoading"
          class="mt-4 flex w-full items-center justify-center gap-2 rounded bg-indigo-500 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg
            v-if="authStore.isLoading"
            class="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>{{ authStore.isLoading ? 'Đang đăng nhập...' : 'Đăng nhập' }}</span>
        </button>
      </form>

      <p class="mt-6 text-sm text-gray-400">
        Cần một tài khoản?
        <RouterLink to="/register" class="font-medium text-blue-400 hover:underline">Đăng ký</RouterLink>
      </p>
    </div>
  </div>
</template>
