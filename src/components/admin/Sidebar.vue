<script setup>
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

function isActive(path) {
  return route.path.startsWith(path)
}

function handleLogout() {
  authStore.logout()
  router.push({ name: 'admin-login' })
}
</script>

<template>
  <div class="w-64 bg-gray-900 text-white p-6">
    <div class="mb-8">
      <h1 class="text-2xl font-avant-garde-demi">ResDesCMS</h1>
      <p class="text-sm text-gray-400">Admin</p>
    </div>

    <nav class="space-y-2">
      <RouterLink to="/admin" class="block px-4 py-2 rounded hover:bg-gray-800 transition" :class="{ 'bg-rd-orange': isActive('/admin') }">
        Dashboard
      </RouterLink>
      <RouterLink to="/admin/posts" class="block px-4 py-2 rounded hover:bg-gray-800 transition" :class="{ 'bg-rd-orange': isActive('/admin/posts') }">
        Posts
      </RouterLink>
      <RouterLink to="/admin/pages" class="block px-4 py-2 rounded hover:bg-gray-800 transition" :class="{ 'bg-rd-orange': isActive('/admin/pages') }">
        Pages
      </RouterLink>
      <RouterLink to="/admin/categories" class="block px-4 py-2 rounded hover:bg-gray-800 transition" :class="{ 'bg-rd-orange': isActive('/admin/categories') }">
        Categories
      </RouterLink>
      <RouterLink to="/admin/media" class="block px-4 py-2 rounded hover:bg-gray-800 transition" :class="{ 'bg-rd-orange': isActive('/admin/media') }">
        Media
      </RouterLink>
      <RouterLink to="/admin/navigation" class="block px-4 py-2 rounded hover:bg-gray-800 transition" :class="{ 'bg-rd-orange': isActive('/admin/navigation') }">
        Navigation
      </RouterLink>
      <RouterLink to="/admin/settings" class="block px-4 py-2 rounded hover:bg-gray-800 transition" :class="{ 'bg-rd-orange': isActive('/admin/settings') }">
        Settings
      </RouterLink>
      <RouterLink to="/admin/users" class="block px-4 py-2 rounded hover:bg-gray-800 transition" :class="{ 'bg-rd-orange': isActive('/admin/users') }">
        Users
      </RouterLink>
      <RouterLink to="/admin/design" class="block px-4 py-2 rounded hover:bg-gray-800 transition" :class="{ 'bg-rd-orange': isActive('/admin/design') }">
        Design
      </RouterLink>
    </nav>

    <div class="mt-12 pt-6 border-t border-gray-700">
      <RouterLink to="/" class="block px-4 py-2 text-sm text-gray-400 hover:text-white transition mb-4">
        View Site
      </RouterLink>
      <button @click="handleLogout" class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition text-sm">
        Logout
      </button>
    </div>
  </div>
</template>
