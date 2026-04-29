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
      loginName: form.username.trim(),
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
          <p class="register-view__hint">Username chỉ dùng để đăng nhập, không hiển thị trong chat.</p>
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
  min-height: 100svh;
  width: 100%;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, rgba(124, 140, 255, 0.16), transparent 34%), linear-gradient(180deg, rgba(12, 16, 28, 1), rgba(8, 12, 20, 1));
  padding: 24px 16px;
  box-sizing: border-box;
}

.register-view__card {
  width: min(480px, 100%);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(17, 23, 38, 0.98), rgba(11, 15, 25, 0.98));
  padding: 34px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
  border: 1px solid rgba(129, 140, 248, 0.12);
  animation: auth-card-in 360ms cubic-bezier(.2,.8,.2,1);
}

.register-view__title {
  margin: 0;
  text-align: center;
  font-size: 24px;
  font-weight: 800;
  color: #f4f7ff;
}

.register-view__subtitle {
  margin: 8px 0 24px;
  text-align: center;
  font-size: 15px;
  color: #9ca9c4;
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
  color: #d1d9ee;
}

.register-view__required {
  color: #ffb3c0;
}

.register-view__input {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 14px;
  background: rgba(18, 24, 40, 0.96);
  padding: 12px 14px;
  color: #f4f8ff;
  font-size: 14px;
  box-sizing: border-box;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    background-color var(--transition-fast);
}

.register-view__input::placeholder {
  color: #8a96b1;
}

.register-view__input:focus {
  outline: none;
  border-color: rgba(124, 140, 255, 0.45);
  box-shadow: 0 0 0 4px rgba(124, 140, 255, 0.12);
  background: rgba(20, 26, 43, 0.98);
}

.register-view__error {
  margin: 0;
  font-size: 14px;
  color: #ffb3c0;
}

.register-view__submit-button {
  margin-top: 24px;
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

.register-view__submit-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(86, 104, 255, 0.34);
}

.register-view__submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
  transform: none;
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

.register-view__login-hint {
  margin-top: 16px;
  margin-bottom: 0;
  font-size: 14px;
  color: #9ca9c4;
}

.register-view__login-link {
  color: #8eb4ff;
  font-weight: 600;
}

.register-view__login-link:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .register-view {
    align-items: flex-start;
    padding: 16px 12px 24px;
  }

  .register-view__card {
    padding: 24px 18px 22px;
    border-radius: 18px;
  }

  .register-view__title {
    font-size: 22px;
  }

  .register-view__subtitle {
    font-size: 13px;
  }

  .register-view__input {
    padding: 13px 14px;
    font-size: 16px;
  }

  .register-view__label {
    font-size: 11px;
  }
}
</style>
