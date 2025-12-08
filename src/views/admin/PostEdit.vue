<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useContentStore } from '../../stores/content'

const router = useRouter()
const route = useRoute()
const contentStore = useContentStore()

const isEdit = ref(false)
const form = ref({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  featured_image: '',
  category_id: null,
  published: false
})

const postCategories = computed(() => {
  return contentStore.categories.filter(c => c.type === 'post')
})

onMounted(async () => {
  await contentStore.fetchCategories('post')
  if (route.params.id) {
    isEdit.value = true
    const post = await contentStore.fetchPost(route.params.id)
    if (post) {
      form.value = { ...post }
      form.value.category_id = post.category_id || null
    }
  }
})

async function savePost() {
  try {
    if (isEdit.value) {
      await contentStore.updatePost(route.params.id, form.value)
    } else {
      await contentStore.createPost(form.value)
    }
    router.push({ name: 'admin-posts' })
  } catch (error) {
    alert('Error saving post: ' + error.message)
  }
}
</script>

<template>
  <form @submit.prevent="savePost" class="max-w-4xl">
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Title</label>
          <input v-model="form.title" type="text" class="w-full px-4 py-2 border rounded" placeholder="Post title" required>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Slug</label>
          <input v-model="form.slug" type="text" class="w-full px-4 py-2 border rounded" placeholder="post-slug">
        </div>
      </div>

      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-900 mb-2">Excerpt</label>
        <textarea v-model="form.excerpt" class="w-full px-4 py-2 border rounded" rows="3" placeholder="Brief summary of the post"></textarea>
      </div>

      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-900 mb-2">Content</label>
        <textarea v-model="form.content" class="w-full px-4 py-2 border rounded" rows="10" placeholder="Post content..."></textarea>
      </div>

      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-900 mb-2">Featured Image</label>
        <input type="text" v-model="form.featured_image" class="w-full px-4 py-2 border rounded" placeholder="Image URL or media ID">
      </div>

      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-900 mb-2">Category</label>
        <select v-model="form.category_id" class="w-full px-4 py-2 border rounded">
          <option :value="null">None</option>
          <option v-for="cat in postCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label class="flex items-center">
          <input v-model="form.published" type="checkbox" class="mr-2">
          <span class="text-sm text-gray-900">Publish this post</span>
        </label>
      </div>
    </div>

    <div class="flex gap-4">
      <button type="submit" class="bg-rd-orange text-white px-6 py-2 rounded hover:bg-rd-orange-light transition">
        Save Post
      </button>
      <RouterLink to="/admin/posts" class="bg-gray-300 text-gray-900 px-6 py-2 rounded hover:bg-gray-400 transition">
        Cancel
      </RouterLink>
    </div>
  </form>
</template>
