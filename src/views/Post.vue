<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useContentStore } from '../stores/content'
import { useThemeStore } from '../stores/theme'
import { resolveMediaUrl } from '../utils/media'
import { replaceShortcodes } from '../utils/shortcodes'
import ElementRenderer from '../components/ElementRenderer.vue'

const route = useRoute()
const contentStore = useContentStore()
const themeStore = useThemeStore()
const post = ref(null)
async function loadPost(slug) {
  post.value = await contentStore.fetchPostBySlug(slug)
  if (!post.value && contentStore.posts.length) {
    post.value = contentStore.posts.find(p => p.slug === slug) || null
  }
  const body = post.value?.content || ''
  if (/\[post\b/i.test(body) && !contentStore.posts.length) {
    await contentStore.fetchPosts()
  }
  if (/\[page\b/i.test(body) && !contentStore.pages.length) {
    await contentStore.fetchPages()
  }
  if (/\[media\b/i.test(body) && !contentStore.media.length) {
    await contentStore.fetchMedia()
  }
  if (!contentStore.navigationMenus.length) {
    await contentStore.fetchNavigationMenus()
  }
  await themeStore.loadActiveTheme()
}

onMounted(async () => {
  await loadPost(route.params.slug)
})

watch(() => route.params.slug, async (slug) => {
  if (slug) await loadPost(slug)
})

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

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

const renderedContent = computed(() =>
  replaceShortcodes(post.value?.content || '', {
    posts: contentStore.posts,
    pages: contentStore.pages,
    media: contentStore.media
  })
)

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

      <div v-if="post" class="space-y-6">
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

        <article
          class="bg-white rounded-lg shadow-md"
          :style="`padding:${bodyPadding}; margin:${bodyMargin}`"
          :data-article-padding="bodyPadding"
        >
          <h1 class="text-4xl font-bold font-avant-garde-demi text-gray-900 mb-4">{{ post.title }}</h1>
          <div class="flex items-center text-gray-600 text-sm mb-8">
            <span>{{ formatDate(post.created_at) }}</span>
          </div>

          <img v-if="post.featured_image" :src="resolveMediaUrl(post.featured_image)" :alt="post.title" class="w-full h-96 object-cover rounded-lg mb-8">

          <p class="text-gray-600 text-lg mb-8">{{ post.excerpt }}</p>

          <div class="prose prose-lg max-w-none text-gray-800 leading-relaxed" v-html="renderedContent"></div>
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
        <p class="text-gray-600">Post not found</p>
      </div>
    </div>
  </div>
</template>
