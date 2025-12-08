<script setup>
import { defineAsyncComponent, h, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePluginStore } from '../../stores/plugins'

const route = useRoute()
const router = useRouter()
const pluginStore = usePluginStore()
const ViewComponent = ref(null)
const error = ref('')

async function loadPluginView() {
  const slug = route.path.replace('/admin/', '').split('/')[0]
  if (!slug) {
    error.value = 'Plugin not found'
    return
  }
  if (!pluginStore.plugins.length) {
    await pluginStore.fetchPlugins()
  }
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
    ViewComponent.value = defineAsyncComponent(() => import(/* @vite-ignore */ viewPath))
  } catch (err) {
    console.error('Failed to load plugin view', err)
    error.value = 'Failed to load plugin view'
  }
}

onMounted(loadPluginView)
</script>

<template>
  <div>
    <component v-if="ViewComponent" :is="ViewComponent" />
    <div v-else-if="error" class="text-sm text-red-600">{{ error }}</div>
    <div v-else class="text-sm text-gray-500">Loading plugin...</div>
  </div>
</template>
