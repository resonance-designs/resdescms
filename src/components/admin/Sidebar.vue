<script setup>
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { computed, onMounted, ref } from 'vue'
import {
  IconLayoutDashboard,
  IconMenu2,
  IconArticle,
  IconFileText,
  IconTags,
  IconPhoto,
  IconBrowser,
  IconPalette,
  IconSettings,
  IconUsers,
  IconPlug,
  IconExternalLink,
  IconLogout
} from '@tabler/icons-vue'
import { useAuthStore } from '../../stores/auth'
import { usePluginStore } from '../../stores/plugins'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const pluginStore = usePluginStore()

const open = ref({ content: false, site: false })
const contentPaths = ['/admin/posts', '/admin/pages', '/admin/categories', '/admin/media']
const sitePaths = ['/admin/settings', '/admin/users', '/admin/plugins']

const pluginMenus = computed(() => {
  const seen = new Set()
  const items = []
  pluginStore.activePlugins().forEach(plugin => {
    (plugin.manifest?.adminMenu || []).forEach(menu => {
      if (menu?.path && !seen.has(menu.path)) {
        seen.add(menu.path)
        items.push({ ...menu, label: menu.label || plugin.name })
      }
    })
  })
  return items
})

function isActive(path) {
  if (path === '/admin') return route.path === '/admin'
  return route.path.startsWith(path)
}

function isSectionActive(paths) {
  return paths.some(p => isActive(p))
}

function handleNavClick(path) {
  if (contentPaths.includes(path)) {
    open.value = { content: true, site: false }
  } else if (sitePaths.includes(path)) {
    open.value = { content: false, site: true }
  } else {
    open.value = { content: false, site: false }
  }
}

function handleLogout() {
  authStore.logout()
  router.push({ name: 'admin-login' })
}

onMounted(() => {
  if (!pluginStore.plugins.length) {
    pluginStore.fetchPlugins()
  }
})
</script>

