<script setup>
import { onMounted, onUnmounted, reactive } from 'vue'
import { LogIn } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  identifier: '',
  password: '',
})

const handleLogin = async () => {
  try {
    await authStore.login(form.identifier, form.password)

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
  <div class="login-view">
    <div class="login-view__card">
      <h1 class="login-view__title">Chào mừng trở lại!</h1>
      <p class="login-view__subtitle">Rất vui khi thấy bạn quay lại!</p>

      <form class="login-view__form" @submit.prevent="handleLogin">
        <div>
          <label class="login-view__label">
            Email hoặc tên đăng nhập <span class="login-view__required">*</span>
          </label>
          <input
            v-model="form.identifier"
            type="text"
            required
            class="login-view__input"
            placeholder="you@example.com hoặc your_username"
          />
        </div>

        <div>
          <label class="login-view__label">
            Mật khẩu <span class="login-view__required">*</span>
          </label>
          <input
            v-model="form.password"
            type="password"
            required
            class="login-view__input"
            placeholder="••••••••"
          />

          <button type="button" class="login-view__forgot-password">Quên mật khẩu?</button>
        </div>

        <p v-if="authStore.error" class="login-view__error">{{ authStore.error }}</p>

        <button
          type="submit"
          :disabled="authStore.isLoading"
          class="login-view__submit-button"
        >
          <span v-if="authStore.isLoading" class="login-view__spinner"></span>
          <LogIn v-else :size="16" />
          <span>{{ authStore.isLoading ? 'Đang đăng nhập...' : 'Đăng nhập' }}</span>
        </button>
      </form>

      <p class="login-view__register-hint">
        Cần một tài khoản?
        <RouterLink to="/register" class="login-view__register-link">Đăng ký</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-view {
  display: flex;
  height: 100vh;
  width: 100vw;
  align-items: center;
  justify-content: center;
  background-color: #111827;
  padding: 0 16px;
  box-sizing: border-box;
}

.login-view__card {
  width: 480px;
  max-width: 100%;
  border-radius: 6px;
  background-color: #1f2937;
  padding: 32px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
}

.login-view__title {
  margin: 0;
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
}

.login-view__subtitle {
  margin-top: 8px;
  margin-bottom: 0;
  text-align: center;
  font-size: 14px;
  color: #9ca3af;
}

.login-view__form {
  margin-top: 24px;
}

.login-view__form > * + * {
  margin-top: 16px;
}

.login-view__label {
  margin-bottom: 8px;
  display: block;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #d1d5db;
}

.login-view__required {
  color: #ef4444;
}

.login-view__input {
  width: 100%;
  border: none;
  border-radius: 4px;
  background-color: #111827;
  padding: 10px 12px;
  color: #ffffff;
  font-size: 14px;
  box-sizing: border-box;
}

.login-view__input::placeholder {
  color: #6b7280;
}

.login-view__input:focus {
  outline: none;
}

.login-view__forgot-password {
  margin-top: 8px;
  border: none;
  background: transparent;
  padding: 0;
  color: #60a5fa;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.login-view__forgot-password:hover {
  text-decoration: underline;
}

.login-view__error {
  margin: 0;
  font-size: 14px;
  color: #ef4444;
}

.login-view__submit-button {
  margin-top: 16px;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 4px;
  background-color: #6366f1;
  padding: 10px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.login-view__submit-button:hover {
  background-color: #4f46e5;
}

.login-view__submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.login-view__spinner {
  height: 16px;
  width: 16px;
  animation: login-spin 1s linear infinite;
}

@keyframes login-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.login-view__register-hint {
  margin-top: 24px;
  margin-bottom: 0;
  font-size: 14px;
  color: #9ca3af;
}

.login-view__register-link {
  color: #60a5fa;
  font-weight: 500;
}

.login-view__register-link:hover {
  text-decoration: underline;
}
</style>
