import axios from 'axios'
import { loadRuntimeConfig } from '@/config'

let unauthorizedHandler = null

const api = axios.create({
  baseURL: '/',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler
}

export const initApiClient = async () => {
  const { apiBaseUrl } = await loadRuntimeConfig()
  api.defaults.baseURL = apiBaseUrl

  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token')
      const url = config.url || ''
      const isAuthEndpoint = url.includes('/api/auth/login') || url.includes('/api/auth/register')

      if (token && !isAuthEndpoint) {
        config.headers.Authorization = `Bearer ${token}`
      }

      return config
    },
    (error) => Promise.reject(error),
  )

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')

        if (typeof unauthorizedHandler === 'function') {
          unauthorizedHandler()
        }
      }

      return Promise.reject(error)
    },
  )
}

export default api
