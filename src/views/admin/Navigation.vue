<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <h3 class="text-lg font-semibold mb-4">Main Navigation</h3>
    <p class="text-gray-600 text-sm mb-6">Manage your site navigation menu items</p>

    <div class="space-y-4 mb-6">
      <div v-for="(item, index) in navItems" :key="index" class="flex gap-4 items-end">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-900 mb-1">Label</label>
          <input v-model="item.label" type="text" class="w-full px-4 py-2 border rounded" placeholder="Menu item label">
        </div>
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-900 mb-1">URL/Slug</label>
          <input v-model="item.url" type="text" class="w-full px-4 py-2 border rounded" placeholder="/page or /blog">
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

<script setup>
import { ref, onMounted } from 'vue'
import { useContentStore } from '../../stores/content'

const contentStore = useContentStore()
const navItems = ref([])

onMounted(async () => {
  await contentStore.fetchNavigation()
  navItems.value = contentStore.navigation.length > 0 ? contentStore.navigation : [{ label: '', url: '' }]
})

function addNavItem() {
  navItems.value.push({ label: '', url: '' })
}

function removeNavItem(index) {
  navItems.value.splice(index, 1)
}

async function saveNavigation() {
  try {
    await contentStore.updateNavigation(navItems.value)
    alert('Navigation saved successfully!')
  } catch (error) {
    alert('Error saving navigation: ' + error.message)
  }
}
</script>
