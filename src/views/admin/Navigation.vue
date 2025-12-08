<script setup>
import { ref, onMounted } from 'vue'
import { useContentStore } from '../../stores/content'

const contentStore = useContentStore()
const navItems = ref([])
const pages = ref([])

onMounted(async () => {
  await contentStore.fetchPages()
  await contentStore.fetchNavigation()
  pages.value = contentStore.pages

  if (contentStore.navigation.length > 0) {
    navItems.value = contentStore.navigation.map(item => ({
      ...item,
      linkType: item.page_id ? 'page' : 'custom'
    }))
  } else {
    navItems.value = [{ label: '', url: '', page_id: null, linkType: 'custom' }]
  }
})

function addNavItem() {
  navItems.value.push({ label: '', url: '', page_id: null, linkType: 'custom' })
}

function removeNavItem(index) {
  navItems.value.splice(index, 1)
}

async function saveNavigation() {
  try {
    const itemsToSave = navItems.value.map(item => {
      if (item.linkType === 'page' && item.page_id) {
        const selectedPage = pages.value.find(p => p.id === item.page_id)
        return {
          label: item.label,
          url: selectedPage ? `/${selectedPage.slug}` : '',
          page_id: item.page_id
        }
      } else {
        return {
          label: item.label,
          url: item.url,
          page_id: null
        }
      }
    })
    await contentStore.updateNavigation(itemsToSave)
    alert('Navigation saved successfully!')
  } catch (error) {
    alert('Error saving navigation: ' + error.message)
  }
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <h3 class="text-lg font-semibold mb-4">Main Navigation</h3>
    <p class="text-gray-600 text-sm mb-6">Manage your site navigation menu items. Link to existing pages or add custom URLs.</p>

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
        <button @click="removeNavItem(index)" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
          Remove
        </button>
      </div>
    </div>

    <button @click="addNavItem" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-6">
      + Add Item
    </button>

    <div class="flex gap-4">
      <button @click="saveNavigation" class="bg-rd-orange text-white px-6 py-2 rounded hover:bg-rd-orange-light transition">
        Save Navigation
      </button>
    </div>
  </div>
</template>
