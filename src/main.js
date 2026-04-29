import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/authStore'
import { initApiClient } from '@/services/api'

const bootstrap = async () => {
  await initApiClient()

  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)

  const authStore = useAuthStore(pinia)
  await authStore.initAuth()

  app.use(router)
  app.mount('#app')
}

bootstrap()
