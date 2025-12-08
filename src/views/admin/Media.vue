<script setup>
import { ref, onMounted } from 'vue'
import { useContentStore } from '../../stores/content'
import { resolveMediaUrl } from '../../utils/media'

const contentStore = useContentStore()
const media = ref([])
const loading = ref(false)
const uploading = ref(false)
const selectedFile = ref(null)
onMounted(async () => {
  loading.value = true
  await contentStore.fetchMedia()
  media.value = contentStore.media
  loading.value = false
})

function handleFileUpload(e) {
  selectedFile.value = e.target.files[0]
}

async function uploadFile() {
  if (!selectedFile.value) return
  uploading.value = true
  try {
    const uploaded = await contentStore.uploadMedia(selectedFile.value)
    media.value.push(uploaded)
    selectedFile.value = null
  } catch (error) {
    alert('Upload failed: ' + error.message)
  } finally {
    uploading.value = false
  }
}

async function deleteMedia(id) {
  if (confirm('Delete this media?')) {
    await contentStore.deleteMedia(id)
    media.value = media.value.filter(m => m.id !== id)
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 class="text-lg font-semibold mb-4">Upload Media</h3>
        <input type="file" @change="handleFileUpload" class="block w-full mb-4">
        <button @click="uploadFile" :disabled="!selectedFile || uploading" class="bg-purple-500 text-white px-6 py-2 rounded hover:bg-purple-600 disabled:opacity-50">
          {{ uploading ? 'Uploading...' : 'Upload File' }}
        </button>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-md">
      <div v-if="loading" class="p-6 text-center text-gray-600">Loading media...</div>
      <div v-else-if="media.length === 0" class="p-6 text-center text-gray-600">No media uploaded yet.</div>
      <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-6">
        <div v-for="item in media" :key="item.id" class="relative group">
          <img :src="resolveMediaUrl(item.url)" :alt="item.filename" class="w-full aspect-square object-cover rounded">
          <button @click="deleteMedia(item.id)" class="absolute top-2 right-2 bg-red-600 text-white p-2 rounded opacity-0 group-hover:opacity-100 transition">
            ✕
          </button>
          <p class="text-xs text-gray-600 mt-2 truncate">{{ item.filename }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
