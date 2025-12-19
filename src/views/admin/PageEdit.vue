<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useContentStore } from '../../stores/content'
import { useAuthStore } from '../../stores/auth'
import PageBuilder from '../../components/admin/PageBuilder.vue'
import { resolveMediaUrl } from '../../utils/media'
import { IconCircleCheck, IconCircleX } from '@tabler/icons-vue'
import axios from 'axios'

const API_BASE_URL = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/+$/, '')

const router = useRouter()
const route = useRoute()
const contentStore = useContentStore()
const authStore = useAuthStore()

const isEdit = ref(false)
const form = ref({
  title: '',
  slug: '',
  content: '',
  featured_image: '',
  category_id: null,
  published: false,
  layout_json: null,
  author_id: null,
  publish_at: '',
  parent_id: null,
  featured_image_alt: '',
  featured_image_title: '',
  featured_image_caption: '',
  featured_image_description: ''
})
const slugEdited = ref(false)
const mediaModalOpen = ref(false)
const mediaSelection = ref(null)
const uploading = ref(false)
const saved = ref(false)
const featuredModalOpen = ref(false)
const featuredDimensions = ref({ width: null, height: null })

const layout = ref({
  cols: 4,
  rows: 4,
  gap: 16,
  blocks: []
})

const pageCategories = computed(() => contentStore.categories || [])
const users = ref([])
const authorOptions = computed(() => {
  const list = [...users.value]
  const current = authStore.user
  if (current?.id && !list.some(u => u.id === current.id)) {
    list.unshift(current)
  }
  return list.filter(u => u?.id)
})
const parentPages = computed(() =>
  (contentStore.pages || []).filter(p => !route.params.id || p.id !== Number(route.params.id))
)
const featuredMedia = computed(() => {
  if (!form.value.featured_image) return null
  return contentStore.media.find(
    m => resolveMediaUrl(m.url) === resolveMediaUrl(form.value.featured_image) || m.url === form.value.featured_image
  ) || null
})

onMounted(async () => {
  if (authStore.user?.id) {
    form.value.author_id = authStore.user.id
  }
  await contentStore.fetchCategories()
  if (!contentStore.pages.length) {
    await contentStore.fetchPages({ limit: 'all' })
  }
  if (!contentStore.media.length) {
    await contentStore.fetchMedia({ limit: 'all' })
  }
  await fetchUsers()
  if (route.params.id) {
    isEdit.value = true
    const page = await contentStore.fetchPage(route.params.id)
    if (page) {
      form.value = { ...page }
      form.value.category_id = page.category_id || null
      form.value.author_id = page.author_id || authStore.user?.id || null
      form.value.publish_at = page.publish_at ? page.publish_at.replace(' ', 'T').slice(0, 16) : ''
      form.value.parent_id = page.parent_id || null
      form.value.featured_image_alt = page.featured_image_alt || ''
      form.value.featured_image_title = page.featured_image_title || ''
      form.value.featured_image_caption = page.featured_image_caption || ''
      form.value.featured_image_description = page.featured_image_description || ''
      slugEdited.value = true
      if (page.layout_json) {
        try {
          layout.value = JSON.parse(page.layout_json)
        } catch (e) {
          console.warn('Failed to parse layout_json', e)
        }
      }
    }
  }
})

watch(() => form.value.title, (val) => {
  if (!slugEdited.value) {
    form.value.slug = slugify(val)
  }
})

function onSlugInput(val) {
  slugEdited.value = true
  form.value.slug = slugify(val)
}

