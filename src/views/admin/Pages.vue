<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useContentStore } from '../../stores/content'

const contentStore = useContentStore()
const pages = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  await contentStore.fetchPages()
  pages.value = contentStore.pages
  loading.value = false
})

function formatDate(date) {
  return new Date(date).toLocaleDateString()
}

async function deletePage(id) {
  if (confirm('Are you sure?')) {
    await contentStore.deletePage(id)
    pages.value = pages.value.filter(p => p.id !== id)
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex justify-end">
      <RouterLink to="/admin/pages/new" class="bg-rd-teal text-white px-4 py-2 rounded hover:bg-rd-teal-light transition">
        + New Page
      </RouterLink>
    </div>

    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <div v-if="loading" class="p-6 text-center text-gray-600">Loading pages...</div>
      <div v-else-if="pages.length === 0" class="p-6 text-center text-gray-600">No pages yet. Create your first page!</div>
      <table v-else class="w-full">
        <thead class="bg-gray-100 border-b">
          <tr>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Updated</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
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
            <td class="px-6 py-4 text-sm space-x-2">
              <RouterLink :to="`/admin/pages/${page.id}/edit`" class="text-rd-teal hover:underline">Edit</RouterLink>
              <button @click="deletePage(page.id)" class="text-red-600 hover:underline">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
