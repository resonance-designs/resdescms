<script setup>
import { onMounted, reactive, ref } from 'vue'
import axios from 'axios'
import { usePluginStore } from '/src/stores/plugins'

const API_BASE_URL = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/+$/, '')
const pluginStore = usePluginStore()
const form = reactive({
  clientId: '',
  clientSecret: '',
  redirectUri: `${API_BASE_URL}/api/plugins/glink/callback`,
  gaId: '',
  adsenseClient: '',
  gaAccountId: '',
  gaAccountName: '',
  gaPropertyId: '',
  gaPropertyName: '',
  headSnippet: '',
  testing: false,
  trackAdmin: false
})
const loading = ref(false)
const connecting = ref(false)
const accounts = ref([])
const properties = ref([])
const selectedAccount = ref('')
const needsConfig = ref(false)
const accountsError = ref('')
const accountsErrorLink = ref('')
const propertiesErrorStatus = ref(null)
const propertiesError = ref('')
const propertiesErrorLink = ref('')
const measurementMessage = ref('')
const streams = ref([])
const newProp = reactive({
  name: '',
  timeZone: 'Etc/UTC',
  websiteUrl: typeof window !== 'undefined' ? window.location.origin : ''
})
const creatingProp = ref(false)
const createPropMessage = ref('')
const createPropError = ref('')

onMounted(async () => {
  if (!pluginStore.plugins.length) {
    await pluginStore.fetchPlugins()
  }
  const glink = pluginStore.plugins.find(p => p.slug === 'glink')
  if (glink?.settings) {
    Object.assign(form, glink.settings)
    if (form.gaAccountId) selectedAccount.value = form.gaAccountId
  }
  try {
    const status = await axios.get(`${API_BASE_URL}/api/plugins/glink/status`)
    needsConfig.value = status.data?.hasConfig === false
    if (status.data?.account_email) {
      form.gaAccountName = status.data.account_email
    }
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected')) {
      await pluginStore.fetchPlugins()
      const acctRes = await axios.get(`${API_BASE_URL}/api/plugins/glink/accounts`)
      accounts.value = acctRes.data || []
      if (form.gaAccountId) {
        await pickAccount(form.gaAccountId, form.gaAccountName || '')
      }
    }
  } catch (err) {
    const msg = err.response?.data?.error || err.message || 'Failed to fetch accounts'
    accountsError.value = msg
    accountsErrorLink.value = err.response?.data?.link || ''
    console.error('GLink status check failed', msg)
  }
})

async function connectGoogle() {
  connecting.value = true
  try {
    if (!form.clientId || !form.clientSecret) {
      alert('Enter your Google OAuth Client ID and Client Secret, save settings, then click Connect.')
      connecting.value = false
      return
    }
    await pluginStore.saveSettings('glink', { ...form })
    const { data } = await axios.get(`${API_BASE_URL}/api/plugins/glink/auth-url`)
    if (data?.url) {
      window.location.href = data.url
    } else {
      alert('Failed to get auth URL')
    }
  } catch (err) {
    alert('Failed to start Google OAuth.')
    console.error(err)
  } finally {
    connecting.value = false
  }
}

async function pickAccount(id, name) {
  selectedAccount.value = id
  form.gaAccountId = id
  form.gaAccountName = name
  form.gaPropertyId = ''
  form.gaPropertyName = ''
  propertiesError.value = ''
  propertiesErrorLink.value = ''
  propertiesErrorStatus.value = null
  streams.value = []
  form.gaId = ''
  try {
    const { data } = await axios.get(`${API_BASE_URL}/api/plugins/glink/properties`, { params: { accountId: id } })
    properties.value = data || []
  } catch (err) {
    const msg = err.response?.data?.error || err.message || 'Failed to load properties'
    propertiesError.value = msg
    propertiesErrorLink.value = err.response?.data?.link || ''
    propertiesErrorStatus.value = err.response?.data?.status || err.response?.status || null
    properties.value = []
    console.error(msg)
  }
}

function pickProperty(prop) {
  form.gaPropertyId = prop.id
  form.gaPropertyName = prop.name
  measurementMessage.value = ''
  form.gaId = prop.measurementId || ''
  streams.value = []
  if (!form.gaId && prop.id) {
    axios.get(`${API_BASE_URL}/api/plugins/glink/properties/${prop.id}/streams`).then(({ data }) => {
      streams.value = data.streams || []
      form.gaId = data.measurementId || ''
      if (!streams.value.length) {
        measurementMessage.value = 'No web data stream found for this property. Create one to get a Measurement ID.'
      } else if (!form.gaId) {
        measurementMessage.value = 'Select a web stream below to populate the Measurement ID.'
      } else {
        measurementMessage.value = 'Measurement ID loaded from property streams.'
      }
    }).catch(err => {
      measurementMessage.value = err.response?.data?.error || 'Failed to load measurement ID for this property.'
    })
  }
}

