<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute, RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useContentStore } from '../../stores/content'
import { usePluginStore } from '../../stores/plugins'
import DashboardCard from '../../components/admin/DashboardCard.vue'
import Sidebar from '../../components/admin/Sidebar.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const contentStore = useContentStore()
const pluginStore = usePluginStore()

const stats = ref({
  posts: 0,
  pages: 0,
  media: 0,
  navigation: 0
})

const recentPosts = ref([])
const recentPages = ref([])
const open = ref({ content: true, site: true })
const activePluginMenus = computed(() =>
  (pluginStore.plugins || [])
    .filter(p => p.isActive && p.adminMenu)
    .flatMap(p => p.adminMenu)
)

const isRootAdmin = computed(() => route.path === '/admin')

onMounted(async () => {
  if (!pluginStore.plugins.length) {
    await pluginStore.fetchPlugins()
  }
  pluginStore.injectClientScripts({ includeAdmin: true })
  await contentStore.fetchPosts()
  await contentStore.fetchPages()
  await contentStore.fetchMedia()
  await contentStore.fetchNavigationMenus()

  stats.value = {
    posts: contentStore.posts.length,
    pages: contentStore.pages.length,
    media: contentStore.media.length,
    navigation: (contentStore.navigationMenus || []).reduce(
      (sum, menu) => sum + (menu.items?.length || 0),
      0
    )
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
    '/admin/settings': 'Settings',
    '/admin/users': 'Users',
    '/admin/design': 'Design Settings',
    '/admin/plugins': 'Plugins'
  }
  activePluginMenus.value.forEach(menu => {
    titles[menu.path] = menu.label
  })
  
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
    <Sidebar />

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
          <RouterView :key="$route.fullPath" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
