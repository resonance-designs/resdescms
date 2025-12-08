import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useThemeStore = defineStore('theme', () => {
  const themes = ref([])
  const activeTheme = ref(null)
  const loading = ref(false)
  const installing = ref(false)

  function applyCss(theme) {
    const existing = document.getElementById('active-theme-style')
    if (existing) existing.remove()

    if (theme?.styleUrl) {
      const link = document.createElement('link')
      link.id = 'active-theme-style'
      link.rel = 'stylesheet'
      link.href = theme.styleUrl
      document.head.appendChild(link)
    }

    const root = document.documentElement
    const toKebab = str => str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
    Object.entries(theme?.settings || {}).forEach(([key, value]) => {
      const cssValue = typeof value === 'number' ? `${value}px` : value
      const baseVar = `--theme-${key}`
      root.style.setProperty(baseVar, cssValue)
      const kebab = toKebab(key)
      if (kebab !== key) {
        root.style.setProperty(`--theme-${kebab}`, cssValue)
      }
    })
  }

  async function fetchThemes() {
    loading.value = true
    try {
      const response = await axios.get('http://localhost:3001/api/themes')
      themes.value = response.data || []
    } finally {
      loading.value = false
    }
  }

  async function loadActiveTheme() {
    const response = await axios.get('http://localhost:3001/api/themes/active')
    activeTheme.value = response.data
    applyCss(activeTheme.value)
    return activeTheme.value
  }

  async function activateTheme(slug) {
    const response = await axios.post('http://localhost:3001/api/themes/activate', { slug })
    activeTheme.value = response.data
    await fetchThemes()
    applyCss(activeTheme.value)
    return activeTheme.value
  }

  async function saveSettings(slug, settings) {
    const response = await axios.put(`http://localhost:3001/api/themes/${slug}/settings`, settings)
    activeTheme.value = response.data
    await fetchThemes()
    applyCss(activeTheme.value)
    return activeTheme.value
  }

  async function installTheme(file) {
    const formData = new FormData()
    formData.append('theme', file)
    installing.value = true
    try {
      const response = await axios.post('http://localhost:3001/api/themes/install', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      await fetchThemes()
      return response.data
    } finally {
      installing.value = false
    }
  }

  async function bootstrap() {
    await fetchThemes()
    await loadActiveTheme()
  }

  return {
    themes,
    activeTheme,
    loading,
    installing,
    fetchThemes,
    loadActiveTheme,
    activateTheme,
    saveSettings,
    installTheme,
    bootstrap
  }
})
