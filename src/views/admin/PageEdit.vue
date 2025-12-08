<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useContentStore } from '../../stores/content'
import PageBuilder from '../../components/admin/PageBuilder.vue'

const router = useRouter()
const route = useRoute()
const contentStore = useContentStore()

const isEdit = ref(false)
const form = ref({
  title: '',
  slug: '',
  content: '',
  featured_image: '',
  category_id: null,
  published: false,
  layout_json: null
})

const layout = ref({
  cols: 4,
  rows: 4,
  gap: 16,
  blocks: []
})

const pageCategories = computed(() => {
  return contentStore.categories.filter(c => c.type === 'page')
})

onMounted(async () => {
  await contentStore.fetchCategories('page')
  if (route.params.id) {
    isEdit.value = true
    const page = await contentStore.fetchPage(route.params.id)
    if (page) {
      form.value = { ...page }
      form.value.category_id = page.category_id || null
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

async function savePage() {
  try {
    form.value.layout_json = JSON.stringify(layout.value)
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

<template>
  <form @submit.prevent="savePage" class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 class="text-lg font-semibold mb-4">Page Builder</h3>
      <PageBuilder v-model="layout" />
    </div>

    <div class="bg-white rounded-lg shadow-md p-6 h-fit">
      <div class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Title</label>
          <input v-model="form.title" type="text" class="w-full px-4 py-2 border rounded" placeholder="Page title" required>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Slug</label>
          <input v-model="form.slug" type="text" class="w-full px-4 py-2 border rounded" placeholder="page-slug">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Featured Image</label>
          <input type="text" v-model="form.featured_image" class="w-full px-4 py-2 border rounded" placeholder="Image URL or media ID">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Category</label>
          <select v-model="form.category_id" class="w-full px-4 py-2 border rounded">
            <option :value="null">None</option>
            <option v-for="cat in pageCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <label class="flex items-center">
          <input v-model="form.published" type="checkbox" class="mr-2">
          <span class="text-sm text-gray-900">Publish this page</span>
        </label>
      </div>
      <div class="flex gap-3 mt-6">
        <button type="submit" class="bg-rd-teal text-white px-4 py-2 rounded hover:bg-rd-teal-light transition">
          Save Page
        </button>
        <RouterLink to="/admin/pages" class="bg-gray-300 text-gray-900 px-4 py-2 rounded hover:bg-gray-400 transition">
          Cancel
        </RouterLink>
      </div>
    </div>
  </form>
</template>
