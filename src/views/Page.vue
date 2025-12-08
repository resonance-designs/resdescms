<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useContentStore } from '../stores/content'
import { useThemeStore } from '../stores/theme'
import { resolveMediaUrl } from '../utils/media'
import ElementRenderer from '../components/ElementRenderer.vue'

const route = useRoute()
const contentStore = useContentStore()
const themeStore = useThemeStore()
const page = ref(null)
async function loadPage(slug) {
  page.value = await contentStore.fetchPageBySlug(slug)
  if (!page.value) {
    await contentStore.fetchPages()
    page.value = contentStore.pages.find(p => p.slug === slug)
  }
  if (!contentStore.navigationMenus.length) {
    await contentStore.fetchNavigationMenus()
  }
  await themeStore.loadActiveTheme()
}

onMounted(async () => {
  await loadPage(route.params.slug)
})

watch(() => route.params.slug, async (slug) => {
  if (slug) await loadPage(slug)
})

const layoutData = computed(() => {
  if (!page.value?.layout_json) return null
  try {
    const parsed = JSON.parse(page.value.layout_json)
    return parsed && Array.isArray(parsed.blocks) ? parsed : null
  } catch (e) {
    console.warn('Failed to parse layout_json', e)
    return null
  }
})

const hasLayoutBlocks = computed(() => layoutData.value?.blocks?.length)

const headerLayout = computed(() => themeStore.activeTheme?.settings?.headerLayout)
const footerLayout = computed(() => themeStore.activeTheme?.settings?.footerLayout)
const showHeader = computed(() => themeStore.activeTheme?.settings?.showHeader !== false)
const showFooter = computed(() => themeStore.activeTheme?.settings?.showFooter !== false)
const maxWidth = computed(() => {
  const val = themeStore.activeTheme?.settings?.maxWidth
  if (typeof val === 'number') return `${val}px`
  if (typeof val === 'string' && val.trim()) return val.trim()
  const cssVal = getComputedStyle(document.documentElement).getPropertyValue('--theme-maxWidth').trim()
  return cssVal || '1200px'
})

const containerPadding = computed(() => spacingBox('containerPadding', '0px'))
const containerMargin = computed(() => spacingBox('containerMargin', '0px'))
const headerPadding = computed(() => spacingBox('headerPadding', '16px'))
const headerMargin = computed(() => spacingBox('headerMargin', '0px'))
const footerPadding = computed(() => spacingBox('footerPadding', '16px'))
const footerMargin = computed(() => spacingBox('footerMargin', '0px'))
const bodyPadding = computed(() => spacingBox('bodyPadding', '32px'))
const bodyMargin = computed(() => spacingBox('bodyMargin', '0px'))

function hasBlocks(layout) {
  return layout && Array.isArray(layout.blocks) && layout.blocks.length
}

function layoutGridProps(layout) {
  return {
    gridTemplateColumns: `repeat(${layout?.cols || 1}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${layout?.rows || 1}, auto)`,
    gap: `${layout?.gap ?? 16}px`
  }
}

function styleForBlock(block) {
  return {
    gridColumn: `${block.col} / span ${block.colSpan}`,
    gridRow: `${block.row} / span ${block.rowSpan}`,
    minHeight: '120px'
  }
}

function normalizeSpacing(val, fallback) {
  if (val === 0 || val === '0') return '0px'
  if (typeof val === 'number') return `${val}px`
  if (typeof val === 'string' && val.trim()) {
    const t = val.trim()
    return /^-?\d+(\.\d+)?$/.test(t) ? `${t}px` : t
  }
  return fallback
}

function spacingBox(prefix, fallback) {
  const s = themeStore.activeTheme?.settings || {}
  const fallbackParts = fallback.split(' ')
  while (fallbackParts.length < 4) fallbackParts.push(fallbackParts[fallbackParts.length - 1] || fallbackParts[0])
  const getSide = (side, idx) => {
    const val = s[`${prefix}${side}`]
    return normalizeSpacing(val, fallbackParts[idx])
  }
  const top = getSide('Top', 0)
  const right = getSide('Right', 1)
  const bottom = getSide('Bottom', 2)
  const left = getSide('Left', 3)
  return `${top} ${right} ${bottom} ${left}`
}

</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="mx-auto px-4 py-12" :style="{ maxWidth: maxWidth, padding: containerPadding, margin: containerMargin }">

      <div v-if="page" class="space-y-6">
        <div v-if="showHeader && hasBlocks(headerLayout)" class="bg-white rounded-lg shadow-md" :style="{ padding: headerPadding, margin: headerMargin }">
          <div class="grid" :style="layoutGridProps(headerLayout)">
            <div
              v-for="block in headerLayout.blocks"
              :key="block.id"
              class="p-3 border rounded bg-gray-50"
              :style="styleForBlock(block)"
            >
              <div v-for="element in block.elements || []" :key="element.id" class="space-y-2">
                <ElementRenderer :element="element" />
              </div>
            </div>
          </div>
        </div>

        <article class="bg-white rounded-lg shadow-md" :style="`padding:${bodyPadding}; margin:${bodyMargin}`" :data-article-padding="bodyPadding">
          <h1 class="text-4xl font-bold font-avant-garde-demi text-gray-900 mb-8">{{ page.title }}</h1>

          <img v-if="page.featured_image" :src="resolveMediaUrl(page.featured_image)" :alt="page.title" class="w-full h-96 object-cover rounded-lg mb-8">

          <template v-if="hasLayoutBlocks">
            <div class="grid" :style="layoutGridProps(layoutData)">
              <div
                v-for="block in layoutData.blocks"
                :key="block.id"
                class="p-4 border rounded bg-gray-50"
                :style="styleForBlock(block)"
              >
                <div v-for="element in block.elements || []" :key="element.id" class="space-y-2">
                  <ElementRenderer :element="element" />
                </div>
              </div>
            </div>
          </template>

          <div v-else class="prose prose-lg max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap">
            {{ page.content }}
          </div>
        </article>

        <div v-if="showFooter && hasBlocks(footerLayout)" class="bg-white rounded-lg shadow-md" :style="{ padding: footerPadding, margin: footerMargin }">
          <div class="grid" :style="layoutGridProps(footerLayout)">
            <div
              v-for="block in footerLayout.blocks"
              :key="block.id"
              class="p-3 border rounded bg-gray-50"
              :style="styleForBlock(block)"
            >
              <div v-for="element in block.elements || []" :key="element.id" class="space-y-2">
                <ElementRenderer :element="element" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="bg-white rounded-lg shadow-md p-8 text-center">
        <p class="text-gray-600">Page not found</p>
      </div>
    </div>
  </div>
</template>
