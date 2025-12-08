<script>
import { h } from 'vue'
import { RouterLink } from 'vue-router'
import { useContentStore } from '../stores/content'
import { resolveMediaUrl } from '../utils/media'

export default {
  name: 'ElementRenderer',
  props: {
    element: { type: Object, required: true }
  },
  setup(props) {
    const contentStore = useContentStore()

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
            const to = item.page_id && item.page_slug ? `/page/${item.page_slug}` : item.url || '#'
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
