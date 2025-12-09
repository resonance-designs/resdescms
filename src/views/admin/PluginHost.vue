<script setup>
import { defineAsyncComponent, h, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePluginStore } from '../../stores/plugins'

const route = useRoute()
const router = useRouter()
const pluginStore = usePluginStore()
const ViewComponent = ref(null)
const error = ref('')
const viewModules = import.meta.glob('/server/plugins/**/*.{vue,js,ts,jsx,tsx}')

async function loadPluginView() {
  const slug = route.path.replace('/admin/', '').split('/')[0]
  if (!slug) {
    error.value = 'Plugin not found'
    return
  }
  await pluginStore.fetchPlugins()
  const plugin = pluginStore.plugins.find(p => p.slug === slug)
  if (!plugin || !plugin.isActive) {
    router.replace({ name: 'admin-plugins' })
    return
  }
  const viewPath = plugin.manifest?.adminView || plugin.adminView
  if (!viewPath) {
    error.value = 'Plugin admin view not specified'
    return
  }
  try {
    // Normalize and resolve against known plugin admin modules
    const normalized = viewPath.replace(/\\/g, '/')
    const matchKey = Object.keys(viewModules).find(k => k.endsWith(normalized))
    if (matchKey && viewModules[matchKey]) {
      ViewComponent.value = defineAsyncComponent(viewModules[matchKey])
    } else if (viewModules[normalized]) {
      ViewComponent.value = defineAsyncComponent(viewModules[normalized])
    } else {
      ViewComponent.value = defineAsyncComponent(() => import(/* @vite-ignore */ normalized))
    }
  } catch (err) {
    console.error('Failed to load plugin view', err)
    error.value = 'Failed to load plugin view'
  }
}

onMounted(loadPluginView)

watch(
  () => route.fullPath,
  () => {
    ViewComponent.value = null
    error.value = ''
    loadPluginView()
  }
)
</script>

<template>
  <div>
    <component v-if="ViewComponent" :is="ViewComponent" />
    <div v-else-if="error" class="text-sm text-red-600">{{ error }}</div>
    <div v-else class="text-sm text-gray-500">Loading plugin...</div>
  </div>
</template>
