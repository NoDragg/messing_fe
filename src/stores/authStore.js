import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import api, { setUnauthorizedHandler } from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const safeParseUser = (rawValue) => {
    try {
      return JSON.parse(rawValue || 'null')
    } catch {
      return null
    }
  }

  const token = ref(localStorage.getItem('token') || '')
  const user = ref(safeParseUser(localStorage.getItem('user')))
  const isLoading = ref(false)
  const error = ref('')

  const isTokenExpired = (jwt) => {
    if (!jwt) return true

    try {
      const payload = JSON.parse(atob(jwt.split('.')[1]))
      if (!payload.exp) return false
      return Date.now() >= payload.exp * 1000
    } catch {
      return true
    }
  }

  const isAuthenticated = computed(() => Boolean(token.value) && !isTokenExpired(token.value))

  const setAuthData = (payload) => {
    token.value = payload.token
    user.value = payload.user
    error.value = ''

    localStorage.setItem('token', payload.token)
    localStorage.setItem('user', JSON.stringify(payload.user))

    api.defaults.headers.common.Authorization = `Bearer ${payload.token}`
  }

  const clearAuthData = () => {
    token.value = ''
    user.value = null
    error.value = ''

    localStorage.removeItem('token')
    localStorage.removeItem('user')

    delete api.defaults.headers.common.Authorization
  }

  const initAuth = () => {
    const storedToken = localStorage.getItem('token') || ''
    const storedUser = safeParseUser(localStorage.getItem('user'))

    if (storedToken && isTokenExpired(storedToken)) {
      clearAuthData()
      return
    }

    token.value = storedToken
    user.value = storedUser

    if (storedToken) {
      api.defaults.headers.common.Authorization = `Bearer ${storedToken}`
    }
  }

  const login = async (email, password) => {
    try {
      isLoading.value = true
      error.value = ''

      const response = await api.post('/api/auth/login', {
        email,
        password,
      })

      setAuthData({
        token: response.data.token,
        user: {
          id: response.data.userId,
          username: response.data.username,
          email: response.data.email,
        },
      })

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Email hoặc mật khẩu không đúng.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const register = async (payload) => {
    try {
      isLoading.value = true
      error.value = ''
      const response = await api.post('/api/auth/register', payload)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const resetAuthUiState = () => {
    isLoading.value = false
    error.value = ''
  }

  const logout = () => {
    clearAuthData()
  }

  const ensureValidSession = () => {
    if (token.value && isTokenExpired(token.value)) {
      clearAuthData()
      return false
    }

    return Boolean(token.value)
  }

  setUnauthorizedHandler(() => {
    clearAuthData()
    resetAuthUiState()
  })

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    error,
    login,
    register,
    logout,
    initAuth,
    ensureValidSession,
    resetAuthUiState,
  }
})
