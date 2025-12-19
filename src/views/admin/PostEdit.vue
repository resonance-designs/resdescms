<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useContentStore } from '../../stores/content'
import { useAuthStore } from '../../stores/auth'
import { resolveMediaUrl } from '../../utils/media'
import MediaDetailsModal from '../../components/admin/MediaDetailsModal.vue'
import { IconCircleCheck } from '@tabler/icons-vue'
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
  excerpt: '',
  content: '',
  featured_image: '',
  category_id: null,
  published: false,
  author_id: null,
  publish_at: '',
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
const featuredMedia = computed(() => {
  if (!form.value.featured_image) return null
  return contentStore.media.find(
    m => resolveMediaUrl(m.url) === resolveMediaUrl(form.value.featured_image) || m.url === form.value.featured_image
  ) || null
})
const featuredFields = computed(() => ({
  alt: form.value.featured_image_alt || '',
  title: form.value.featured_image_title || '',
  caption: form.value.featured_image_caption || '',
  description: form.value.featured_image_description || ''
}))
const users = ref([])
const authorOptions = computed(() => {
  const list = [...users.value]
  const current = authStore.user
  if (current?.id && !list.some(u => u.id === current.id)) {
    list.unshift(current)
  }
  return list.filter(u => u?.id)
})

const postCategories = computed(() => contentStore.categories || [])

onMounted(async () => {
  if (authStore.user?.id) {
    form.value.author_id = authStore.user.id
  }
  await contentStore.fetchCategories()
  if (!contentStore.media.length) {
    await contentStore.fetchMedia({ limit: 'all' })
  }
  await fetchUsers()
  if (route.params.id) {
    isEdit.value = true
    const post = await contentStore.fetchPost(route.params.id)
    if (post) {
      form.value = { ...post }
      form.value.category_id = post.category_id || null
      form.value.author_id = post.author_id || authStore.user?.id || null
      form.value.publish_at = post.publish_at ? post.publish_at.replace(' ', 'T').slice(0, 16) : ''
      form.value.featured_image_alt = post.featured_image_alt || ''
      form.value.featured_image_title = post.featured_image_title || ''
      form.value.featured_image_caption = post.featured_image_caption || ''
      form.value.featured_image_description = post.featured_image_description || ''
      slugEdited.value = true
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

async function savePost() {
  try {
    if (!form.value.slug) {
      form.value.slug = slugify(form.value.title)
    }
    if (!form.value.author_id) {
      form.value.author_id = authStore.user?.id || null
    }
    const publishAtValue = form.value.publish_at ? new Date(form.value.publish_at) : null
    const payload = {
      ...form.value,
      publish_at: publishAtValue ? publishAtValue.toISOString().slice(0, 19).replace('T', ' ') : null
    }
    payload.slug = form.value.slug
    if (isEdit.value) {
      await contentStore.updatePost(route.params.id, payload)
    } else {
      const created = await contentStore.createPost(payload)
      if (created?.id) {
        isEdit.value = true
        router.replace({ name: 'admin-post-edit', params: { id: created.id } })
        form.value = { ...form.value, id: created.id }
      }
    }
    saved.value = true
    setTimeout(() => { saved.value = false }, 2000)
  } catch (error) {
    alert('Error saving post: ' + error.message)
  }
}

function openMediaModal() {
  mediaSelection.value = null
  mediaModalOpen.value = true
}

function closeMediaModal() {
  mediaModalOpen.value = false
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
    form.value.featured_image_alt = uploaded.alt_text || ''
    form.value.featured_image_title = uploaded.title || ''
    form.value.featured_image_caption = uploaded.caption || ''
    form.value.featured_image_description = uploaded.description || ''
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
}

function clearFeaturedImage() {
  form.value.featured_image = ''
  form.value.featured_image_alt = ''
  form.value.featured_image_title = ''
  form.value.featured_image_caption = ''
  form.value.featured_image_description = ''
  featuredModalOpen.value = false
}

function closeFeaturedModal() {
  featuredModalOpen.value = false
}

function updateFeaturedFields(fields) {
  form.value.featured_image_alt = fields?.alt || ''
  form.value.featured_image_title = fields?.title || ''
  form.value.featured_image_caption = fields?.caption || ''
  form.value.featured_image_description = fields?.description || ''
}

function saveFeaturedFields(fields) {
  updateFeaturedFields(fields)
  featuredModalOpen.value = false
}
</script>

<template>
  <form @submit.prevent="savePost" class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 class="text-lg font-semibold mb-4">Post Content</h3>
      <div class="mb-6">
        <label class="block text-md font-medium text-gray-900 mb-2">Title</label>
        <input v-model="form.title" type="text" class="w-full px-4 py-2 border rounded" placeholder="Post title" required>
      </div>
      <div class="mb-6">
        <label class="block text-md font-medium text-gray-900 mb-2">Excerpt</label>
        <textarea v-model="form.excerpt" class="w-full px-4 py-2 border rounded" rows="3" placeholder="Brief summary of the post"></textarea>
      </div>
      <div class="mb-6">
        <label class="block text-md font-medium text-gray-900 mb-2">Content</label>
        <textarea v-model="form.content" class="w-full px-4 py-2 border rounded" rows="12" placeholder="Post content..."></textarea>
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
            placeholder="post-slug"
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
            <option v-for="cat in postCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
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
          <p class="text-xs text-gray-500 mt-1">Schedule a future publish date/time.</p>
        </div>
        <label class="flex items-center">
          <input v-model="form.published" type="checkbox" class="mr-2">
          <span class="text-sm text-gray-900">Publish this post</span>
        </label>
      </div>
      <div class="flex gap-3 mt-6">
        <button type="submit" class="bg-rd-orange text-white cursor-pointer px-6 py-2 rounded hover:bg-rd-orange-light transition">
          Save Post
        </button>
        <button v-if="saved" type="button" disabled class="bg-green-600 text-white px-6 py-2 rounded flex items-center gap-2">
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

  <MediaDetailsModal
    :open="featuredModalOpen"
    :url="form.featured_image"
    :media="featuredMedia"
    :fields="featuredFields"
    @close="closeFeaturedModal"
    @delete="clearFeaturedImage"
    @update:fields="updateFeaturedFields"
    @save="saveFeaturedFields"
  />
</template>
