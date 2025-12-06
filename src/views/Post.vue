<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 py-12">
      <RouterLink to="/" class="text-rd-orange hover:text-rd-orange-light mb-6 inline-block">← Back to Home</RouterLink>

      <article v-if="post" class="bg-white rounded-lg shadow-md p-8">
        <h1 class="text-4xl font-bold font-avant-garde-demi text-gray-900 mb-4">{{ post.title }}</h1>
        <div class="flex items-center text-gray-600 text-sm mb-8">
          <span>{{ formatDate(post.created_at) }}</span>
        </div>

        <img v-if="post.featured_image" :src="post.featured_image" :alt="post.title" class="w-full h-96 object-cover rounded-lg mb-8">

        <p class="text-gray-600 text-lg mb-8">{{ post.excerpt }}</p>

        <div class="prose prose-lg max-w-none text-gray-800 leading-relaxed">
          {{ post.content }}
        </div>
      </article>

      <div v-else class="bg-white rounded-lg shadow-md p-8 text-center">
        <p class="text-gray-600">Post not found</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useContentStore } from '../stores/content'

const route = useRoute()
const contentStore = useContentStore()
const post = ref(null)

onMounted(async () => {
  const slug = route.params.slug
  const posts = await contentStore.fetchPosts()
  post.value = contentStore.posts.find(p => p.slug === slug)
})

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>
