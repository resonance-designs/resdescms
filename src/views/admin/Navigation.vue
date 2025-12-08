<script setup>
import { ref, onMounted } from 'vue'
import { useContentStore } from '../../stores/content'

const contentStore = useContentStore()
const navItems = ref([])
const menus = ref([])
const pages = ref([])
const selectedMenuId = ref(null)
const newMenuName = ref('')

onMounted(async () => {
  await contentStore.fetchPages()
  pages.value = contentStore.pages
  await loadMenus()
})

async function loadMenus(targetMenuId = null) {
  await contentStore.fetchNavigationMenus()
  menus.value = contentStore.navigationMenus
  const defaultMenu = menus.value.find(m => m.is_default) || menus.value[0]
  selectedMenuId.value = targetMenuId || defaultMenu?.id || null
  hydrateItems()
}

function hydrateItems() {
  const currentMenu = menus.value.find(m => m.id === selectedMenuId.value)
  if (currentMenu) {
    navItems.value = (currentMenu.items || []).map(item => ({
      ...item,
      linkType: item.page_id ? 'page' : 'custom',
      target: item.target || '_self'
    }))
    if (!navItems.value.length) {
      navItems.value = [{ label: '', url: '', page_id: null, linkType: 'custom', target: '_self' }]
    }
  } else {
    navItems.value = [{ label: '', url: '', page_id: null, linkType: 'custom', target: '_self' }]
  }
}

async function addMenu() {
  const name = newMenuName.value.trim()
  if (!name) return
  const created = await contentStore.createNavigationMenu({ name })
  newMenuName.value = ''
  await loadMenus(created?.id)
}

function selectMenu(menuId) {
  selectedMenuId.value = menuId
  hydrateItems()
}

function addNavItem() {
  navItems.value.push({ label: '', url: '', page_id: null, linkType: 'custom', target: '_self' })
}

function removeNavItem(index) {
  navItems.value.splice(index, 1)
}

async function saveNavigation() {
  if (!selectedMenuId.value) return
  try {
    const itemsToSave = navItems.value.map(item => {
      if (item.linkType === 'page' && item.page_id) {
        const selectedPage = pages.value.find(p => p.id === item.page_id)
        return {
          label: item.label,
          url: selectedPage ? `/page/${selectedPage.slug}` : '',
          page_id: item.page_id,
          target: item.target || '_self'
        }
      } else {
        return {
          label: item.label,
          url: item.url,
          page_id: null,
          target: item.target || '_self'
        }
      }
    })
    await contentStore.updateNavigationItems(selectedMenuId.value, itemsToSave)
    await loadMenus(selectedMenuId.value)
    alert('Menu saved successfully!')
  } catch (error) {
    alert('Error saving navigation: ' + error.message)
  }
}

async function markDefault(menuId) {
  await contentStore.updateNavigationMenu(menuId, { is_default: true })
  await loadMenus(menuId)
}

async function deleteMenu(menuId) {
  const menu = menus.value.find(m => m.id === menuId)
  if (menu?.is_default) {
    alert('Default menu cannot be deleted.')
    return
  }
  if (!confirm('Delete this menu?')) return
  await contentStore.deleteNavigationMenu(menuId)
  await loadMenus()
  if (selectedMenuId.value === menuId) {
    hydrateItems()
  }
}

function menuLabel(menu) {
  if (!menu) return ''
  return `${menu.name}${menu.is_default ? ' (Default)' : ''}`
}

const currentMenu = () => menus.value.find(m => m.id === selectedMenuId.value)
</script>

<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <h3 class="text-lg font-semibold mb-4">Navigation Menus</h3>
    <p class="text-gray-600 text-sm mb-6">Create multiple menus, set a default, and manage items per menu.</p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div
        v-for="menu in menus"
        :key="menu.id"
        class="border rounded p-4 bg-gray-50"
        :class="selectedMenuId === menu.id ? 'border-rd-orange' : 'border-gray-200'"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="font-semibold text-gray-900">{{ menu.name }}</p>
            <p class="text-xs text-gray-500">Slug: {{ menu.slug }}</p>
          </div>
          <span v-if="menu.is_default" class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Default</span>
        </div>
        <div class="flex gap-2 mt-4">
          <button class="px-3 py-2 bg-white border rounded text-sm" @click="selectMenu(menu.id)">
            Edit
          </button>
          <button
            class="px-3 py-2 bg-white border rounded text-sm"
            :class="menu.is_default ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-gray-700 hover:border-gray-400'"
            :disabled="menu.is_default"
            @click="markDefault(menu.id)"
          >
            Make Default
          </button>
          <button
            class="px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded text-sm"
            @click="deleteMenu(menu.id)"
          >
            Delete
          </button>
        </div>
      </div>

      <div class="border-2 border-dashed border-gray-300 rounded p-4 bg-white flex flex-col gap-3">
        <p class="font-semibold text-gray-800">Add Menu</p>
        <input v-model="newMenuName" type="text" class="w-full px-3 py-2 border rounded" placeholder="e.g., Footer Links">
        <button class="bg-rd-orange text-white px-4 py-2 rounded hover:bg-rd-orange-light" @click="addMenu">
          Create Menu
        </button>
      </div>
    </div>

    <div v-if="!selectedMenuId" class="text-gray-500 text-sm">Select or create a menu to begin.</div>

    <div v-else>
      <div class="flex items-center justify-between mb-4">
        <div>
          <h4 class="text-md font-semibold text-gray-900">Editing {{ menuLabel(currentMenu()) }}</h4>
          <p class="text-sm text-gray-600">Link to existing pages or add custom URLs.</p>
        </div>
        <button @click="addNavItem" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Add Item
        </button>
      </div>

      <div class="space-y-4 mb-6">
        <div v-for="(item, index) in navItems" :key="index" class="flex gap-4 items-end p-4 border rounded bg-gray-50">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-900 mb-1">Label</label>
            <input v-model="item.label" type="text" class="w-full px-4 py-2 border rounded" placeholder="Menu item label">
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-900 mb-1">Link Type</label>
            <select v-model="item.linkType" class="w-full px-4 py-2 border rounded">
              <option value="custom">Custom URL</option>
              <option value="page">Link to Page</option>
            </select>
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-900 mb-1">{{ item.linkType === 'page' ? 'Select Page' : 'URL/Slug' }}</label>
            <select v-if="item.linkType === 'page'" v-model="item.page_id" class="w-full px-4 py-2 border rounded">
              <option :value="null">Choose a page...</option>
              <option v-for="page in pages" :key="page.id" :value="page.id">{{ page.title }}</option>
            </select>
            <input v-else v-model="item.url" type="text" class="w-full px-4 py-2 border rounded" placeholder="/page or /blog">
          </div>
          <div class="w-40">
            <label class="block text-sm font-medium text-gray-900 mb-1">Target</label>
            <select v-model="item.target" class="w-full px-4 py-2 border rounded">
              <option value="_self">Same Tab</option>
              <option value="_blank">New Tab</option>
            </select>
          </div>
          <button @click="removeNavItem(index)" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            Remove
          </button>
        </div>
      </div>

      <div class="flex gap-4">
        <button @click="saveNavigation" class="bg-rd-orange text-white px-6 py-2 rounded hover:bg-rd-orange-light transition">
          Save Menu
        </button>
      </div>
    </div>
  </div>
</template>
