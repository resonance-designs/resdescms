<script setup>
import { ref, onMounted } from 'vue'
import { IconPlus, IconTrash } from '@tabler/icons-vue'
import { useContentStore } from '../../stores/content'

const contentStore = useContentStore()
const loading = ref(false)

const formData = ref({
  name: '',
  slug: '',
  description: ''
})

onMounted(async () => {
  loading.value = true
  await contentStore.fetchCategories()
  loading.value = false
})

async function addCategory() {
  try {
    await contentStore.createCategory(formData.value)
    formData.value = { name: '', slug: '', description: '' }
    alert('Category added successfully!')
  } catch (error) {
    alert('Error adding category: ' + error.message)
  }
}

async function deleteCategory(id) {
  if (confirm('Are you sure?')) {
    try {
      await contentStore.deleteCategory(id)
      alert('Category deleted successfully!')
    } catch (error) {
      alert('Error deleting category: ' + error.message)
    }
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <h2 class="text-2xl font-bold text-gray-900">Categories</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4">Add Category</h3>
        <form @submit.prevent="addCategory" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-900 mb-1">Name</label>
            <input v-model="formData.name" type="text" class="w-full px-4 py-2 border rounded" placeholder="Category name" required>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-900 mb-1">Slug</label>
            <input v-model="formData.slug" type="text" class="w-full px-4 py-2 border rounded" placeholder="category-slug" required>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-900 mb-1">Description</label>
            <textarea v-model="formData.description" class="w-full px-4 py-2 border rounded" rows="3" placeholder="Category description"></textarea>
          </div>
          <button type="submit" class="w-full bg-rd-orange text-white px-4 py-2 rounded hover:bg-rd-orange-light transition cursor-pointer flex items-center gap-2 justify-center">
            <IconPlus :size="18" />
            <span>Add Category</span>
          </button>
        </form>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4">Categories</h3>
        <div v-if="loading" class="text-center text-gray-600">Loading...</div>
        <div v-else-if="contentStore.categories.length === 0" class="text-center text-gray-600 py-4">No categories yet</div>
        <div v-else class="space-y-2 max-h-96 overflow-y-auto">
          <div v-for="category in contentStore.categories" :key="category.id" class="flex justify-between items-start p-3 border rounded hover:bg-gray-50">
            <div>
              <p class="font-medium text-gray-900">{{ category.name }}</p>
              <p class="text-sm text-gray-600">{{ category.slug }}</p>
              <p class="text-xs text-gray-500">{{ category.description }}</p>
            </div>
            <button @click="deleteCategory(category.id)" class="text-red-600 hover:text-red-800 text-sm cursor-pointer flex items-center gap-1">
              <IconTrash :size="16" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
