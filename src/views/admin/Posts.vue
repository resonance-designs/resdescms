<template>
  <div>
    <div class="mb-6 flex justify-end">
      <RouterLink to="/admin/posts/new" class="bg-rd-orange text-white px-4 py-2 rounded hover:bg-rd-orange-light transition">
        + New Post
      </RouterLink>
    </div>

    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <div v-if="loading" class="p-6 text-center text-gray-600">Loading posts...</div>
      <div v-else-if="posts.length === 0" class="p-6 text-center text-gray-600">No posts yet. Create your first post!</div>
      <table v-else class="w-full">
        <thead class="bg-gray-100 border-b">
          <tr>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="post in posts" :key="post.id" class="border-b hover:bg-gray-50">
            <td class="px-6 py-4 text-gray-900 font-medium">{{ post.title }}</td>
            <td class="px-6 py-4 text-gray-600 text-sm">{{ post.category_name || 'Uncategorized' }}</td>
            <td class="px-6 py-4 text-sm">
              <span class="px-2 py-1 rounded text-xs font-semibold" :class="post.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'">
                {{ post.published ? 'Published' : 'Draft' }}
              </span>
            </td>
            <td class="px-6 py-4 text-gray-600 text-sm">{{ formatDate(post.created_at) }}</td>
            <td class="px-6 py-4 text-sm space-x-2">
              <RouterLink :to="`/admin/posts/${post.id}/edit`" class="text-rd-orange hover:underline">Edit</RouterLink>
              <button @click="deletePost(post.id)" class="text-red-600 hover:underline">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useContentStore } from '../../stores/content'

const contentStore = useContentStore()
const posts = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  await contentStore.fetchPosts()
  posts.value = contentStore.posts
  loading.value = false
})

function formatDate(date) {
  return new Date(date).toLocaleDateString()
}

async function deletePost(id) {
  if (confirm('Are you sure?')) {
    await contentStore.deletePost(id)
    posts.value = posts.value.filter(p => p.id !== id)
  }
}
</script>
