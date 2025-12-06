<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-6">Brand Colors</h3>
        <form @submit.prevent="saveDesign" class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                <div class="flex gap-2">
                  <input v-model="design.primaryColor" type="color" class="w-12 h-10 border border-gray-300 rounded cursor-pointer">
                  <input v-model="design.primaryColor" type="text" class="flex-1 px-3 py-2 border border-gray-300 rounded" placeholder="#FF6B35">
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                <div class="flex gap-2">
                  <input v-model="design.secondaryColor" type="color" class="w-12 h-10 border border-gray-300 rounded cursor-pointer">
                  <input v-model="design.secondaryColor" type="text" class="flex-1 px-3 py-2 border border-gray-300 rounded" placeholder="#004E89">
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                <div class="flex gap-2">
                  <input v-model="design.accentColor" type="color" class="w-12 h-10 border border-gray-300 rounded cursor-pointer">
                  <input v-model="design.accentColor" type="text" class="flex-1 px-3 py-2 border border-gray-300 rounded" placeholder="#1B998B">
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Dark Background</label>
                <div class="flex gap-2">
                  <input v-model="design.darkBg" type="color" class="w-12 h-10 border border-gray-300 rounded cursor-pointer">
                  <input v-model="design.darkBg" type="text" class="flex-1 px-3 py-2 border border-gray-300 rounded" placeholder="#1a1a1a">
                </div>
              </div>
            </div>

            <div class="border-t pt-6">
              <h4 class="font-semibold mb-4">Typography</h4>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Primary Font</label>
                  <input v-model="design.primaryFont" type="text" class="w-full px-3 py-2 border border-gray-300 rounded" placeholder="Arial, sans-serif">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Heading Font</label>
                  <input v-model="design.headingFont" type="text" class="w-full px-3 py-2 border border-gray-300 rounded" placeholder="Georgia, serif">
                </div>
              </div>
            </div>

            <div class="border-t pt-6">
              <h4 class="font-semibold mb-4">Layout</h4>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Site Logo URL</label>
                  <input v-model="design.logoUrl" type="url" class="w-full px-3 py-2 border border-gray-300 rounded" placeholder="https://...">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Favicon URL</label>
                  <input v-model="design.faviconUrl" type="url" class="w-full px-3 py-2 border border-gray-300 rounded" placeholder="https://...">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Site Wide Padding (px)</label>
                  <input v-model.number="design.padding" type="number" class="w-full px-3 py-2 border border-gray-300 rounded" placeholder="16">
                </div>
              </div>
            </div>

            <div class="flex gap-3 pt-6 border-t">
              <button type="submit" class="bg-rd-orange text-white px-6 py-2 rounded hover:bg-rd-orange-light transition">
                Save Design Settings
              </button>
              <button v-if="saved" type="button" disabled class="bg-green-600 text-white px-6 py-2 rounded">
                ✓ Saved
              </button>
            </div>
          </form>
        </div>
    </div>

    <div>
      <div class="bg-white rounded-lg shadow-md p-6">
        <h4 class="font-semibold mb-4">Preview</h4>
        <div class="space-y-3">
            <div>
              <p class="text-xs text-gray-500 mb-2">Primary Color</p>
              <div class="w-full h-12 rounded border border-gray-300" :style="{ backgroundColor: design.primaryColor }"></div>
              <p class="text-xs text-gray-600 mt-1">{{ design.primaryColor }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-2">Secondary Color</p>
              <div class="w-full h-12 rounded border border-gray-300" :style="{ backgroundColor: design.secondaryColor }"></div>
              <p class="text-xs text-gray-600 mt-1">{{ design.secondaryColor }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-2">Accent Color</p>
              <div class="w-full h-12 rounded border border-gray-300" :style="{ backgroundColor: design.accentColor }"></div>
              <p class="text-xs text-gray-600 mt-1">{{ design.accentColor }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-2">Dark Background</p>
              <div class="w-full h-12 rounded border border-gray-300" :style="{ backgroundColor: design.darkBg }"></div>
              <p class="text-xs text-gray-600 mt-1">{{ design.darkBg }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const design = ref({
  primaryColor: '#FF6B35',
  secondaryColor: '#004E89',
  accentColor: '#1B998B',
  darkBg: '#1a1a1a',
  primaryFont: 'Arial, sans-serif',
  headingFont: 'Georgia, serif',
  logoUrl: '',
  faviconUrl: '',
  padding: 16
})

const saved = ref(false)

onMounted(async () => {
  await fetchDesign()
})

async function fetchDesign() {
  try {
    const response = await axios.get('http://localhost:3001/api/design')
    if (response.data) {
      design.value = {
        ...design.value,
        ...response.data
      }
    }
  } catch (error) {
    console.error('Failed to fetch design settings:', error)
  }
}

async function saveDesign() {
  try {
    await axios.post('http://localhost:3001/api/design', design.value)
    saved.value = true
    setTimeout(() => {
      saved.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to save design settings:', error)
    alert('Failed to save: ' + (error.response?.data?.error || error.message))
  }
}
</script>
