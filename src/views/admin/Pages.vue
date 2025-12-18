<script setup>
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  IconPencil,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
  IconChevronLeftPipe,
  IconChevronRightPipe
} from '@tabler/icons-vue'
import { useContentStore } from '../../stores/content'

const contentStore = useContentStore()
const pages = ref([])
const loading = ref(false)
const pagination = ref({ page: 1, limit: 10, total: 0, pages: 1 })
const currentPage = ref(1)
const pageInput = ref(1)
const perPage = ref(10)

const totalPages = computed(() => pagination.value.pages || 1)

async function loadPages(page = 1) {
  loading.value = true
  try {
    await contentStore.fetchPages({ page, limit: perPage.value })
    pages.value = contentStore.pages
    pagination.value = contentStore.pagesPagination
    currentPage.value = pagination.value.page
    pageInput.value = currentPage.value
  } catch (error) {
    alert('Failed to load pages: ' + error.message)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadPages(currentPage.value))

function formatDate(date) {
  return new Date(date).toLocaleDateString()
}

function applyPerPage() {
  const parsed = parseInt(perPage.value, 10)
  perPage.value = parsed > 0 ? parsed : 10
  pageInput.value = 1
  changePage(1, true)
}

function changePage(page, force = false) {
  const target = Math.min(Math.max(page, 1), totalPages.value)
  if (force || target !== currentPage.value || pages.value.length === 0) {
    loadPages(target)
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

async function deletePage(id) {
  if (confirm('Are you sure?')) {
    const isLastOnPage = pages.value.length === 1
    await contentStore.deletePage(id)
    const nextPage = isLastOnPage && currentPage.value > 1 ? currentPage.value - 1 : currentPage.value
    changePage(nextPage)
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-700">Pages per page:</label>
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
      <RouterLink to="/admin/pages/new" class="bg-rd-orange text-white px-4 py-2 rounded hover:bg-rd-orange-light transition">
        + New Page
      </RouterLink>
    </div>

    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <div v-if="loading" class="p-6 text-center text-gray-600">Loading pages...</div>
      <div v-else-if="pages.length === 0" class="p-6 text-center text-gray-600">No pages yet. Create your first page!</div>
      <table v-else class="w-full">
        <thead class="bg-gray-100 border-b bg-rd-orange">
          <tr>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Updated</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900 float-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="page in pages" :key="page.id" class="border-b hover:bg-gray-50">
            <td class="px-6 py-4 text-gray-900 font-medium">{{ page.title }}</td>
            <td class="px-6 py-4 text-gray-600 text-sm">{{ page.category_name || 'Uncategorized' }}</td>
            <td class="px-6 py-4 text-sm">
              <span class="px-2 py-1 rounded text-xs font-semibold" :class="page.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'">
                {{ page.published ? 'Published' : 'Draft' }}
              </span>
            </td>
            <td class="px-6 py-4 text-gray-600 text-sm">{{ formatDate(page.updated_at) }}</td>
            <td class="px-6 py-4 text-sm space-x-2 float-right">
              <RouterLink :to="`/admin/pages/${page.id}/edit`" class="inline-block text-rd-orange hover:underline" title="Edit Page"><IconPencil stroke={2} /></RouterLink>
              <button @click="deletePage(page.id)" class="cursor-pointer text-red-600 hover:underline" title="Delete Page"><IconTrash stroke={2} /></button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="pages.length > 0" class="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4 border-t">
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
            <span>of {{ totalPages }} · {{ pagination.total }} pages</span>
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