async function save() {
  loading.value = true
  try {
    await pluginStore.saveSettings('glink', { ...form })
    await pluginStore.fetchPlugins()
    alert('GLink settings saved.')
    needsConfig.value = !(form.clientId && form.clientSecret)
  } catch (err) {
    alert('Failed to save settings: ' + err.message)
  } finally {
    loading.value = false
  }
}

async function createProperty() {
  if (!selectedAccount.value) {
    createPropError.value = 'Select an account first.'
    return
  }
  createPropError.value = ''
  createPropMessage.value = ''
  creatingProp.value = true
  try {
    const { data } = await axios.post(`${API_BASE_URL}/api/plugins/glink/properties`, {
      accountId: selectedAccount.value,
      displayName: newProp.name,
      timeZone: newProp.timeZone,
      websiteUrl: newProp.websiteUrl
    })
    if (data?.id) {
      properties.value.push(data)
      pickProperty(data)
      if (form.gaId) {
        await pluginStore.saveSettings('glink', { ...form })
      }
      createPropMessage.value = data.measurementId
        ? 'Property created, data stream added, and tracking ID saved.'
        : 'Property created; add a web data stream/measurement ID to start tracking.'
      newProp.name = ''
    } else {
      createPropMessage.value = 'Property created.'
    }
  } catch (err) {
    createPropError.value = err.response?.data?.error || err.message || 'Failed to create property'
    if (err.response?.data?.status === 403) {
      createPropError.value += ' Please reconnect and re-consent so the new scopes are granted.'
    }
  } finally {
    creatingProp.value = false
  }
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-md p-6 space-y-4">
    <h3 class="text-lg font-semibold">GLink Connection Wizard</h3>
    <p class="text-sm text-gray-600">
      Connect Google Analytics / AdSense without shell access. Provide your own Google OAuth credentials, save them, then run the connection flow.
    </p>

    <div class="bg-gray-50 border rounded p-4 space-y-2 text-sm text-gray-700">
      <p class="font-semibold">Setup steps (one time per site):</p>
      <ol class="list-decimal list-inside space-y-1">
        <li>Create an OAuth 2.0 Client in Google Cloud Console (Web application).</li>
        <li>Add this redirect URI: <code class="bg-white px-1 py-0.5 border rounded">{{ form.redirectUri }}</code></li>
        <li>Enable the Google Analytics Admin/Data API.</li>
        <li>Paste the Client ID and Client Secret below, save settings, then click Connect.</li>
      </ol>
      <p class="text-xs text-gray-500">
        No terminal required—credentials are stored in the CMS plugin settings. You can also set env vars (`GLINK_CLIENT_ID`, `GLINK_CLIENT_SECRET`, `GLINK_REDIRECT_URI`);
        UI values take priority if present.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Google OAuth Client ID</label>
        <input v-model="form.clientId" type="text" class="w-full border rounded px-3 py-2" placeholder="xxx.apps.googleusercontent.com">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Google OAuth Client Secret</label>
        <input v-model="form.clientSecret" type="text" class="w-full border rounded px-3 py-2" placeholder="********">
      </div>
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-1">Redirect URI (copy into Google console)</label>
        <input v-model="form.redirectUri" type="text" class="w-full border rounded px-3 py-2">
      </div>
    </div>

    <div class="space-y-3 border rounded p-4">
      <div class="flex items-center gap-3">
        <button class="bg-blue-600 text-white px-4 py-2 rounded" :disabled="connecting" @click="connectGoogle">
          {{ connecting ? 'Connecting...' : 'Connect to Google' }}
        </button>
        <span v-if="form.gaAccountName" class="text-sm text-gray-700">Connected: {{ form.gaAccountName }}</span>
        <span v-else-if="needsConfig" class="text-sm text-red-600">Add Client ID/Secret, save, then Connect.</span>
      </div>

      <div v-if="accountsError" class="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800 space-y-2">
        <p>{{ accountsError }}</p>
        <a
          v-if="accountsErrorLink"
          :href="accountsErrorLink"
          target="_blank"
          rel="noopener"
          class="inline-block bg-red-600 text-white px-3 py-1 rounded"
        >
          Enable API
        </a>
      </div>

      <div v-if="accounts.length" class="space-y-2">
        <p class="text-sm font-semibold text-gray-800">Choose account</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="acct in accounts"
            :key="acct.id"
            class="px-3 py-2 rounded border"
            :class="selectedAccount === acct.id ? 'border-rd-orange text-rd-orange' : 'border-gray-300 text-gray-700'"
            @click="pickAccount(acct.id, acct.name)"
          >
            {{ acct.name }}
          </button>
        </div>
      </div>

      <div v-if="properties.length" class="space-y-2">
        <p class="text-sm font-semibold text-gray-800">Choose Analytics property</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="prop in properties"
            :key="prop.id"
            class="px-3 py-2 rounded border"
            :class="form.gaPropertyId === prop.id ? 'border-rd-orange text-rd-orange' : 'border-gray-300 text-gray-700'"
            @click="pickProperty(prop)"
          >
            {{ prop.name }} ({{ prop.measurementId || prop.id }})
          </button>
        </div>
      </div>
      <div v-else-if="propertiesError" class="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800 space-y-2">
        <p>{{ propertiesError }}</p>
        <p v-if="propertiesErrorStatus" class="text-xs text-red-700">Status: {{ propertiesErrorStatus }}</p>
        <p v-if="propertiesErrorStatus === 404" class="text-xs text-red-700">
          Ensure the Google Analytics Admin API is enabled for this project and that the selected account has GA4 properties.
        </p>
        <a
          v-if="propertiesErrorLink"
          :href="propertiesErrorLink"
          target="_blank"
          rel="noopener"
          class="inline-block bg-red-600 text-white px-3 py-1 rounded"
        >
          Enable API
        </a>
      </div>
      <div v-if="streams.length" class="space-y-2">
        <p class="text-sm font-semibold text-gray-800">Choose Web Stream</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="stream in streams"
            :key="stream.id"
            class="px-3 py-2 rounded border"
            :class="form.gaId === stream.measurementId ? 'border-rd-orange text-rd-orange' : 'border-gray-300 text-gray-700'"
            @click="() => { form.gaId = stream.measurementId || ''; measurementMessage.value = 'Measurement ID loaded from selected stream.'; }"
          >
            {{ stream.name }} ({{ stream.measurementId || 'No ID' }})
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Google Analytics Measurement ID</label>
        <input v-model="form.gaId" type="text" class="w-full border rounded px-3 py-2" placeholder="G-XXXXXXX">
        <p v-if="measurementMessage" class="text-xs text-gray-600 mt-1">{{ measurementMessage }}</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">AdSense Client ID</label>
        <input v-model="form.adsenseClient" type="text" class="w-full border rounded px-3 py-2" placeholder="ca-pub-XXXXXXXXXXXXXXXX">
      </div>
    </div>

    <div class="flex items-center gap-2">
      <input id="testing" v-model="form.testing" type="checkbox" class="h-4 w-4 text-rd-orange border-gray-300 rounded">
      <label for="testing" class="text-sm text-gray-800">Testing mode (sets GA cookie_domain to "none")</label>
    </div>
    <div class="flex items-center gap-2">
      <input id="trackAdmin" v-model="form.trackAdmin" type="checkbox" class="h-4 w-4 text-rd-orange border-gray-300 rounded">
      <label for="trackAdmin" class="text-sm text-gray-800">Track Admin Usage (inject GA into admin pages)</label>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Additional Head Snippet (optional)</label>
      <textarea v-model="form.headSnippet" rows="4" class="w-full border rounded px-3 py-2" placeholder="<script>..."></textarea>
      <p class="text-xs text-gray-500 mt-1">Injected into &lt;head&gt;; use for extra tags (consent, adsense, etc.).</p>
    </div>

    <div class="flex gap-3">
      <button class="bg-rd-orange text-white px-4 py-2 rounded disabled:opacity-50" :disabled="loading" @click="save">
        {{ loading ? 'Saving...' : 'Save Settings' }}
      </button>
      <a href="/admin/plugins" class="text-sm text-gray-600 hover:text-gray-900">Back to Plugins</a>
    </div>

    <div class="border-t pt-4 space-y-3">
      <h4 class="text-md font-semibold text-gray-900">Create new GA4 property</h4>
      <p class="text-sm text-gray-600">Creates a GA4 property under the selected account and a default web data stream to obtain a Measurement ID.</p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Property name</label>
          <input v-model="newProp.name" type="text" class="w-full border rounded px-3 py-2" placeholder="My Site">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Time zone (IANA)</label>
          <input v-model="newProp.timeZone" type="text" class="w-full border rounded px-3 py-2" placeholder="Etc/UTC">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Website URL (for data stream)</label>
          <input v-model="newProp.websiteUrl" type="text" class="w-full border rounded px-3 py-2" placeholder="https://example.com">
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button class="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50" :disabled="creatingProp" @click="createProperty">
          {{ creatingProp ? 'Creating...' : 'Create Property' }}
        </button>
        <span v-if="createPropMessage" class="text-sm text-green-700">{{ createPropMessage }}</span>
        <span v-if="createPropError" class="text-sm text-red-700">{{ createPropError }}</span>
      </div>
    </div>
  </div>
</template>
