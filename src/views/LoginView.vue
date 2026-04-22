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
  min-height: 100svh;
  width: 100%;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, rgba(124, 140, 255, 0.16), transparent 34%), linear-gradient(180deg, rgba(12, 16, 28, 1), rgba(8, 12, 20, 1));
  padding: 24px 16px;
  box-sizing: border-box;
}

.login-view__card {
  width: min(480px, 100%);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(17, 23, 38, 0.98), rgba(11, 15, 25, 0.98));
  padding: 34px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
  border: 1px solid rgba(129, 140, 248, 0.12);
  animation: auth-card-in 360ms cubic-bezier(.2,.8,.2,1);
}

.login-view__title {
  margin: 0;
  text-align: center;
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
}

.login-view__subtitle {
  margin-top: 8px;
  margin-bottom: 0;
  text-align: center;
  font-size: 14px;
  color: #9ca9c4;
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
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #d1d9ee;
}

.login-view__required {
  color: #ffb3c0;
}

.login-view__input {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 14px;
  background: rgba(18, 24, 40, 0.96);
  padding: 12px 14px;
  color: #ffffff;
  font-size: 14px;
  box-sizing: border-box;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    background-color var(--transition-fast);
}

.login-view__input::placeholder {
  color: #8a96b1;
}

.login-view__input:focus {
  outline: none;
  border-color: rgba(124, 140, 255, 0.45);
  box-shadow: 0 0 0 4px rgba(124, 140, 255, 0.12);
  background: rgba(20, 26, 43, 0.98);
}

.login-view__forgot-password {
  margin-top: 8px;
  border: none;
  background: transparent;
  padding: 0;
  color: #8eb4ff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.login-view__forgot-password:hover {
  text-decoration: underline;
}

.login-view__error {
  margin: 0;
  font-size: 14px;
  color: #ffb3c0;
}

.login-view__submit-button {
  margin-top: 16px;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(124, 140, 255, 0.96), rgba(86, 104, 255, 0.96));
  padding: 12px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    opacity var(--transition-fast);
  box-shadow: 0 12px 24px rgba(86, 104, 255, 0.24);
  min-height: 48px;
}

.login-view__submit-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(86, 104, 255, 0.34);
}

.login-view__submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
  transform: none;
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

@keyframes auth-card-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.99);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.login-view__register-hint {
  margin-top: 24px;
  margin-bottom: 0;
  font-size: 14px;
  color: #9ca9c4;
}

.login-view__register-link {
  color: #8eb4ff;
  font-weight: 600;
}

.login-view__register-link:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .login-view {
    align-items: flex-start;
    padding: 16px 12px 24px;
  }

  .login-view__card {
    padding: 24px 18px 22px;
    border-radius: 18px;
  }

  .login-view__title {
    font-size: 22px;
  }

  .login-view__subtitle {
    font-size: 13px;
  }

  .login-view__label {
    font-size: 11px;
  }

  .login-view__input {
    padding: 13px 14px;
    border-radius: 12px;
    font-size: 16px;
  }

  .login-view__submit-button {
    min-height: 50px;
    border-radius: 12px;
  }
}
</style>
