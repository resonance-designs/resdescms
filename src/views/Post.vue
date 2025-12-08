<script setup>
import { ref, onMounted, computed, h, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useContentStore } from '../stores/content'
import { useThemeStore } from '../stores/theme'

const route = useRoute()
const contentStore = useContentStore()
const themeStore = useThemeStore()
const post = ref(null)
const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

function resolveMediaUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('//')) return window.location.protocol + url
  return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`
}

async function loadPost(slug) {
  await contentStore.fetchPosts()
  post.value = contentStore.posts.find(p => p.slug === slug)
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

const ElementRenderer = {
  props: { element: { type: Object, required: true } },
  setup(props) {
    return () => {
      const el = props.element || {}
      switch (el.type) {
        case 'text':
          return h('div', { class: 'prose max-w-none whitespace-pre-wrap' }, el.data?.text || '')
        case 'media':
          if (el.data?.url?.match(/\.(mp4|webm|ogg)$/i)) {
            return h('video', { class: 'w-full rounded', controls: true, src: resolveMediaUrl(el.data.url) })
          }
          return h('img', { class: 'w-full rounded object-contain', src: resolveMediaUrl(el.data?.url), alt: el.data?.name || '' })
        case 'gallery':
          return h('div', { class: 'grid grid-cols-2 md:grid-cols-3 gap-2' },
            (el.data?.items || []).map(item =>
              h('img', { class: 'w-full h-32 object-cover rounded', src: resolveMediaUrl(item.url), alt: item.name || '' })
            )
          )
        case 'custom':
          return h('div', { innerHTML: el.data?.html || '' })
        case 'posts':
          return h('div', { class: 'text-sm text-gray-600 italic' }, 'Posts element - render on frontend using settings.')
        case 'menu': {
          const menuId = el.data?.menuId ? Number(el.data.menuId) : null
          const menu = menuId
            ? contentStore.navigationMenus.find(m => m.id === menuId)
            : contentStore.navigationMenus.find(m => m.is_default) || contentStore.navigationMenus[0]
          const items = menu?.items || []
          const orientation = el.data?.orientation === 'vertical' ? 'vertical' : 'horizontal'
          const classes = orientation === 'vertical'
            ? 'flex flex-col gap-2'
            : 'flex flex-wrap items-center gap-4'

          const links = items.map(item => {
            const isExternal = item.url?.startsWith('http')
            const to = item.page_id ? `/page/${item.page_slug || ''}` : item.url || '#'
            const target = item.target === '_blank' ? '_blank' : '_self'
            if (!isExternal && to?.startsWith('/') && target !== '_blank') {
              return h(RouterLink, { to, class: 'text-rd-orange hover:underline' }, () => item.label || to)
            }
            return h('a', {
              href: to,
              class: 'text-rd-orange hover:underline',
              target,
              rel: target === '_blank' ? 'noopener' : undefined
            }, item.label || to)
          })

          return h('nav', { class: classes }, links.length ? links : [h('span', { class: 'text-gray-400 text-sm' }, 'No menu items found')])
        }
        default:
          return h('div', { class: 'text-xs text-gray-500' }, `Unsupported element: ${el.type}`)
      }
    }
  }
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

          <div class="prose prose-lg max-w-none text-gray-800 leading-relaxed">
            {{ post.content }}
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
        <p class="text-gray-600">Post not found</p>
      </div>
    </div>
  </div>
</template>
