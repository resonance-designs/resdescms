<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 py-12">
      <RouterLink to="/" class="text-rd-orange hover:text-rd-orange-light mb-6 inline-block">← Back to Home</RouterLink>

      <article v-if="page" class="bg-white rounded-lg shadow-md p-8">
        <h1 class="text-4xl font-bold font-avant-garde-demi text-gray-900 mb-8">{{ page.title }}</h1>

        <img v-if="page.featured_image" :src="page.featured_image" :alt="page.title" class="w-full h-96 object-cover rounded-lg mb-8">

        <div class="prose prose-lg max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap">
          {{ page.content }}
        </div>
      </article>

      <div v-else class="bg-white rounded-lg shadow-md p-8 text-center">
        <p class="text-gray-600">Page not found</p>
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
const page = ref(null)

onMounted(async () => {
  const slug = route.params.slug
  await contentStore.fetchPages()
  page.value = contentStore.pages.find(p => p.slug === slug)
})
</script>
