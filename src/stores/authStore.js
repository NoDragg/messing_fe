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

  const normalizeUser = (payload = {}) => {
    const displayName = payload.displayName?.trim() || ''
    const username = payload.username?.trim() || ''
    return {
      ...payload,
      username,
      displayName,
      profileName: displayName || username,
    }
  }

  const syncProfile = async () => {
    if (!token.value) return null

    try {
      const response = await api.get('/api/users/me/profile')
      const profile = response.data || {}

      user.value = normalizeUser({
        ...(user.value || {}),
        username: profile.username || user.value?.username || '',
        displayName: profile.displayName || user.value?.displayName || '',
        bio: profile.bio || user.value?.bio || '',
        avatarUrl: profile.avatarUrl || profile.avatar || user.value?.avatarUrl || '',
      })

      localStorage.setItem('user', JSON.stringify(user.value))
      return user.value
    } catch {
      return null
    }
  }

  const clearAuthData = () => {
    token.value = ''
    user.value = null
    error.value = ''

    localStorage.removeItem('token')
    localStorage.removeItem('user')

    delete api.defaults.headers.common.Authorization
  }

  const initAuth = async () => {
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
      await syncProfile()
    }
  }

  const login = async (identifier, password) => {
    try {
      isLoading.value = true
      error.value = ''

      const response = await api.post('/api/auth/login', {
        identifier: identifier?.trim(),
        password,
      })

      setAuthData({
        token: response.data.token,
        user: normalizeUser({
          id: response.data.userId,
          username: response.data.username,
          displayName: response.data.displayName,
          email: response.data.email,
        }),
      })

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Tên đăng nhập/email hoặc mật khẩu không đúng.'
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

  const updateProfile = async (payload, avatarFile = null) => {
    isLoading.value = true
    error.value = ''

    try {
      const nextDisplayName = payload?.displayName ?? ''
      const nextBio = payload?.bio ?? ''

      const profileResponse = await api.put('/api/users/me/profile', {
        displayName: nextDisplayName,
        bio: nextBio,
      })

      let avatarUrl = user.value?.avatarUrl || ''
      if (avatarFile) {
        const formData = new FormData()
        formData.append('avatar', avatarFile)
        const avatarResponse = await api.post('/api/users/me/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        avatarUrl = avatarResponse.data?.avatarUrl || avatarResponse.data?.url || avatarUrl
      }

      user.value = normalizeUser({
        ...(user.value || {}),
        username: profileResponse.data?.username ?? user.value?.username ?? '',
        displayName: profileResponse.data?.displayName ?? nextDisplayName,
        bio: profileResponse.data?.bio ?? nextBio,
        avatarUrl: profileResponse.data?.avatarUrl || avatarUrl,
      })

      localStorage.setItem('user', JSON.stringify(user.value))

      return user.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Cập nhật hồ sơ thất bại.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const changePassword = async (payload) => {
    isLoading.value = true
    error.value = ''

    try {
      const response = await api.put('/api/users/me/password', payload)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Đổi mật khẩu thất bại.'
      throw err
    } finally {
      isLoading.value = false
    }
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
    updateProfile,
    changePassword,
    syncProfile,
    logout,
    initAuth,
    ensureValidSession,
    resetAuthUiState,
  }
})
