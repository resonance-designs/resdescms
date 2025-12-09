import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

const API_BASE_URL = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/+$/, '')

export const usePluginStore = defineStore('plugins', () => {
  const plugins = ref([])
  const loading = ref(false)
  const scriptsInjected = ref(false)
  const pluginElements = ref([])
  const shortcodeHandlers = ref({})
  const elementRenderers = ref({})
  const clientDataLoaders = ref({})
  const clientScriptInjectors = ref({})
  const pluginData = ref({})

  const shortcodeModules = import.meta.glob('/server/plugins/**/shortcodes.{js,ts}', { eager: false })
  const elementModules = import.meta.glob('/server/plugins/**/elements.{js,ts}', { eager: false })
  const clientDataLoaderModules = import.meta.glob('/server/plugins/**/clientDataLoader.{js,ts}', { eager: false })
  const clientScriptInjectorModules = import.meta.glob('/server/plugins/**/clientScriptInjector.{js,ts}', { eager: false })

  async function fetchPlugins() {
    try {
      loading.value = true
      const { data } = await axios.get(`${API_BASE_URL}/api/plugins`)
      plugins.value = data || []
      await loadPluginMetadata()
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

  async function loadPluginMetadata() {
    const elements = []
    const handlers = {}
    const renderers = {}
    const dataLoaders = {}
    const scriptInjectors = {}
    const active = plugins.value.filter(p => p.isActive)
    for (const plugin of active) {
      const manifest = plugin.manifest || {}
      if (Array.isArray(manifest.elements)) {
        manifest.elements.forEach(el => elements.push(el))
      }
      if (manifest.shortcodeHandler) {
        const normalized = manifest.shortcodeHandler.replace(/\\/g, '/')
        const key = Object.keys(shortcodeModules).find(k => k.endsWith(normalized))
        try {
          if (key) {
            const mod = await shortcodeModules[key]()
            const register = mod.registerShortcodes || mod.default
            if (typeof register === 'function') {
              Object.assign(handlers, register())
            }
          }
        } catch (err) {
          console.error('Failed to load shortcode handler for plugin', plugin.slug, err)
        }
      }
      if (manifest.clientDataLoader) {
        const normalized = manifest.clientDataLoader.replace(/\\/g, '/')
        const key = Object.keys(clientDataLoaderModules).find(k => k.endsWith(normalized))
        try {
          if (key) {
            const mod = await clientDataLoaderModules[key]()
            const loader = mod.loadContentData || mod.default
            if (typeof loader === 'function') {
              dataLoaders[plugin.slug] = loader
            }
          }
        } catch (err) {
          console.error('Failed to load client data loader for plugin', plugin.slug, err)
        }
      }
      if (manifest.clientScriptInjector) {
        const normalized = manifest.clientScriptInjector.replace(/\\/g, '/')
        const key = Object.keys(clientScriptInjectorModules).find(k => k.endsWith(normalized))
        try {
          if (key) {
            const mod = await clientScriptInjectorModules[key]()
            const injector = mod.injectClientScripts || mod.default
            if (typeof injector === 'function') {
              scriptInjectors[plugin.slug] = injector
            }
          }
        } catch (err) {
          console.error('Failed to load client script injector for plugin', plugin.slug, err)
        }
      }
      const elementKey = Object.keys(elementModules).find(k => k.includes(`/server/plugins/${plugin.slug}/`))
      if (elementKey) {
        try {
          const mod = await elementModules[elementKey]()
          const register = mod.registerElements || mod.default
          if (typeof register === 'function') {
            const map = register()
            Object.entries(map || {}).forEach(([type, val]) => {
              if (!val) return
              if (typeof val === 'function') {
                renderers[type] = { render: val }
              } else if (typeof val.render === 'function') {
                renderers[type] = val
              }
            })
          }
        } catch (err) {
          console.error('Failed to load element renderer for plugin', plugin.slug, err)
        }
      }
    }
    pluginElements.value = elements
    shortcodeHandlers.value = handlers
    elementRenderers.value = renderers
    clientDataLoaders.value = dataLoaders
    clientScriptInjectors.value = scriptInjectors
  }

  function activePlugins() {
    return plugins.value.filter(p => p.isActive)
  }

  async function loadContentData(content, layoutJson) {
    const loaders = Object.values(clientDataLoaders.value)
    await Promise.all(loaders.map(loader => loader(content, layoutJson, { pluginData })))
  }

  function getShortcodeContext() {
    const context = {}
    for (const [slug, data] of Object.entries(pluginData.value)) {
      Object.assign(context, data)
    }
    return context
  }

  function injectClientScripts({ includeAdmin = false } = {}) {
    let hasScripts = false
    activePlugins().forEach(plugin => {
      const injector = clientScriptInjectors.value[plugin.slug]
      if (injector && typeof injector === 'function') {
        const result = injector(plugin, { includeAdmin })
        if (result) hasScripts = true
      }
    })
    scriptsInjected.value = hasScripts
  }

  return {
    plugins,
    loading,
    pluginData,
    fetchPlugins,
    installPlugin,
    activatePlugin,
    deactivatePlugin,
    deletePlugin,
    saveSettings,
    loadPluginMetadata,
    activePlugins,
    pluginElements,
    shortcodeHandlers,
    elementRenderers,
    loadContentData,
    getShortcodeContext,
    injectClientScripts
  }
})
