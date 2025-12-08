<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute, RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useContentStore } from '../../stores/content'
import DashboardCard from '../../components/admin/DashboardCard.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const contentStore = useContentStore()

const stats = ref({
  posts: 0,
  pages: 0,
  media: 0,
  navigation: 0
})

const recentPosts = ref([])
const recentPages = ref([])

const isRootAdmin = computed(() => route.path === '/admin')

onMounted(async () => {
  await contentStore.fetchPosts()
  await contentStore.fetchPages()
  await contentStore.fetchMedia()
  await contentStore.fetchNavigation()

  stats.value = {
    posts: contentStore.posts.length,
    pages: contentStore.pages.length,
    media: contentStore.media.length,
    navigation: contentStore.navigation.length
  }

  recentPosts.value = contentStore.posts
  recentPages.value = contentStore.pages
})

function isActive(path) {
  return route.path.startsWith(path) && (path === '/admin' ? route.path === '/admin' : true)
}

function handleLogout() {
  authStore.logout()
  router.push({ name: 'admin-login' })
}

function formatDate(date) {
  return new Date(date).toLocaleDateString()
}

function getPageTitle() {
  const path = route.path
  const titles = {
    '/admin/posts': 'Posts',
    '/admin/pages': 'Pages',
    '/admin/media': 'Media',
    '/admin/navigation': 'Navigation',
    '/admin/settings': 'Settings',
    '/admin/users': 'Users',
    '/admin/design': 'Design Settings'
  }
  
  for (const [routePath, title] of Object.entries(titles)) {
    if (path.startsWith(routePath)) {
      return title
    }
  }
  return 'Admin'
}
</script>

<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar -->
    <div class="w-64 bg-gray-900 text-white p-6">
      <div class="mb-8">
        <h1 class="text-2xl font-avant-garde-demi">ResDesCMS</h1>
        <p class="text-sm text-gray-400">Admin</p>
      </div>

      <nav class="space-y-2">
        <RouterLink
          to="/admin"
          class="block px-4 py-2 rounded hover:bg-gray-800 transition"
          :class="{ 'bg-rd-orange': isActive('/admin') }"
        >
          Dashboard
        </RouterLink>
        <RouterLink
          to="/admin/posts"
          class="block px-4 py-2 rounded hover:bg-gray-800 transition"
          :class="{ 'bg-rd-orange': isActive('/admin/posts') }"
        >
          Posts
        </RouterLink>
        <RouterLink
          to="/admin/pages"
          class="block px-4 py-2 rounded hover:bg-gray-800 transition"
          :class="{ 'bg-rd-orange': isActive('/admin/pages') }"
        >
          Pages
        </RouterLink>
        <RouterLink
          to="/admin/media"
          class="block px-4 py-2 rounded hover:bg-gray-800 transition"
          :class="{ 'bg-rd-orange': isActive('/admin/media') }"
        >
          Media
        </RouterLink>
        <RouterLink
          to="/admin/navigation"
          class="block px-4 py-2 rounded hover:bg-gray-800 transition"
          :class="{ 'bg-rd-orange': isActive('/admin/navigation') }"
        >
          Navigation
        </RouterLink>
        <RouterLink
          to="/admin/settings"
          class="block px-4 py-2 rounded hover:bg-gray-800 transition"
          :class="{ 'bg-rd-orange': isActive('/admin/settings') }"
        >
          Settings
        </RouterLink>
        <RouterLink
          to="/admin/users"
          class="block px-4 py-2 rounded hover:bg-gray-800 transition"
          :class="{ 'bg-rd-orange': isActive('/admin/users') }"
        >
          Users
        </RouterLink>
        <RouterLink
          to="/admin/design"
          class="block px-4 py-2 rounded hover:bg-gray-800 transition"
          :class="{ 'bg-rd-orange': isActive('/admin/design') }"
        >
          Design
        </RouterLink>
      </nav>

      <div class="mt-12 pt-6 border-t border-gray-700">
        <RouterLink to="/" class="block px-4 py-2 text-sm text-gray-400 hover:text-white transition mb-4">
          View Site
        </RouterLink>
        <button
          @click="handleLogout"
          class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition text-sm"
        >
          Logout
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 overflow-auto">
      <div v-if="isRootAdmin" class="bg-white shadow-sm p-6 border-b">
        <h2 class="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p class="text-gray-600 mt-1">Welcome to the Resonance CMS</p>
      </div>

      <div v-if="isRootAdmin" class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <DashboardCard title="Posts" :count="stats.posts" icon="📝" />
          <DashboardCard title="Pages" :count="stats.pages" icon="📄" />
          <DashboardCard title="Media" :count="stats.media" icon="🖼️" />
          <DashboardCard title="Navigation Items" :count="stats.navigation" icon="🔗" />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold mb-4">Recent Posts</h3>
            <div class="space-y-3">
              <div v-if="recentPosts.length === 0" class="text-gray-500 text-sm">No posts yet</div>
              <div v-for="post in recentPosts.slice(0, 5)" :key="post.id" class="border-l-4 border-rd-orange pl-4">
                <p class="font-medium text-gray-900">{{ post.title }}</p>
                <p class="text-sm text-gray-600">{{ formatDate(post.created_at) }}</p>
              </div>
            </div>
            <RouterLink to="/admin/posts" class="text-rd-orange hover:text-rd-orange-light mt-4 inline-block text-sm">
              View all posts →
            </RouterLink>
          </div>

          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold mb-4">Recent Pages</h3>
            <div class="space-y-3">
              <div v-if="recentPages.length === 0" class="text-gray-500 text-sm">No pages yet</div>
              <div v-for="page in recentPages.slice(0, 5)" :key="page.id" class="border-l-4 border-rd-teal pl-4">
                <p class="font-medium text-gray-900">{{ page.title }}</p>
                <p class="text-sm text-gray-600">{{ formatDate(page.created_at) }}</p>
              </div>
            </div>
            <RouterLink to="/admin/pages" class="text-rd-teal hover:text-rd-teal-light mt-4 inline-block text-sm">
              View all pages →
            </RouterLink>
          </div>
        </div>
      </div>

      <div v-else>
        <div class="bg-white shadow-sm p-6 border-b">
          <h2 class="text-3xl font-bold text-gray-900">{{ getPageTitle() }}</h2>
        </div>
        <div class="p-6">
          <RouterView />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
