<script setup>
import { reactive } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

const form = reactive({
  username: '',
  email: '',
  password: '',
})

const handleRegister = async () => {
  try {
    await authStore.register({
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
    })

    await authStore.login(form.email.trim(), form.password)
  } catch {
    // error handled in authStore.error
  }
}
</script>

<template>
  <div class="flex min-h-screen w-screen items-center justify-center bg-[#5865F2] px-4">
    <div class="w-[480px] max-w-full rounded-[5px] bg-[#313338] p-8 shadow-[0_2px_10px_0_rgba(0,0,0,0.2)]">
      <h1 class="text-center text-2xl font-semibold text-[#f2f3f5]">Tạo tài khoản</h1>
      <p class="mt-2 mb-6 text-center text-[15px] text-[#b5bac1]">Tham gia Messing Chat ngay hôm nay!</p>

      <form class="space-y-4" @submit.prevent="handleRegister">
        <div>
          <label class="mb-2 block text-xs font-bold uppercase tracking-wide text-[#b5bac1]">
            Username <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.username"
            type="text"
            required
            class="w-full rounded-[3px] bg-[#1e1f22] p-2.5 text-[15px] text-[#dbdee1] placeholder-[#87909c] outline-none transition focus:ring-0"
            placeholder="your_name"
          />
        </div>

        <div>
           <label class="mb-2 block text-xs font-bold uppercase tracking-wide text-[#b5bac1]">
            Email <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.email"
            type="email"
            required
            class="w-full rounded-[3px] bg-[#1e1f22] p-2.5 text-[15px] text-[#dbdee1] placeholder-[#87909c] outline-none transition focus:ring-0"
            placeholder="you@example.com"
          />
        </div>

        <div>
           <label class="mb-2 block text-xs font-bold uppercase tracking-wide text-[#b5bac1]">
            Password <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.password"
            type="password"
            required
            class="w-full rounded-[3px] bg-[#1e1f22] p-2.5 text-[15px] text-[#dbdee1] placeholder-[#87909c] outline-none transition focus:ring-0"
            placeholder="••••••••"
          />
        </div>

        <p v-if="authStore.error" class="text-sm text-red-400">{{ authStore.error }}</p>

        <button
          type="submit"
          :disabled="authStore.isLoading"
          class="flex w-full items-center justify-center gap-2 rounded-[3px] bg-[#5865F2] py-2.5 text-[15px] font-medium text-white transition hover:bg-[#4752C4] disabled:cursor-not-allowed disabled:opacity-60 mt-6"
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
          <span>{{ authStore.isLoading ? 'Đang xử lý...' : 'Đăng ký' }}</span>
        </button>
      </form>

      <p class="mt-4 text-[14px] text-[#b5bac1]">
        Đã có tài khoản?
        <RouterLink class="font-medium text-[#00a8fc] hover:underline" :to="{ name: 'login' }">
          Đăng nhập
        </RouterLink>
      </p>
    </div>
  </div>
</template>
