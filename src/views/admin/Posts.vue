<script setup>
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  IconPencil,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
  IconChevronLeftPipe,
  IconChevronRightPipe,
  IconSearch
} from '@tabler/icons-vue'
import { useContentStore } from '../../stores/content'

const contentStore = useContentStore()
const posts = ref([])
const loading = ref(false)
const pagination = ref({ page: 1, limit: 10, total: 0, pages: 1 })
const currentPage = ref(1)
const pageInput = ref(1)
const perPage = ref(10)
const searchQuery = ref('')
const selectedIds = ref([])
const bulkAction = ref('')

const totalPages = computed(() => pagination.value.pages || 1)
const allSelected = computed({
  get: () => posts.value.length > 0 && selectedIds.value.length === posts.value.length,
  set: (val) => {
    if (val) {
      selectedIds.value = posts.value.map(p => p.id)
    } else {
      selectedIds.value = []
    }
  }
})

async function loadPosts(page = 1) {
  loading.value = true
  selectedIds.value = []
  try {
    await contentStore.fetchPosts({ 
      page, 
      limit: perPage.value,
      search: searchQuery.value
    })
    posts.value = contentStore.posts
    pagination.value = contentStore.postsPagination
    currentPage.value = pagination.value.page
    pageInput.value = currentPage.value
  } catch (error) {
    alert('Failed to load posts: ' + error.message)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadPosts(currentPage.value))

function formatDate(date) {
  return new Date(date).toLocaleDateString()
}

function applyPerPage() {
  const parsed = parseInt(perPage.value, 10)
  perPage.value = parsed > 0 ? parsed : 10
  pageInput.value = 1
  changePage(1, true)
}

function handleSearch() {
  pageInput.value = 1
  changePage(1, true)
}

function changePage(page, force = false) {
  const target = Math.min(Math.max(page, 1), totalPages.value)
  if (force || target !== currentPage.value || posts.value.length === 0) {
    loadPosts(target)
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

async function deletePost(id) {
  if (confirm('Are you sure?')) {
    const isLastOnPage = posts.value.length === 1
    await contentStore.deletePost(id)
    const nextPage = isLastOnPage && currentPage.value > 1 ? currentPage.value - 1 : currentPage.value
    changePage(nextPage)
  }
}

async function handleBulkAction() {
  if (selectedIds.value.length === 0 || !bulkAction.value) return

  const count = selectedIds.value.length
  if (bulkAction.value === 'delete') {
    if (confirm(`Are you sure you want to delete ${count} posts?`)) {
      await contentStore.bulkDeletePosts(selectedIds.value)
      loadPosts(currentPage.value)
    }
  } else if (bulkAction.value === 'publish') {
    await contentStore.bulkPublishPosts(selectedIds.value, true)
    loadPosts(currentPage.value)
  } else if (bulkAction.value === 'unpublish') {
    await contentStore.bulkPublishPosts(selectedIds.value, false)
    loadPosts(currentPage.value)
  }
  bulkAction.value = ''
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div class="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-700">Posts per page:</label>
          <input
            v-model.number="perPage"
            type="number"
            min="1"
            class="border rounded px-3 py-2 w-24 bg-white"
            @keyup.enter.prevent="applyPerPage"
          >
          <button
            @click="applyPerPage"
            class="bg-gray-800 text-white px-3 py-2 rounded hover:bg-gray-700 transition cursor-pointer"
          >
            Apply
          </button>
        </div>

        <div class="relative w-full md:w-64">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <IconSearch size="18" />
          </span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search posts..."
            class="block w-full pl-10 pr-3 py-2 border rounded bg-white focus:ring-rd-orange focus:border-rd-orange"
            @keyup.enter="handleSearch"
          >
        </div>

        <div v-if="selectedIds.length > 0" class="flex items-center gap-2 bg-rd-orange/10 px-3 py-2 rounded border border-rd-orange/20 animate-fade-in">
          <span class="text-xs font-semibold text-rd-orange whitespace-nowrap">{{ selectedIds.length }} selected</span>
          <select v-model="bulkAction" class="text-xs border rounded px-2 py-1 bg-white">
            <option value="">Bulk Actions</option>
            <option value="publish">Publish</option>
            <option value="unpublish">Unpublish</option>
            <option value="delete">Delete</option>
          </select>
          <button @click="handleBulkAction" class="bg-rd-orange text-white text-xs px-3 py-1 rounded hover:bg-rd-orange-light">Apply</button>
        </div>
      </div>
      <RouterLink to="/admin/posts/new" class="bg-rd-orange text-white px-4 py-2 rounded hover:bg-rd-orange-light transition">
        + New Post
      </RouterLink>
    </div>

    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <div v-if="loading" class="p-6 text-center text-gray-600">Loading posts...</div>
      <div v-else-if="posts.length === 0" class="p-6 text-center text-gray-600">No posts yet. Create your first post!</div>
      <table v-else class="w-full">
        <thead class="bg-gray-100 border-b bg-rd-orange">
          <tr>
            <th class="px-6 py-3 text-left w-10">
              <input type="checkbox" v-model="allSelected" class="rounded text-rd-orange focus:ring-rd-orange">
            </th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900 float-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="post in posts" :key="post.id" class="border-b hover:bg-gray-50" :class="{'bg-rd-orange/5': selectedIds.includes(post.id)}">
            <td class="px-6 py-4">
              <input type="checkbox" v-model="selectedIds" :value="post.id" class="rounded text-rd-orange focus:ring-rd-orange">
            </td>
            <td class="px-6 py-4 text-gray-900 font-medium">{{ post.title }}</td>
            <td class="px-6 py-4 text-gray-600 text-sm">{{ post.category_name || 'Uncategorized' }}</td>
            <td class="px-6 py-4 text-sm">
              <span class="px-2 py-1 rounded text-xs font-semibold" :class="post.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'">
                {{ post.published ? 'Published' : 'Draft' }}
              </span>
            </td>
            <td class="px-6 py-4 text-gray-600 text-sm">{{ formatDate(post.created_at) }}</td>
            <td class="px-6 py-4 text-sm space-x-2 float-right">
              <RouterLink :to="`/admin/posts/${post.id}/edit`" class="inline-block text-rd-orange hover:underline" title="Edit Post"><IconPencil stroke={2} /></RouterLink>
              <button @click="deletePost(post.id)" class="text-red-600 hover:underline cursor-pointer" title="Delete Post"><IconTrash stroke={2} /></button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="posts.length > 0" class="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4 border-t">
        <div class="flex items-center gap-3 text-sm text-gray-600">
          <button
            @click="changePage(1, true)"
            :disabled="currentPage <= 1 || loading"
            class="px-2 py-2 rounded border text-white bg-gray-800 cursor-pointer hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="First page"
          >
            <IconChevronLeftPipe />
          </button>
          <button
            @click="changePage(currentPage - 1)"
            :disabled="currentPage <= 1 || loading"
            class="px-2 py-2 rounded border text-white bg-gray-800 cursor-pointer hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <span>of {{ totalPages }} · {{ pagination.total }} posts</span>
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
