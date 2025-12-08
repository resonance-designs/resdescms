import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

const API_BASE_URL = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/+$/, '')

export const usePluginStore = defineStore('plugins', () => {
  const plugins = ref([])
  const loading = ref(false)
  const scriptsInjected = ref(false)
  const injectedGaId = ref(null)

  async function fetchPlugins() {
    try {
      loading.value = true
      const { data } = await axios.get(`${API_BASE_URL}/api/plugins`)
      plugins.value = data || []
      return plugins.value
    } catch (err) {
      console.error('Failed to fetch plugins', err)
      return []
    } finally {
      loading.value = false
    }
  }

  async function installPlugin(file) {
    const formData = new FormData()
    formData.append('plugin', file)
    await axios.post(`${API_BASE_URL}/api/plugins/install`, formData)
    return fetchPlugins()
  }

  async function activatePlugin(slug) {
    await axios.post(`${API_BASE_URL}/api/plugins/${slug}/activate`)
    return fetchPlugins()
  }

  async function deactivatePlugin(slug) {
    await axios.post(`${API_BASE_URL}/api/plugins/${slug}/deactivate`)
    return fetchPlugins()
  }

  async function deletePlugin(slug, options = { deleteFiles: true, deleteData: false }) {
    await axios.delete(`${API_BASE_URL}/api/plugins/${slug}`, { data: options })
    return fetchPlugins()
  }

  async function saveSettings(slug, settings) {
    await axios.put(`${API_BASE_URL}/api/plugins/${slug}/settings`, settings)
    return fetchPlugins()
  }

  function activePlugins() {
    return plugins.value.filter(p => p.isActive)
  }

  function injectClientScripts() {
    const head = document.head
    let currentGaId = null

    const removeExisting = () => {
      document.querySelectorAll('script[data-glink-ga-loader], script[data-glink-ga-inline]').forEach(el => el.remove())
    }

    activePlugins().forEach(plugin => {
      if (plugin.slug === 'glink') {
        const { gaId, headSnippet, testing } = plugin.settings || {}
        currentGaId = gaId || null
        if (currentGaId && injectedGaId.value && injectedGaId.value !== currentGaId) {
          removeExisting()
        }
        if (!currentGaId) {
          removeExisting()
          injectedGaId.value = null
        }
        if (gaId) {
          const existingLoader = document.querySelector(`script[data-glink-ga-loader="${gaId}"]`)
          if (!existingLoader) {
            const script = document.createElement('script')
            script.async = true
            script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
            script.setAttribute('data-glink-ga-loader', gaId)
            head.appendChild(script)
          }
          const existingInline = document.querySelector(`script[data-glink-ga-inline="${gaId}"]`)
          if (!existingInline) {
            const inline = document.createElement('script')
            inline.setAttribute('data-glink-ga-inline', gaId)
            inline.innerHTML = `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', ${testing ? "{cookie_domain:'none'}" : '{}'});
            `
            head.appendChild(inline)
          }
          injectedGaId.value = gaId
        }
        if (headSnippet) {
          const existingSnippet = document.querySelector('script[data-glink-head-snippet="1"]')
          if (!existingSnippet) {
            const snippet = document.createElement('script')
            snippet.setAttribute('data-glink-head-snippet', '1')
            snippet.innerHTML = headSnippet
            head.appendChild(snippet)
          }
        }
      }
    })
    scriptsInjected.value = !!currentGaId
  }

  return {
    plugins,
    loading,
    fetchPlugins,
    installPlugin,
    activatePlugin,
    deactivatePlugin,
    deletePlugin,
    saveSettings,
    activePlugins,
    injectClientScripts
  }
})
