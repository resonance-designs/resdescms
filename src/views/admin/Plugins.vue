<script setup>
import { ref, onMounted } from 'vue'
import { usePluginStore } from '../../stores/plugins'

const pluginStore = usePluginStore()
const uploading = ref(false)
const selectedFile = ref(null)
const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const deleteFiles = ref(true)
const deleteData = ref(false)

onMounted(async () => {
  if (!pluginStore.plugins.length) {
    await pluginStore.fetchPlugins()
  }
})

function handleFile(e) {
  selectedFile.value = e.target.files[0]
}

async function uploadPlugin() {
  if (!selectedFile.value) return
  uploading.value = true
  try {
    await pluginStore.installPlugin(selectedFile.value)
    selectedFile.value = null
    alert('Plugin uploaded successfully. Activate to run install script.')
  } catch (err) {
    alert('Upload failed: ' + err.message)
  } finally {
    uploading.value = false
  }
}

async function activate(slug) {
  await pluginStore.activatePlugin(slug)
  alert('Plugin activated.')
}

async function deactivate(slug) {
  await pluginStore.deactivatePlugin(slug)
}

function confirmDelete(plugin) {
  deleteTarget.value = plugin
  deleteFiles.value = true
  deleteData.value = false
  showDeleteModal.value = true
}

async function deletePlugin() {
  if (!deleteTarget.value) return
  await pluginStore.deletePlugin(deleteTarget.value.slug, {
    deleteFiles: deleteFiles.value,
    deleteData: deleteData.value
  })
  showDeleteModal.value = false
  deleteTarget.value = null
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <h3 class="text-lg font-semibold mb-4">Plugins</h3>
    <p class="text-sm text-gray-600 mb-4">Upload and activate extensions.</p>

    <div class="border rounded p-4 mb-6">
      <h4 class="font-semibold mb-2">Upload Plugin</h4>
      <input type="file" @change="handleFile" class="block w-full mb-3" />
      <button
        class="bg-rd-orange text-white px-4 py-2 rounded disabled:opacity-50"
        :disabled="uploading || !selectedFile"
        @click="uploadPlugin"
      >
        {{ uploading ? 'Uploading...' : 'Upload' }}
      </button>
    </div>

    <div class="space-y-3">
      <div v-for="plugin in pluginStore.plugins" :key="plugin.slug" class="border rounded p-4 flex items-center justify-between">
        <div>
          <p class="font-semibold text-gray-900">{{ plugin.name }} <span class="text-xs text-gray-500">v{{ plugin.version }}</span></p>
          <p class="text-sm text-gray-600">{{ plugin.description }}</p>
          <p class="text-xs text-gray-500">Slug: {{ plugin.slug }}</p>
          <p v-if="plugin.isActive" class="text-xs text-green-600 font-semibold">Active</p>
          <p v-else class="text-xs text-gray-500">Inactive</p>
        </div>
        <div class="flex gap-2">
          <button
            class="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            :disabled="plugin.isActive"
            @click="activate(plugin.slug)"
          >
            Activate
          </button>
          <button
            v-if="plugin.isActive"
            class="px-3 py-2 bg-gray-200 text-gray-800 rounded"
            @click="deactivate(plugin.slug)"
          >
            Deactivate
          </button>
          <button
            v-else
            class="px-3 py-2 bg-red-600 text-white rounded"
            @click="confirmDelete(plugin)"
          >
            Delete
          </button>
          <RouterLink
            v-if="plugin.slug === 'glink' && plugin.isActive"
            to="/admin/glink"
            class="px-3 py-2 bg-rd-orange text-white rounded"
          >
            Open GLink
          </RouterLink>
        </div>
      </div>
    </div>

    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md space-y-4">
        <h4 class="text-lg font-semibold">Delete Plugin</h4>
        <p class="text-sm text-gray-700">Choose what to remove for <strong>{{ deleteTarget ? deleteTarget.name : '' }}</strong>:</p>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="deleteFiles" type="checkbox" class="h-4 w-4" />
          Delete plugin files
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="deleteData" type="checkbox" class="h-4 w-4" />
          Delete plugin data (database tables/settings)
        </label>
        <div class="flex justify-end gap-2">
          <button class="px-3 py-2 rounded border" @click="showDeleteModal = false">Cancel</button>
          <button class="px-3 py-2 bg-red-600 text-white rounded" @click="deletePlugin">
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
