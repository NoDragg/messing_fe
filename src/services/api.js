import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/'

let unauthorizedHandler = null

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

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

export default api
