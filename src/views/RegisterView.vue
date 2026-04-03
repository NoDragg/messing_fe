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
  <div class="register-view">
    <div class="register-view__card">
      <h1 class="register-view__title">Tạo tài khoản</h1>
      <p class="register-view__subtitle">Tham gia Messing Chat ngay hôm nay!</p>

      <form class="register-view__form" @submit.prevent="handleRegister">
        <div>
          <label class="register-view__label">
            Username <span class="register-view__required">*</span>
          </label>
          <input
            v-model="form.username"
            type="text"
            required
            class="register-view__input"
            placeholder="your_name"
          />
        </div>

        <div>
          <label class="register-view__label">
            Email <span class="register-view__required">*</span>
          </label>
          <input
            v-model="form.email"
            type="email"
            required
            class="register-view__input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label class="register-view__label">
            Password <span class="register-view__required">*</span>
          </label>
          <input
            v-model="form.password"
            type="password"
            required
            class="register-view__input"
            placeholder="••••••••"
          />
        </div>

        <p v-if="authStore.error" class="register-view__error">{{ authStore.error }}</p>

        <button
          type="submit"
          :disabled="authStore.isLoading"
          class="register-view__submit-button"
        >
          <svg
            v-if="authStore.isLoading"
            class="register-view__spinner"
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

      <p class="register-view__login-hint">
        Đã có tài khoản?
        <RouterLink class="register-view__login-link" :to="{ name: 'login' }">
          Đăng nhập
        </RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.register-view {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  align-items: center;
  justify-content: center;
  background-color: #5865f2;
  padding: 0 16px;
  box-sizing: border-box;
}

.register-view__card {
  width: 480px;
  max-width: 100%;
  border-radius: 5px;
  background-color: #313338;
  padding: 32px;
  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.register-view__title {
  margin: 0;
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  color: #f2f3f5;
}

.register-view__subtitle {
  margin: 8px 0 24px;
  text-align: center;
  font-size: 15px;
  color: #b5bac1;
}

.register-view__form > * + * {
  margin-top: 16px;
}

.register-view__label {
  margin-bottom: 8px;
  display: block;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #b5bac1;
}

.register-view__required {
  color: #ef4444;
}

.register-view__input {
  width: 100%;
  border: none;
  border-radius: 3px;
  background-color: #1e1f22;
  padding: 10px;
  color: #dbdee1;
  font-size: 15px;
  box-sizing: border-box;
}

.register-view__input::placeholder {
  color: #87909c;
}

.register-view__input:focus {
  outline: none;
}

.register-view__error {
  margin: 0;
  font-size: 14px;
  color: #f87171;
}

.register-view__submit-button {
  margin-top: 24px;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 3px;
  background-color: #5865f2;
  padding: 10px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.register-view__submit-button:hover {
  background-color: #4752c4;
}

.register-view__submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.register-view__spinner {
  height: 16px;
  width: 16px;
  animation: register-spin 1s linear infinite;
}

@keyframes register-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.register-view__login-hint {
  margin-top: 16px;
  margin-bottom: 0;
  font-size: 14px;
  color: #b5bac1;
}

.register-view__login-link {
  color: #00a8fc;
  font-weight: 500;
}

.register-view__login-link:hover {
  text-decoration: underline;
}
</style>