function slugify(text) {
  return (text || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function formatDateTimeLocal(val) {
  if (!val) return ''
  return val.slice(0, 16)
}

async function savePage() {
  try {
    if (!form.value.author_id) {
      form.value.author_id = authStore.user?.id || null
    }
    const publishAtValue = form.value.publish_at ? new Date(form.value.publish_at) : null
    const payload = {
      ...form.value,
      publish_at: publishAtValue ? publishAtValue.toISOString().slice(0, 19).replace('T', ' ') : null,
      layout_json: JSON.stringify(layout.value)
    }
    if (!form.value.slug) {
      payload.slug = slugify(form.value.title)
      form.value.slug = payload.slug
    }
    if (isEdit.value) {
      await contentStore.updatePage(route.params.id, payload)
    } else {
      const created = await contentStore.createPage(payload)
      if (created?.id) {
        isEdit.value = true
        router.replace({ name: 'admin-page-edit', params: { id: created.id } })
        form.value = { ...form.value, id: created.id }
      }
    }
    saved.value = true
    setTimeout(() => { saved.value = false }, 2000)
  } catch (error) {
    alert('Error saving page: ' + error.message)
  }
}

function openMediaModal() {
  mediaSelection.value = null
  mediaModalOpen.value = true
}

function closeMediaModal() {
  mediaModalOpen.value = false
}

function closeFeaturedModal() {
  featuredModalOpen.value = false
}

function selectMedia(id) {
  mediaSelection.value = id
}

function applyMediaSelection() {
  const file = contentStore.media.find(m => m.id === mediaSelection.value)
  if (file) {
    form.value.featured_image = file.url
    form.value.featured_image_alt = file.alt_text || ''
    form.value.featured_image_title = file.title || ''
    form.value.featured_image_caption = file.caption || ''
    form.value.featured_image_description = file.description || ''
    featuredDimensions.value = { width: null, height: null }
  }
  closeMediaModal()
}

async function onUploadMedia(evt) {
  const file = evt.target.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const uploaded = await contentStore.uploadMedia(file)
    form.value.featured_image = uploaded.url
    await contentStore.fetchMedia({ limit: 'all' })
  } finally {
    uploading.value = false
  }
}

async function fetchUsers() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users`)
    const data = response.data
    const list = Array.isArray(data) ? data : (Array.isArray(data?.users) ? data.users : [])
    const fallback = authStore.user?.id ? [authStore.user] : []
    const combined = [...fallback, ...list]
    const deduped = combined.filter(
      (u, idx, arr) => u?.id && arr.findIndex(x => x?.id === u.id) === idx
    )
    users.value = deduped
  } catch (error) {
    console.error('Failed to fetch users', error)
    users.value = authStore.user?.id ? [authStore.user] : []
  }
}

function openFeaturedModal() {
  if (!form.value.featured_image) return
  featuredModalOpen.value = true
  loadFeaturedDimensions()
}

function loadFeaturedDimensions() {
  featuredDimensions.value = { width: null, height: null }
  if (!form.value.featured_image) return
  const img = new Image()
  img.onload = () => {
    featuredDimensions.value = { width: img.naturalWidth, height: img.naturalHeight }
  }
  img.src = resolveMediaUrl(form.value.featured_image)
}

function copyFileUrl() {
  const url = resolveMediaUrl(form.value.featured_image)
  navigator.clipboard?.writeText(url)
}

function downloadFile() {
  const url = resolveMediaUrl(form.value.featured_image)
  const link = document.createElement('a')
  link.href = url
  link.target = '_blank'
  link.download = ''
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function clearFeaturedImage() {
  form.value.featured_image = ''
  form.value.featured_image_alt = ''
  form.value.featured_image_title = ''
  form.value.featured_image_caption = ''
  form.value.featured_image_description = ''
  featuredDimensions.value = { width: null, height: null }
  featuredModalOpen.value = false
}
</script>

<template>
  <form @submit.prevent="savePage" class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 class="text-lg font-semibold mb-4">Page Content</h3>
      <div class="mb-6">
        <label class="block text-md font-medium text-gray-900 mb-2">Title</label>
        <input v-model="form.title" type="text" class="w-full px-4 py-2 border rounded" placeholder="Page title" required>
      </div>
      <div class="mb-6">
        <label class="block text-md font-medium text-gray-900 mb-2">Page Builder</label>
        <PageBuilder v-model="layout" />
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-md p-6 h-fit">
      <div class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Slug</label>
          <input
            :value="form.slug"
            @input="onSlugInput($event.target.value)"
            type="text"
            class="w-full px-4 py-2 border rounded"
            placeholder="page-slug"
          >
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Featured Image</label>
          <div class="flex flex-col gap-2">
            <div
              v-if="form.featured_image"
              class="w-full h-32 rounded border overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer"
              @click="openFeaturedModal"
              title="Click to view details"
            >
              <img :src="resolveMediaUrl(form.featured_image)" alt="Featured" class="object-cover h-full w-full">
            </div>
            <input type="text" v-model="form.featured_image" class="w-full px-4 py-2 border rounded" placeholder="Image URL">
            <div class="flex flex-wrap gap-2">
              <button type="button" class="bg-gray-800 text-white text-xs px-4 py-2 rounded hover:bg-gray-700 transition cursor-pointer flex items-center gap-2" @click="openMediaModal">
                Choose from Library
              </button>
              <label class="bg-rd-orange text-white text-xs px-4 py-2 rounded hover:bg-rd-orange-light transition cursor-pointer flex items-center gap-2">
                <span>{{ uploading ? 'Uploading...' : 'Upload Image' }}</span>
                <input type="file" class="hidden" accept="image/*" @change="onUploadMedia">
              </label>
            </div>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Category</label>
          <select v-model="form.category_id" class="w-full px-4 py-2 border rounded">
            <option :value="null">None</option>
            <option v-for="cat in pageCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Author</label>
          <select v-model="form.author_id" class="w-full px-4 py-2 border rounded">
            <option :value="null">Select author</option>
            <option v-for="user in authorOptions" :key="user.id" :value="user.id">
              {{ user.username || user.email || `User ${user.id}` }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Publish At</label>
          <input
            type="datetime-local"
            v-model="form.publish_at"
            class="w-full px-4 py-2 border rounded"
            placeholder="YYYY-MM-DD HH:MM"
          >
          <p class="text-xs text-gray-500 mt-1">Set a future date/time to auto-publish when reached.</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Parent</label>
          <select v-model="form.parent_id" class="w-full px-4 py-2 border rounded">
            <option :value="null">No parent</option>
            <option v-for="p in parentPages" :key="p.id" :value="p.id">{{ p.title }}</option>
          </select>
          <p class="text-xs text-gray-500 mt-1">Choose a parent page to nest this page.</p>
        </div>
        <label class="flex items-center">
          <input v-model="form.published" type="checkbox" class="mr-2">
          <span class="text-sm text-gray-900">Publish this page</span>
        </label>
      </div>
      <div class="flex gap-3 mt-6">
        <button type="submit" class="bg-rd-orange text-white cursor-pointer px-4 py-2 rounded hover:bg-rd-orange-light transition">
          Save Page
        </button>
        <button v-if="saved" type="button" disabled class="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2">
          <IconCircleCheck :size="18" />
          <span>Saved</span>
        </button>
      </div>
    </div>
  </form>

  <div v-if="mediaModalOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
      <div class="px-4 py-3 border-b flex items-center justify-between">
        <h4 class="text-base font-semibold">Media Library</h4>
        <button class="text-sm text-gray-600 hover:text-gray-900" @click="closeMediaModal">Close</button>
      </div>
      <div class="p-4 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-3">
        <button
          v-for="file in contentStore.media"
          :key="file.id"
          type="button"
          class="border rounded overflow-hidden text-left"
          :class="mediaSelection === file.id ? 'border-rd-orange ring-2 ring-rd-orange/40' : 'border-gray-200'"
          @click="selectMedia(file.id)"
        >
          <div class="h-32 bg-gray-100 flex items-center justify-center">
            <img v-if="file.mime_type?.startsWith('image/')" :src="resolveMediaUrl(file.url)" class="object-cover h-full w-full" />
            <div v-else class="text-xs text-gray-600 px-2">{{ file.filename || file.url }}</div>
          </div>
          <div class="px-2 py-1 text-xs text-gray-700 truncate">{{ file.filename || file.url }}</div>
        </button>
      </div>
      <div class="px-4 py-3 border-t flex justify-end gap-2">
        <button class="px-3 py-2 text-sm rounded border border-gray-300" @click="closeMediaModal">Cancel</button>
        <button class="px-3 py-2 text-sm rounded bg-rd-orange text-white" @click="applyMediaSelection">Add Selected</button>
      </div>
    </div>
  </div>

  <div v-if="featuredModalOpen" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
      <div class="px-4 py-3 border-b flex items-center justify-between">
        <h4 class="text-base font-semibold">Featured Image Details</h4>
        <button class="text-sm text-gray-600 hover:text-gray-900 cursor-pointer" @click="closeFeaturedModal"><IconCircleX /></button>
      </div>
      <div class="flex flex-col lg:flex-row gap-4 p-4 overflow-auto">
        <div class="flex-1 flex items-center justify-center bg-gray-50 border rounded">
          <img :src="resolveMediaUrl(form.featured_image)" alt="Featured" class="max-h-[60vh] object-contain">
        </div>
        <div class="w-full lg:w-1/2 space-y-3">
          <div class="grid grid-cols-2 gap-2 text-sm text-gray-700">
            <div><span class="font-semibold">Uploaded On:</span> {{ featuredMedia?.created_at?.slice(0,10) || '—' }}</div>
            <div><span class="font-semibold">Uploaded By:</span> {{ featuredMedia?.uploader_name || 'Imported' }}</div>
            <div><span class="font-semibold">File Name:</span> {{ featuredMedia?.filename || '—' }}</div>
            <div><span class="font-semibold">File Type:</span> {{ featuredMedia?.mime_type || '—' }}</div>
            <div><span class="font-semibold">File Size:</span> {{ featuredMedia?.size ? Math.round(featuredMedia.size / 1024) + ' KB' : '—' }}</div>
            <div><span class="font-semibold">Dimensions:</span> {{ featuredDimensions.width && featuredDimensions.height ? `${featuredDimensions.width} x ${featuredDimensions.height}` : '—' }}</div>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Alt Attribute</label>
            <input v-model="form.featured_image_alt" type="text" class="w-full border rounded px-3 py-2">
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Title Attribute</label>
            <input v-model="form.featured_image_title" type="text" class="w-full border rounded px-3 py-2">
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Caption</label>
            <textarea v-model="form.featured_image_caption" class="w-full border rounded px-3 py-2" rows="2"></textarea>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Description</label>
            <textarea v-model="form.featured_image_description" class="w-full border rounded px-3 py-2" rows="3"></textarea>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">File URL</label>
            <input :value="resolveMediaUrl(form.featured_image)" readonly class="w-full border rounded px-3 py-2 bg-gray-50 text-sm">
            <div class="flex gap-2">
              <button type="button" class="cursor-pointer px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-sm text-white" @click="copyFileUrl">Copy URL</button>
              <button type="button" class="cursor-pointer px-3 py-2 rounded bg-rd-orange hover:bg-rd-orange-light text-sm text-white" @click="downloadFile">Download</button>
              <button type="button" class="cursor-pointer px-3 py-2 rounded bg-red-600 hover:bg-red-500 text-sm text-white" @click="clearFeaturedImage">Delete</button>
            </div>
            <p class="text-xs text-gray-500">Changes here apply to this page only; defaults from the media library are overridden.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
