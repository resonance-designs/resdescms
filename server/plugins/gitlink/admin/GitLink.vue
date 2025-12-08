<script setup>
import { onMounted, reactive, ref } from 'vue'
import axios from 'axios'
import { usePluginStore } from '../../../src/stores/plugins'

const API_BASE_URL = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/+$/, '')
const pluginStore = usePluginStore()

const form = reactive({
  clientId: '',
  clientSecret: '',
  redirectUri: `${API_BASE_URL}/api/plugins/gitlink/callback`
})

const status = reactive({
  connected: false,
  hasConfig: false
})

const repos = ref([])
const loading = ref(false)
const connecting = ref(false)

onMounted(async () => {
  if (!pluginStore.plugins.length) {
    await pluginStore.fetchPlugins()
  }
  const gitlink = pluginStore.plugins.find(p => p.slug === 'gitlink')
  if (gitlink?.settings) {
    Object.assign(form, gitlink.settings)
  }
  await refreshStatus()
  if (status.connected) {
    await loadRepos()
  }
})

async function refreshStatus() {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/api/plugins/gitlink/status`)
    status.connected = !!data.connected
    status.hasConfig = !!data.hasConfig
  } catch (err) {
    status.connected = false
    status.hasConfig = false
  }
}

async function save() {
  loading.value = true
  try {
    await pluginStore.saveSettings('gitlink', { ...form })
    await pluginStore.fetchPlugins()
    await refreshStatus()
    alert('GitLink settings saved')
  } catch (err) {
    alert('Failed to save GitLink settings')
  } finally {
    loading.value = false
  }
}

async function connect() {
  connecting.value = true
  try {
    if (!form.clientId || !form.clientSecret) {
      alert('Enter Client ID/Secret and save first.')
      return
    }
    await pluginStore.saveSettings('gitlink', { ...form })
    const { data } = await axios.get(`${API_BASE_URL}/api/plugins/gitlink/auth-url`)
    if (data?.url) window.location.href = data.url
  } catch (err) {
    alert('Failed to start GitHub OAuth')
  } finally {
    connecting.value = false
  }
}

async function loadRepos() {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/api/plugins/gitlink/repos`)
    repos.value = data || []
    pluginStore.gitRepos = repos.value
  } catch (err) {
    alert('Failed to load repositories')
  }
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-md p-6 space-y-4">
    <h3 class="text-lg font-semibold">GitLink</h3>
    <p class="text-sm text-gray-600">
      Connect a GitHub account via OAuth and display repos via the `[gitlink mode="small-list|medium-list"]` shortcode or the “GitHub Repos” block element.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">GitHub Client ID</label>
        <input v-model="form.clientId" type="text" class="w-full border rounded px-3 py-2" placeholder="ghu_...">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">GitHub Client Secret</label>
        <input v-model="form.clientSecret" type="text" class="w-full border rounded px-3 py-2" placeholder="********">
      </div>
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-1">Redirect URI</label>
        <input v-model="form.redirectUri" type="text" class="w-full border rounded px-3 py-2" readonly>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <button class="bg-blue-600 text-white px-4 py-2 rounded" :disabled="connecting" @click="connect">
        {{ connecting ? 'Connecting...' : 'Connect GitHub' }}
      </button>
      <span v-if="status.connected" class="text-sm text-green-700">Connected</span>
      <span v-else-if="!status.hasConfig" class="text-sm text-red-600">Add Client ID/Secret and save first.</span>
    </div>

    <div class="flex gap-3">
      <button class="bg-rd-orange text-white px-4 py-2 rounded disabled:opacity-50" :disabled="loading" @click="save">
        {{ loading ? 'Saving...' : 'Save Settings' }}
      </button>
      <button class="bg-gray-200 text-gray-800 px-4 py-2 rounded" :disabled="!status.connected" @click="loadRepos">
        Refresh Repos
      </button>
    </div>

    <div v-if="repos.length" class="border rounded p-4 space-y-2">
      <h4 class="text-md font-semibold text-gray-900">Recent Repositories</h4>
      <ul class="space-y-2">
        <li v-for="repo in repos.slice(0, 8)" :key="repo.id" class="text-sm">
          <a :href="repo.html_url" target="_blank" rel="noopener" class="text-rd-orange hover:underline">
            {{ repo.full_name }}
          </a>
          <span class="text-gray-600">★ {{ repo.stargazers_count }} | Forks {{ repo.forks_count }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
