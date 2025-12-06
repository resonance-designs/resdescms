<template>
  <form @submit.prevent="savePage" class="max-w-4xl">
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Title</label>
          <input v-model="form.title" type="text" class="w-full px-4 py-2 border rounded" placeholder="Page title" required>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Slug</label>
          <input v-model="form.slug" type="text" class="w-full px-4 py-2 border rounded" placeholder="page-slug">
        </div>
      </div>

      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-900 mb-2">Content</label>
        <textarea v-model="form.content" class="w-full px-4 py-2 border rounded" rows="12" placeholder="Page content..."></textarea>
      </div>

      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-900 mb-2">Featured Image</label>
        <input type="text" v-model="form.featured_image" class="w-full px-4 py-2 border rounded" placeholder="Image URL or media ID">
      </div>

      <label class="flex items-center">
        <input v-model="form.published" type="checkbox" class="mr-2">
        <span class="text-sm text-gray-900">Publish this page</span>
      </label>
    </div>

    <div class="flex gap-4">
      <button type="submit" class="bg-rd-teal text-white px-6 py-2 rounded hover:bg-rd-teal-light transition">
        Save Page
      </button>
      <RouterLink to="/admin/pages" class="bg-gray-300 text-gray-900 px-6 py-2 rounded hover:bg-gray-400 transition">
        Cancel
      </RouterLink>
    </div>
  </form>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useContentStore } from '../../stores/content'

const router = useRouter()
const route = useRoute()
const contentStore = useContentStore()

const isEdit = ref(false)
const form = ref({
  title: '',
  slug: '',
  content: '',
  featured_image: '',
  published: false
})

onMounted(async () => {
  if (route.params.id) {
    isEdit.value = true
    const page = await contentStore.fetchPage(route.params.id)
    if (page) {
      form.value = { ...page }
    }
  }
})

async function savePage() {
  try {
    if (isEdit.value) {
      await contentStore.updatePage(route.params.id, form.value)
    } else {
      await contentStore.createPage(form.value)
    }
    router.push({ name: 'admin-pages' })
  } catch (error) {
    alert('Error saving page: ' + error.message)
  }
}
</script>
