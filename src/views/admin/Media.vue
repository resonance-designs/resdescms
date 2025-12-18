<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  IconUpload,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
  IconChevronLeftPipe,
  IconChevronRightPipe
} from '@tabler/icons-vue'
import { useContentStore } from '../../stores/content'
import { resolveMediaUrl } from '../../utils/media'

const contentStore = useContentStore()
const media = ref([])
const loading = ref(false)
const uploading = ref(false)
const selectedFile = ref(null)
const fileInput = ref(null)
const pagination = ref({ page: 1, limit: 10, total: 0, pages: 1 })
const currentPage = ref(1)
const pageInput = ref(1)
const perPage = ref(10)

const totalPages = computed(() => pagination.value.pages || 1)

async function loadMedia(page = 1) {
  loading.value = true
  await contentStore.fetchMedia({ page, limit: perPage.value })
  media.value = contentStore.media
  pagination.value = contentStore.mediaPagination
  currentPage.value = pagination.value.page
  pageInput.value = currentPage.value
  loading.value = false
}

onMounted(loadMedia)

function handleFileUpload(e) {
  selectedFile.value = e.target.files[0]
  if (selectedFile.value) {
    uploadFile()
  }
}

function triggerFilePicker() {
  if (uploading.value) return
  fileInput.value?.click()
}

function applyPerPage() {
  const parsed = parseInt(perPage.value, 10)
  perPage.value = parsed > 0 ? parsed : 10
  changePage(1, true)
}

function changePage(page, force = false) {
  const target = Math.min(Math.max(page, 1), totalPages.value)
  if (force || target !== currentPage.value || media.value.length === 0) {
    currentPage.value = target
    loadMedia(target)
  }
  pageInput.value = target
}

function applyPageInput() {
  const parsed = parseInt(pageInput.value, 10)
  if (Number.isNaN(parsed)) {
    pageInput.value = currentPage.value
    return
  }
  const target = Math.min(Math.max(parsed, 1), totalPages.value)
  pageInput.value = target
  changePage(target, true)
}

async function uploadFile() {
  if (!selectedFile.value) return
  uploading.value = true
  try {
    const uploaded = await contentStore.uploadMedia(selectedFile.value)
    media.value.push(uploaded)
    selectedFile.value = null
    currentPage.value = 1
    await loadMedia(1)
  } catch (error) {
    alert('Upload failed: ' + error.message)
  } finally {
    uploading.value = false
  }
}

async function deleteMedia(id) {
  if (confirm('Delete this media?')) {
    const isLastOnPage = media.value.length === 1
    await contentStore.deleteMedia(id)
    const nextPage = isLastOnPage && currentPage.value > 1 ? currentPage.value - 1 : currentPage.value
    changePage(nextPage, true)
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div class="bg-white rounded-lg shadow-md p-4 flex flex-col md:flex-row md:items-center md:gap-4 w-full md:w-auto">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-700">Media per page:</label>
          <input
            v-model.number="perPage"
            type="number"
            min="1"
            class="border rounded px-3 py-2 w-24"
            @keyup.enter.prevent="applyPerPage"
          >
          <button
            @click="applyPerPage"
            class="bg-gray-800 text-white px-3 py-2 rounded hover:bg-gray-700 transition cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-md p-4 flex items-center gap-3 w-full md:w-auto">
        <input
          ref="fileInput"
          type="file"
          @change="handleFileUpload"
          class="hidden"
        >
        <button
          @click="triggerFilePicker"
          :disabled="uploading"
          class="bg-rd-orange text-white px-6 py-2 rounded hover:bg-rd-orange-light cursor-pointer flex items-center gap-2"
        >
          <IconUpload :size="18" />
          <span>{{ uploading ? 'Uploading...' : 'Upload File' }}</span>
        </button>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-md">
      <div v-if="loading" class="p-6 text-center text-gray-600">Loading media...</div>
      <div v-else-if="media.length === 0" class="p-6 text-center text-gray-600">No media uploaded yet.</div>
      <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-6">
        <div v-for="item in media" :key="item.id" class="relative group">
          <img :src="resolveMediaUrl(item.url)" :alt="item.filename" class="w-full aspect-square object-cover rounded">
          <button @click="deleteMedia(item.id)" class="absolute top-2 right-2 bg-red-600 text-white p-2 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer flex items-center justify-center">
            <IconTrash :size="14" />
          </button>
          <p class="text-xs text-gray-600 mt-2 truncate">{{ item.filename }}</p>
        </div>
      </div>
      <div v-if="media.length > 0" class="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4 border-t">
        <div class="flex items-center gap-3 text-sm text-gray-600">
          <button
            @click="changePage(1, true)"
            :disabled="currentPage <= 1 || loading"
            class="px-3 py-2 rounded border text-white bg-gray-800 cursor-pointer hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="First page"
          >
            <IconChevronLeftPipe />
          </button>
          <button
            @click="changePage(currentPage - 1)"
            :disabled="currentPage <= 1 || loading"
            class="px-3 py-2 rounded border text-white bg-gray-800 cursor-pointer hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <IconChevronLeft />
          </button>
          <div class="flex items-center gap-2">
            <input
              v-model.number="pageInput"
              @keyup.enter.prevent="applyPageInput"
              @blur="applyPageInput"
              type="number"
              min="1"
              :max="totalPages"
              class="border rounded px-2 py-2 w-20 text-center"
              aria-label="Current page"
            >
            <span>of {{ totalPages }} · {{ pagination.total }} files</span>
          </div>
          <button
            @click="changePage(currentPage + 1)"
            :disabled="currentPage >= totalPages || loading"
            class="px-2 py-2 rounded border text-white bg-gray-800 cursor-pointer hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <IconChevronRight />
          </button>
          <button
            @click="changePage(totalPages, true)"
            :disabled="currentPage >= totalPages || loading"
            class="px-2 py-2 rounded border text-white bg-gray-800 cursor-pointer hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Last page"
          >
            <IconChevronRightPipe />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
