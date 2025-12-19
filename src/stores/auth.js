import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(null)
  const isAuthenticated = computed(() => !!token.value)
  let interceptorId = null

  const setAuthHeader = (val) => {
    if (val) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${val}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }

  const ensureInterceptor = () => {
    if (interceptorId !== null) return
    interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status
        if (status === 401) {
          logout(false)
          window.location.href = '/admin/login'
        }
        return Promise.reject(error)
      }
    )
  }

  async function login(username, password) {
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', { username, password })
      token.value = response.data.token
      user.value = response.data.user
      localStorage.setItem('token', token.value)
      setAuthHeader(token.value)
      ensureInterceptor()
      return true
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  function logout(redirect = true) {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    setAuthHeader(null)
    if (redirect) {
      window.location.href = '/admin/login'
    }
  }

  if (token.value) {
    setAuthHeader(token.value)
    ensureInterceptor()
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout
  }
})