<template>
  <div class="w-64 bg-gray-900 text-white p-6">
    <div class="mb-8">
      <div class="flex items-center gap-2">
        <img src="/img/icon.png" alt="ResDesCMS" class="w-12 h-12 rounded" />
        <div>
          <h1 class="text-2xl font-avant-garde-demi">ResDesCMS</h1>
          <p class="text-sm text-gray-400 leading-tight">Admin</p>
        </div>
      </div>
    </div>

    <nav class="flex flex-col">
      <RouterLink
        to="/admin"
        class="block font-semibold px-4 py-2 rounded hover:bg-gray-800 transition mb-2 cursor-pointer"
        :class="{ 'bg-rd-orange': isActive('/admin') }"
        @click="handleNavClick('/admin')"
      >
        <span class="flex items-center gap-2">
          <IconLayoutDashboard :size="18" />
          <span>Dashboard</span>
        </span>
      </RouterLink>

      <button
        class="w-full text-left px-4 py-2 font-semibold hover:bg-gray-800 rounded transition flex items-center justify-between cursor-pointer"
        :class="[isSectionActive(contentPaths) ? 'bg-rd-orange text-white' : '', open.content ? 'mb-0' : 'mb-2']"
        @click="open.content = !open.content"
      >
        <span class="flex items-center gap-2">
          <IconMenu2 :size="18" />
          <span>Content</span>
        </span>
        <span class="text-xs">{{ open.content ? '▾' : '▸' }}</span>
      </button>
      <div v-if="open.content" class="pb-2">
        <RouterLink
          to="/admin/posts"
          class="block px-4 py-2 text-sm bg-gray-800/50 hover:bg-gray-800 transition mx-2 cursor-pointer"
          :class="{ 'bg-rd-orange': isActive('/admin/posts') }"
          @click="handleNavClick('/admin/posts')"
        >
          <span class="flex items-center gap-2">
            <IconArticle :size="16" />
            <span>Posts</span>
          </span>
        </RouterLink>
        <RouterLink
          to="/admin/pages"
          class="block px-4 py-2 text-sm bg-gray-800/50 hover:bg-gray-800 transition mx-2 cursor-pointer"
          :class="{ 'bg-rd-orange': isActive('/admin/pages') }"
          @click="handleNavClick('/admin/pages')"
        >
          <span class="flex items-center gap-2">
            <IconFileText :size="16" />
            <span>Pages</span>
          </span>
        </RouterLink>
        <RouterLink
          to="/admin/categories"
          class="block px-4 py-2 text-sm bg-gray-800/50 hover:bg-gray-800 transition mx-2 cursor-pointer"
          :class="{ 'bg-rd-orange': isActive('/admin/categories') }"
          @click="handleNavClick('/admin/categories')"
        >
          <span class="flex items-center gap-2">
            <IconTags :size="16" />
            <span>Categories</span>
          </span>
        </RouterLink>
        <RouterLink
          to="/admin/media"
          class="block px-4 py-2 text-sm bg-gray-800/50 hover:bg-gray-800 transition mx-2 rounded-b cursor-pointer"
          :class="{ 'bg-rd-orange': isActive('/admin/media') }"
          @click="handleNavClick('/admin/media')"
        >
          <span class="flex items-center gap-2">
            <IconPhoto :size="16" />
            <span>Media</span>
          </span>
        </RouterLink>
      </div>

      <RouterLink
        to="/admin/design"
        class="block font-semibold px-4 py-2 rounded hover:bg-gray-800 transition mb-2 cursor-pointer"
        :class="{ 'bg-rd-orange': isActive('/admin/design') }"
        @click="handleNavClick('/admin/design')"
      >
        <span class="flex items-center gap-2">
          <IconPalette :size="18" />
          <span>Design</span>
        </span>
      </RouterLink>

      <button
        class="w-full text-left px-4 py-2 font-semibold hover:bg-gray-800 rounded transition flex items-center justify-between cursor-pointer"
        :class="[isSectionActive(sitePaths) ? 'bg-rd-orange text-white' : '', open.site ? 'mb-0' : 'mb-2']"
        @click="open.site = !open.site"
      >
        <span class="flex items-center gap-2">
          <IconBrowser :size="18" />
          <span>Site</span>
        </span>
        <span class="text-xs">{{ open.site ? '▾' : '▸' }}</span>
      </button>
      <div v-if="open.site" class="pb-2">
        <RouterLink
          to="/admin/settings"
          class="block px-4 py-2 text-sm bg-gray-800/50 hover:bg-gray-800 transition mx-2 cursor-pointer"
          :class="{ 'bg-rd-orange': isActive('/admin/settings') }"
          @click="handleNavClick('/admin/settings')"
        >
          <span class="flex items-center gap-2">
            <IconSettings :size="16" />
            <span>Settings</span>
          </span>
        </RouterLink>
        <RouterLink
          to="/admin/users"
          class="block px-4 py-2 text-sm bg-gray-800/50 hover:bg-gray-800 transition mx-2 cursor-pointer"
          :class="{ 'bg-rd-orange': isActive('/admin/users') }"
          @click="handleNavClick('/admin/users')"
        >
          <span class="flex items-center gap-2">
            <IconUsers :size="16" />
            <span>Users</span>
          </span>
        </RouterLink>
        <RouterLink
          to="/admin/plugins"
          class="block px-4 py-2 text-sm bg-gray-800/50 hover:bg-gray-800 transition mx-2 rounded-b cursor-pointer"
          :class="{ 'bg-rd-orange': isActive('/admin/plugins') }"
          @click="handleNavClick('/admin/plugins')"
        >
          <span class="flex items-center gap-2">
            <IconPlug :size="16" />
            <span>Plugins</span>
          </span>
        </RouterLink>
      </div>

      <div class="border-t border-gray-800 pt-2">
        <RouterLink
          v-for="menu in pluginMenus"
          :key="menu.path"
          :to="menu.path"
          class="block font-semibold px-4 py-2 rounded hover:bg-gray-800 transition text-sm mb-2 cursor-pointer"
          :class="{ 'bg-rd-orange': isActive(menu.path) }"
          @click="handleNavClick(menu.path)"
        >
          <span class="flex items-center gap-2">
            <IconPlug :size="16" />
            <span>{{ menu.label }}</span>
          </span>
        </RouterLink>
      </div>
    </nav>

    <div class="mt-12 pt-6 border-t border-gray-700">
      <RouterLink to="/" class="block px-4 py-2 text-sm text-gray-400 hover:text-white transition mb-4 cursor-pointer" target="_blank" rel="noopener">
        <span class="flex items-center gap-2">
          <span>View Site</span>
          <IconExternalLink :size="16" />
        </span>
      </RouterLink>
      <button @click="handleLogout" class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition text-sm cursor-pointer flex items-center gap-2 justify-center">
        <span>Logout</span>
        <IconLogout :size="16" />
      </button>
    </div>
  </div>
</template>
