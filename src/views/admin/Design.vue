<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import { useThemeStore } from '../../stores/theme'
import { useContentStore } from '../../stores/content'
import PageBuilder from '../../components/admin/PageBuilder.vue'

const themeStore = useThemeStore()
const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

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
const activeTab = ref('general')
const themeSettingsDraft = ref({})
const themeFile = ref(null)
const installingTheme = ref(false)
const themeMessage = ref('')
const mediaModal = ref({ open: false, target: null, mode: 'single' })
const mediaSelection = ref(null)
const contentStore = useContentStore()
const fontSelection = ref(null)

function resolveMediaUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('//')) return window.location.protocol + url
  return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`
}

const activeTheme = computed(() => themeStore.activeTheme)
const themeSubTab = ref('management')
const managementFields = computed(() =>
  (activeTheme.value?.settingsSchema || []).filter(field =>
    [
      'primaryColor',
      'accentColor',
      'textColor',
      'backgroundColor',
      'maxWidth',
      'containerPaddingTop',
      'containerPaddingRight',
      'containerPaddingBottom',
      'containerPaddingLeft',
      'containerMarginTop',
      'containerMarginRight',
      'containerMarginBottom',
      'containerMarginLeft'
    ].includes(field.key)
  )
)

watch(
  () => themeStore.activeTheme,
  (theme) => {
    themeSettingsDraft.value = {
      showHeader: true,
      showFooter: true,
      showSidebar: true,
      sidebarPlacement: 'right',
      headerLayout: { cols: 4, rows: 2, gap: 16, blocks: [] },
      footerLayout: { cols: 4, rows: 2, gap: 16, blocks: [] },
      maxWidth: 1200,
      containerPaddingTop: 0,
      containerPaddingRight: 0,
      containerPaddingBottom: 0,
      containerPaddingLeft: 0,
      containerMarginTop: 0,
      containerMarginRight: 0,
      containerMarginBottom: 0,
      containerMarginLeft: 0,
      headerPaddingTop: 16,
      headerPaddingRight: 16,
      headerPaddingBottom: 16,
      headerPaddingLeft: 16,
      headerMarginTop: 0,
      headerMarginRight: 0,
      headerMarginBottom: 0,
      headerMarginLeft: 0,
      bodyPaddingTop: 32,
      bodyPaddingRight: 32,
      bodyPaddingBottom: 32,
      bodyPaddingLeft: 32,
      bodyMarginTop: 0,
      bodyMarginRight: 0,
      bodyMarginBottom: 0,
      bodyMarginLeft: 0,
      footerPaddingTop: 16,
      footerPaddingRight: 16,
      footerPaddingBottom: 16,
      footerPaddingLeft: 16,
      footerMarginTop: 0,
      footerMarginRight: 0,
      footerMarginBottom: 0,
      footerMarginLeft: 0,
      sidebarPaddingTop: 16,
      sidebarPaddingRight: 16,
      sidebarPaddingBottom: 16,
      sidebarPaddingLeft: 16,
      sidebarMarginTop: 0,
      sidebarMarginRight: 0,
      sidebarMarginBottom: 0,
      sidebarMarginLeft: 0,
      headerBorderSize: '0',
      headerBorderStyle: 'solid',
      headerBorderColor: '#e5e7eb',
      headerBorderRadiusTopLeft: '0',
      headerBorderRadiusTopRight: '0',
      headerBorderRadiusBottomRight: '0',
      headerBorderRadiusBottomLeft: '0',
      bodyBorderSize: '0',
      bodyBorderStyle: 'solid',
      bodyBorderColor: '#e5e7eb',
      bodyBorderRadiusTopLeft: '0',
      bodyBorderRadiusTopRight: '0',
      bodyBorderRadiusBottomRight: '0',
      bodyBorderRadiusBottomLeft: '0',
      footerBorderSize: '0',
      footerBorderStyle: 'solid',
      footerBorderColor: '#e5e7eb',
      footerBorderRadiusTopLeft: '0',
      footerBorderRadiusTopRight: '0',
      footerBorderRadiusBottomRight: '0',
      footerBorderRadiusBottomLeft: '0',
      sidebarBorderSize: '0',
      sidebarBorderStyle: 'solid',
      sidebarBorderColor: '#e5e7eb',
      sidebarBorderRadiusTopLeft: '0',
      sidebarBorderRadiusTopRight: '0',
      sidebarBorderRadiusBottomRight: '0',
      sidebarBorderRadiusBottomLeft: '0',
      ...(theme?.settings || {})
    }
  },
  { immediate: true }
)

onMounted(async () => {
  await fetchDesign()
  await themeStore.bootstrap()
  if (!contentStore.media.length) {
    contentStore.fetchMedia()
  }
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

function openMediaModal(target) {
  mediaSelection.value = null
  mediaModal.value = { open: true, target, mode: 'single' }
  if (!contentStore.media.length) {
    contentStore.fetchMedia()
  }
}

function closeMediaModal() {
  mediaModal.value.open = false
  mediaModal.value.target = null
}

async function onUploadMedia(evt) {
  const file = evt.target.files?.[0]
  if (!file) return
  await contentStore.uploadMedia(file)
  await contentStore.fetchMedia()
}

function selectMedia(id) {
  mediaSelection.value = id
}

function applyMediaSelection() {
  if (!mediaSelection.value || !mediaModal.value.target) {
    closeMediaModal()
    return
  }
  const file = contentStore.media.find(m => m.id === mediaSelection.value)
  if (file) {
    design.value[mediaModal.value.target] = file.url
  }
  closeMediaModal()
}

const fontOptions = computed(() => {
  const builtIns = [
    'AvantGarde-Bk',
    'AvantGarde-Demi',
    'AvantGarde-Md',
    'Arial, sans-serif',
    'Georgia, serif'
  ]
  const uploadedFonts = contentStore.media
    .filter(m => m.mime_type?.includes('font') || m.filename?.match(/\.(ttf|otf|woff2?|eot)$/i))
    .map(m => m.filename || m.url)
  return [...new Set([...builtIns, ...uploadedFonts])]
})

async function onUploadFont(evt) {
  const file = evt.target.files?.[0]
  if (!file) return
  await contentStore.uploadMedia(file)
  await contentStore.fetchMedia()
  fontSelection.value = file.name
}

async function uploadTheme() {
  if (!themeFile.value) {
    themeMessage.value = 'Choose a .zip file to install'
    return
  }
  installingTheme.value = true
  themeMessage.value = ''
  try {
    const installed = await themeStore.installTheme(themeFile.value)
    themeMessage.value = `Installed ${installed?.name || installed?.slug}`
    await themeStore.activateTheme(installed.slug)
    themeFile.value = null
  } catch (error) {
    console.error('Theme install failed', error)
    themeMessage.value = error.response?.data?.error || error.message
  } finally {
    installingTheme.value = false
  }
}

async function activateTheme(slug) {
  await themeStore.activateTheme(slug)
}

async function saveThemeSettings() {
  if (!activeTheme.value) return
  try {
    await themeStore.saveSettings(activeTheme.value.slug, themeSettingsDraft.value)
    themeMessage.value = 'Theme settings saved'
    setTimeout(() => (themeMessage.value = ''), 2000)
  } catch (error) {
    console.error('Failed to save theme settings', error)
    themeMessage.value = error.response?.data?.error || error.message
  }
}

function updateThemeSetting(key, value) {
  themeSettingsDraft.value = { ...themeSettingsDraft.value, [key]: value }
}
</script>

<template>
  <div>
    <div class="flex gap-4 mb-6">
      <button
        class="px-4 py-2 rounded"
        :class="activeTab === 'general' ? 'bg-rd-orange text-white' : 'bg-gray-200 text-gray-700'"
        @click="activeTab = 'general'"
      >
        General
      </button>
      <button
        class="px-4 py-2 rounded"
        :class="activeTab === 'theme' ? 'bg-rd-orange text-white' : 'bg-gray-200 text-gray-700'"
        @click="activeTab = 'theme'"
      >
        Theme
      </button>
    </div>

    <div v-if="activeTab === 'general'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  <select v-model="design.primaryFont" class="w-full px-3 py-2 border border-gray-300 rounded">
                    <option v-for="font in fontOptions" :key="font" :value="font">{{ font }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Heading Font</label>
                  <select v-model="design.headingFont" class="w-full px-3 py-2 border border-gray-300 rounded">
                    <option v-for="font in fontOptions" :key="font" :value="font">{{ font }}</option>
                  </select>
                </div>
                <div class="flex items-center gap-3">
                  <label class="px-4 py-2 bg-gray-800 text-white rounded cursor-pointer">
                    Upload Font
                    <input type="file" class="hidden" @change="onUploadFont" accept=".ttf,.otf,.woff,.woff2,.eot">
                  </label>
                  <p class="text-xs text-gray-500">Upload font files to add them to the dropdown.</p>
                </div>
              </div>
            </div>

            <div class="border-t pt-6">
              <h4 class="font-semibold mb-4">Layout</h4>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Site Logo</label>
                  <div class="flex gap-2">
                    <input v-model="design.logoUrl" type="url" class="w-full px-3 py-2 border border-gray-300 rounded" placeholder="https://...">
                    <button type="button" class="px-3 py-2 bg-gray-800 text-white rounded" @click="openMediaModal('logoUrl')">Library</button>
                    <label class="px-3 py-2 bg-rd-orange text-white rounded cursor-pointer">
                      Upload
                      <input type="file" class="hidden" @change="onUploadMedia">
                    </label>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">Pick from media library or upload.</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Favicon</label>
                  <div class="flex gap-2">
                    <input v-model="design.faviconUrl" type="url" class="w-full px-3 py-2 border border-gray-300 rounded" placeholder="https://...">
                    <button type="button" class="px-3 py-2 bg-gray-800 text-white rounded" @click="openMediaModal('faviconUrl')">Library</button>
                    <label class="px-3 py-2 bg-rd-orange text-white rounded cursor-pointer">
                      Upload
                      <input type="file" class="hidden" @change="onUploadMedia">
                    </label>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">Pick from media library or upload.</p>
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
                Saved
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

    <div v-else class="space-y-6">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold mb-4">Install Theme</h3>
        <div class="flex flex-col md:flex-row md:items-center gap-3">
          <input
            type="file"
            accept=".zip"
            class="w-full md:w-auto"
            @change="themeFile = $event.target.files?.[0] || null"
          >
          <button
            class="bg-rd-orange text-white px-6 py-2 rounded hover:bg-rd-orange-light transition disabled:opacity-50"
            :disabled="installingTheme"
            @click="uploadTheme"
          >
            {{ installingTheme ? 'Installing...' : 'Upload Theme Zip' }}
          </button>
          <p class="text-sm text-gray-600" v-if="themeMessage">{{ themeMessage }}</p>
        </div>
        <p class="text-xs text-gray-500 mt-2">
          Upload a theme zip containing <code>functions.js</code> or <code>theme.json</code> plus its assets.
        </p>
      </div>

      <div class="bg-white rounded-lg shadow-md p-4">
        <div class="flex gap-3 border-b pb-3 mb-4">
          <button
            v-for="tab in ['management','header','body','footer','sidebar']"
            :key="tab"
            class="px-3 py-2 rounded text-sm"
            :class="themeSubTab === tab ? 'bg-rd-orange text-white' : 'bg-gray-100 text-gray-700'"
            @click="themeSubTab = tab"
          >
            {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
          </button>
        </div>

        <div v-if="themeSubTab === 'management'" class="space-y-4">
          <div
            v-for="theme in themeStore.themes"
            :key="theme.slug"
            class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex justify-between items-center"
          >
            <div>
              <p class="text-sm text-gray-500">{{ theme.author }} — v{{ theme.version || '1.0.0' }}</p>
              <h4 class="text-lg font-semibold">{{ theme.name }}</h4>
              <p class="text-gray-600 text-sm">{{ theme.description }}</p>
            </div>
            <div class="flex flex-col gap-2">
              <span
                v-if="theme.isActive"
                class="inline-block bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full text-center"
              >
                Active
              </span>
              <button
                v-else
                class="bg-rd-orange text-white px-4 py-2 rounded hover:bg-rd-orange-light transition"
                @click="activateTheme(theme.slug)"
            >
              Activate
            </button>
          </div>
        </div>

          <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h4 class="text-lg font-semibold mb-3">Theme Colors & Width</h4>
            <div v-if="activeTheme">
              <p class="text-sm text-gray-600 mb-4">
                {{ activeTheme.name }} — adjust global colors and container spacing here.
              </p>

              <div class="space-y-6">
                <div v-if="managementFields.length" class="space-y-4">
                  <div v-for="field in managementFields.slice(0,4)" :key="field.key" class="space-y-1">
                    <label class="block text-sm font-medium text-gray-700">{{ field.label }}</label>
                    <input
                      class="w-full border border-gray-300 rounded px-3 py-2"
                      :type="field.type || 'text'"
                      :value="themeSettingsDraft[field.key]"
                      @input="updateThemeSetting(field.key, $event.target.value)"
                    >
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Content Max Width (px)</label>
                    <input
                      type="text"
                      class="w-full border border-gray-300 rounded px-3 py-2"
                      v-model="themeSettingsDraft.maxWidth"
                      placeholder="e.g. 1200 or 1200px"
                    >
                  </div>
                </div>

                <div class="space-y-3">
                  <h5 class="text-sm font-semibold">Container Padding</h5>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label class="text-xs text-gray-700">Top (px)</label>
                    <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.containerPaddingTop" placeholder="e.g. 0, 16px, inherit">
                  </div>
                  <div>
                    <label class="text-xs text-gray-700">Right (px)</label>
                    <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.containerPaddingRight" placeholder="e.g. 0, 16px, inherit">
                  </div>
                  <div>
                    <label class="text-xs text-gray-700">Bottom (px)</label>
                    <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.containerPaddingBottom" placeholder="e.g. 0, 16px, inherit">
                  </div>
                  <div>
                    <label class="text-xs text-gray-700">Left (px)</label>
                    <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.containerPaddingLeft" placeholder="e.g. 0, 16px, inherit">
                  </div>
                  </div>
                </div>

                <div class="space-y-3">
                  <h5 class="text-sm font-semibold">Container Margin</h5>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label class="text-xs text-gray-700">Top (px)</label>
                    <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.containerMarginTop" placeholder="e.g. 0, auto, inherit">
                  </div>
                  <div>
                    <label class="text-xs text-gray-700">Right (px)</label>
                    <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.containerMarginRight" placeholder="e.g. 0, auto, inherit">
                  </div>
                  <div>
                    <label class="text-xs text-gray-700">Bottom (px)</label>
                    <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.containerMarginBottom" placeholder="e.g. 0, auto, inherit">
                  </div>
                  <div>
                    <label class="text-xs text-gray-700">Left (px)</label>
                    <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.containerMarginLeft" placeholder="e.g. 0, auto, inherit">
                  </div>
                  </div>
                </div>

                <div class="space-y-3">
                  <h5 class="text-sm font-semibold">Container Border</h5>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label class="text-xs text-gray-700">Size</label>
                      <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.containerBorderSize" placeholder="e.g. 0, 1px, inherit">
                    </div>
                    <div>
                      <label class="text-xs text-gray-700">Style</label>
                      <select class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.containerBorderStyle">
                        <option value="none">none</option>
                        <option value="solid">solid</option>
                        <option value="dashed">dashed</option>
                        <option value="dotted">dotted</option>
                        <option value="double">double</option>
                      </select>
                    </div>
                    <div>
                      <label class="text-xs text-gray-700">Color</label>
                      <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.containerBorderColor" placeholder="#e5e7eb">
                    </div>
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label class="text-xs text-gray-700">Radius TL</label>
                      <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.containerBorderRadiusTopLeft" placeholder="e.g. 0, 8px">
                    </div>
                    <div>
                      <label class="text-xs text-gray-700">Radius TR</label>
                      <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.containerBorderRadiusTopRight" placeholder="e.g. 0, 8px">
                    </div>
                    <div>
                      <label class="text-xs text-gray-700">Radius BR</label>
                      <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.containerBorderRadiusBottomRight" placeholder="e.g. 0, 8px">
                    </div>
                    <div>
                      <label class="text-xs text-gray-700">Radius BL</label>
                      <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.containerBorderRadiusBottomLeft" placeholder="e.g. 0, 8px">
                    </div>
                  </div>
                </div>
              </div>

              <button
                class="mt-4 bg-rd-orange text-white px-4 py-2 rounded hover:bg-rd-orange-light transition"
                @click="saveThemeSettings"
              >
                Save
              </button>
              <p v-if="themeMessage" class="text-xs text-gray-600 mt-2">{{ themeMessage }}</p>
            </div>
            <p v-else class="text-sm text-gray-500">Install or activate a theme to configure it.</p>
          </div>
        </div>

        <div v-else-if="themeSubTab === 'header'" class="space-y-4">
          <label class="flex items-center gap-2">
            <input type="checkbox" v-model="themeSettingsDraft.showHeader">
            <span class="text-sm text-gray-800">Show Header</span>
          </label>
          <div v-if="themeSettingsDraft.showHeader" class="bg-white border rounded p-4 space-y-4">
            <h4 class="text-md font-semibold mb-3">Header Builder</h4>
            <PageBuilder v-model="themeSettingsDraft.headerLayout" />
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label class="text-sm text-gray-700">Padding Top (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.headerPaddingTop" placeholder="e.g. 0, 16px, inherit" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Padding Right (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.headerPaddingRight" placeholder="e.g. 0, 16px, inherit" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Padding Bottom (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.headerPaddingBottom" placeholder="e.g. 0, 16px, inherit" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Padding Left (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.headerPaddingLeft" placeholder="e.g. 0, 16px, inherit" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Margin Top (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.headerMarginTop" placeholder="e.g. 0, auto, inherit" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Margin Right (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.headerMarginRight" placeholder="e.g. 0, auto, inherit" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Margin Bottom (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.headerMarginBottom" placeholder="e.g. 0, auto, inherit" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Margin Left (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.headerMarginLeft" placeholder="e.g. 0, auto, inherit" />
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label class="text-sm text-gray-700">Border Size</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.headerBorderSize" placeholder="e.g. 0, 1px, inherit" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Border Style</label>
                <select class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.headerBorderStyle">
                  <option value="none">none</option>
                  <option value="solid">solid</option>
                  <option value="dashed">dashed</option>
                  <option value="dotted">dotted</option>
                  <option value="double">double</option>
                </select>
              </div>
              <div>
                <label class="text-sm text-gray-700">Border Color</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.headerBorderColor" placeholder="#e5e7eb" />
              </div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label class="text-sm text-gray-700">Radius TL</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.headerBorderRadiusTopLeft" placeholder="e.g. 0, 8px" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Radius TR</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.headerBorderRadiusTopRight" placeholder="e.g. 0, 8px" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Radius BR</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.headerBorderRadiusBottomRight" placeholder="e.g. 0, 8px" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Radius BL</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.headerBorderRadiusBottomLeft" placeholder="e.g. 0, 8px" />
              </div>
            </div>
          </div>
          <button class="bg-rd-orange text-white px-4 py-2 rounded hover:bg-rd-orange-light transition" @click="saveThemeSettings">
            Save Header
          </button>
        </div>

        <div v-else-if="themeSubTab === 'body'" class="space-y-4">
          <p class="text-sm text-gray-700">Body is always enabled. Adjust article/container settings below.</p>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label class="text-sm text-gray-700">Padding Top (px)</label>
              <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.bodyPaddingTop" placeholder="e.g. 0, 16px, inherit">
            </div>
            <div>
              <label class="text-sm text-gray-700">Padding Right (px)</label>
              <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.bodyPaddingRight" placeholder="e.g. 0, 16px, inherit">
            </div>
            <div>
              <label class="text-sm text-gray-700">Padding Bottom (px)</label>
              <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.bodyPaddingBottom" placeholder="e.g. 0, 16px, inherit">
            </div>
            <div>
              <label class="text-sm text-gray-700">Padding Left (px)</label>
              <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.bodyPaddingLeft" placeholder="e.g. 0, 16px, inherit">
            </div>
            <div>
              <label class="text-sm text-gray-700">Margin Top (px)</label>
              <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.bodyMarginTop" placeholder="e.g. 0, auto, inherit">
            </div>
            <div>
              <label class="text-sm text-gray-700">Margin Right (px)</label>
              <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.bodyMarginRight" placeholder="e.g. 0, auto, inherit">
            </div>
            <div>
              <label class="text-sm text-gray-700">Margin Bottom (px)</label>
              <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.bodyMarginBottom" placeholder="e.g. 0, auto, inherit">
            </div>
            <div>
              <label class="text-sm text-gray-700">Margin Left (px)</label>
              <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.bodyMarginLeft" placeholder="e.g. 0, auto, inherit">
            </div>
          </div>
          <button class="bg-rd-orange text-white px-4 py-2 rounded hover:bg-rd-orange-light transition" @click="saveThemeSettings">
            Save Body Settings
          </button>
        </div>

        <div v-else-if="themeSubTab === 'footer'" class="space-y-4">
          <label class="flex items-center gap-2">
            <input type="checkbox" v-model="themeSettingsDraft.showFooter">
            <span class="text-sm text-gray-800">Show Footer</span>
          </label>
          <div v-if="themeSettingsDraft.showFooter" class="bg-white border rounded p-4 space-y-4">
            <h4 class="text-md font-semibold mb-3">Footer Builder</h4>
            <PageBuilder v-model="themeSettingsDraft.footerLayout" />
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label class="text-sm text-gray-700">Padding Top (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.footerPaddingTop" placeholder="e.g. 0, 16px, inherit" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Padding Right (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.footerPaddingRight" placeholder="e.g. 0, 16px, inherit" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Padding Bottom (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.footerPaddingBottom" placeholder="e.g. 0, 16px, inherit" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Padding Left (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.footerPaddingLeft" placeholder="e.g. 0, 16px, inherit" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Margin Top (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.footerMarginTop" placeholder="e.g. 0, auto, inherit" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Margin Right (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.footerMarginRight" placeholder="e.g. 0, auto, inherit" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Margin Bottom (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.footerMarginBottom" placeholder="e.g. 0, auto, inherit" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Margin Left (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.footerMarginLeft" placeholder="e.g. 0, auto, inherit" />
              </div>
            </div>
          </div>
          <button class="bg-rd-orange text-white px-4 py-2 rounded hover:bg-rd-orange-light transition" @click="saveThemeSettings">
            Save Footer
          </button>
        </div>

        <div v-else-if="themeSubTab === 'sidebar'" class="space-y-4">
          <label class="flex items-center gap-2">
            <input type="checkbox" v-model="themeSettingsDraft.showSidebar">
            <span class="text-sm text-gray-800">Show Sidebar</span>
          </label>
          <div v-if="themeSettingsDraft.showSidebar" class="space-y-3">
            <label class="text-sm text-gray-700">Sidebar Placement</label>
            <select class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.sidebarPlacement">
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label class="text-sm text-gray-700">Padding Top (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.sidebarPaddingTop" placeholder="e.g. 0, 16px, inherit" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Padding Right (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.sidebarPaddingRight" placeholder="e.g. 0, 16px, inherit" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Padding Bottom (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.sidebarPaddingBottom" placeholder="e.g. 0, 16px, inherit" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Padding Left (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.sidebarPaddingLeft" placeholder="e.g. 0, 16px, inherit" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Margin Top (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.sidebarMarginTop" placeholder="e.g. 0, auto, inherit" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Margin Right (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.sidebarMarginRight" placeholder="e.g. 0, auto, inherit" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Margin Bottom (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.sidebarMarginBottom" placeholder="e.g. 0, auto, inherit" />
              </div>
              <div>
                <label class="text-sm text-gray-700">Margin Left (px)</label>
                <input type="text" class="w-full border rounded px-3 py-2" v-model="themeSettingsDraft.sidebarMarginLeft" placeholder="e.g. 0, auto, inherit" />
              </div>
            </div>
          </div>
          <button class="bg-rd-orange text-white px-4 py-2 rounded hover:bg-rd-orange-light transition" @click="saveThemeSettings">
            Save Sidebar
          </button>
        </div>
      </div>
    </div>
    <div v-if="mediaModal.open" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div class="px-4 py-3 border-b flex items-center justify-between">
          <h4 class="text-base font-semibold">Media Library</h4>
          <button class="text-sm text-gray-600 hover:text-gray-900" @click="closeMediaModal">Close</button>
        </div>
        <div class="p-4 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-3">
          <button
            v-for="file in contentStore.media"
            :key="file.id"
            type="button"
            class="border rounded overflow-hidden text-left"
            :class="mediaSelection === file.id ? 'border-rd-orange ring-2 ring-rd-orange/40' : 'border-gray-200'"
            @click="selectMedia(file.id)"
          >
            <div class="h-32 bg-gray-100 flex items-center justify-center">
              <img v-if="file.mime_type?.startsWith('image/')" :src="resolveMediaUrl(file.url)" class="object-cover h-full w-full" />
              <div v-else class="text-xs text-gray-600 px-2">{{ file.filename || file.url }}</div>
            </div>
            <div class="px-2 py-1 text-xs text-gray-700 truncate">{{ file.filename || file.url }}</div>
          </button>
        </div>
        <div class="px-4 py-3 border-t flex justify-end gap-2">
          <button class="px-3 py-2 text-sm rounded border border-gray-300" @click="closeMediaModal">Cancel</button>
          <button class="px-3 py-2 text-sm rounded bg-rd-orange text-white" @click="applyMediaSelection">Add Selected</button>
        </div>
      </div>
    </div>
  </div>
</template>
