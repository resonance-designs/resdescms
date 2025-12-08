import { resolveMediaUrl } from './media'

const SHORTCODE_REGEX = /\[(post|page|media)([^\]]*)\]/gi

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function parseAttrs(attrString) {
  const attrs = {}
  const attrRegex = /(\w+)\s*=\s*"([^"]*)"/g
  let match
  while ((match = attrRegex.exec(attrString)) !== null) {
    attrs[match[1].toLowerCase()] = match[2]
  }
  return attrs
}

function renderPost(post, attrs) {
  if (!post) return '<span class="text-red-600 text-sm">Post not found</span>'
  const slug = escapeHtml(post.slug)
  const title = escapeHtml(post.title || slug)
  const excerpt = escapeHtml(post.excerpt || '')
  const display = (attrs.display || 'full').toLowerCase()
  const link = `/post/${slug}`
  const featured = post.featured_image ? `<img src="${resolveMediaUrl(post.featured_image)}" alt="${title}" class="w-full rounded mb-3">` : ''
  const contentHtml = post.content || ''

  switch (display) {
    case 'link':
      return `<a href="${link}" class="text-rd-orange hover:underline">${title}</a>`
    case 'small':
      return `<div class="text-sm"><a href="${link}" class="text-rd-orange hover:underline">${title}</a>${excerpt ? ` — ${excerpt}` : ''}</div>`
    case 'medium':
      return `
        <div class="border rounded p-3 space-y-2">
          <h4 class="font-semibold text-lg"><a href="${link}" class="text-gray-900 hover:text-rd-orange">${title}</a></h4>
          ${excerpt ? `<p class="text-gray-700 text-sm">${excerpt}</p>` : ''}
          <a href="${link}" class="text-sm text-rd-orange hover:underline">Read more</a>
        </div>
      `
    case 'full':
    default:
      return `
        <article class="space-y-3">
          <h3 class="text-xl font-bold"><a href="${link}" class="text-gray-900 hover:text-rd-orange">${title}</a></h3>
          ${featured}
          <div class="prose max-w-none">${contentHtml}</div>
        </article>
      `
  }
}

function renderPage(page, attrs) {
  if (!page) return '<span class="text-red-600 text-sm">Page not found</span>'
  const slug = escapeHtml(page.slug)
  const title = escapeHtml(page.title || slug)
  const link = `/page/${slug}`
  return `<a href="${link}" class="text-rd-orange hover:underline">${title}</a>`
}

function renderMedia(media, attrs) {
  if (!media) return '<span class="text-red-600 text-sm">Media not found</span>'
  const width = attrs.width ? ` style="width:${escapeHtml(attrs.width)}"` : ''
  const alt = escapeHtml(media.filename || '')
  return `<img src="${resolveMediaUrl(media.url)}"${width} alt="${alt}" class="rounded">`
}

export function replaceShortcodes(content, { posts = [], pages = [], media = [] } = {}) {
  if (!content || typeof content !== 'string') return content || ''

  return content.replace(SHORTCODE_REGEX, (_, type, attrString) => {
    const attrs = parseAttrs(attrString || '')
    switch (type.toLowerCase()) {
      case 'post': {
        const slug = attrs.slug || ''
        const post = posts.find(p => p.slug === slug)
        return renderPost(post, attrs)
      }
      case 'page': {
        const slug = attrs.slug || ''
        const page = pages.find(p => p.slug === slug)
        return renderPage(page, attrs)
      }
      case 'media': {
        const id = Number(attrs.id)
        const item = media.find(m => m.id === id)
        return renderMedia(item, attrs)
      }
      default:
        return _
    }
  })
}
