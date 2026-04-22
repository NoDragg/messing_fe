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
  <div class="invite-view">
    <div class="invite-view__card">
      <h1 class="invite-view__title">Tham gia server</h1>

      <p v-if="isLoading" class="invite-view__status invite-view__status--loading">{{ message }}</p>
      <p v-else-if="error" class="invite-view__status invite-view__status--error">{{ error }}</p>
      <p v-else class="invite-view__status invite-view__status--success">{{ message }}</p>

      <div class="invite-view__action-wrap">
        <RouterLink
          v-if="error"
          :to="{ name: 'home' }"
          class="invite-view__home-link"
        >
          Về trang chính
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.invite-view {
  display: flex;
  min-height: 100svh;
  width: 100%;
  align-items: center;
  justify-content: center;
  background-color: #111827;
  padding: 24px 16px;
  color: #f3f4f6;
  box-sizing: border-box;
}

.invite-view__card {
  width: min(448px, 100%);
  border: 1px solid #374151;
  border-radius: 18px;
  background-color: #1f2937;
  padding: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
}

.invite-view__title {
  margin: 0 0 8px;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
}

.invite-view__status {
  margin: 0;
  text-align: center;
  font-size: 14px;
}

.invite-view__status--loading {
  color: #d1d5db;
}

.invite-view__status--error {
  color: #f87171;
}

.invite-view__status--success {
  color: #34d399;
}

.invite-view__action-wrap {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.invite-view__home-link {
  border-radius: 10px;
  background-color: #4f46e5;
  padding: 10px 16px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.2s ease;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.invite-view__home-link:hover {
  background-color: #6366f1;
}

@media (max-width: 640px) {
  .invite-view {
    align-items: flex-start;
    padding: 16px 12px 24px;
  }

  .invite-view__card {
    padding: 20px 18px;
    border-radius: 18px;
  }

  .invite-view__title {
    font-size: 18px;
  }
}
</style>
