import { resolveMediaUrl } from './media'

const SHORTCODE_REGEX = /\[(post|page|media|gitlink)([^\]]*)\]/gi

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
  const target = attrs.target === 'new' ? '_blank' : '_self'
  const rel = target === '_blank' ? ' rel="noopener"' : ''
  const featured = post.featured_image ? `<img src="${resolveMediaUrl(post.featured_image)}" alt="${title}" class="w-full rounded mb-3">` : ''
  const contentHtml = post.content || ''

  switch (display) {
    case 'link':
      return `<a href="${link}" class="text-rd-orange hover:underline" target="${target}"${rel}>${title}</a>`
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
  const target = attrs.target === 'new' ? '_blank' : '_self'
  const rel = target === '_blank' ? ' rel="noopener"' : ''
  return `<a href="${link}" class="text-rd-orange hover:underline" target="${target}"${rel}>${title}</a>`
}

function renderMedia(media, attrs) {
  if (!media) return '<span class="text-red-600 text-sm">Media not found</span>'
  const width = attrs.width ? ` style="width:${escapeHtml(attrs.width)}"` : ''
  const alt = escapeHtml(media.filename || '')
  return `<img src="${resolveMediaUrl(media.url)}"${width} alt="${alt}" class="rounded">`
}

export function replaceShortcodes(content, { posts = [], pages = [], media = [], gitRepos = [] } = {}) {
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
      case 'gitlink': {
        const mode = (attrs.mode || 'small-list').toLowerCase()
        const list = gitRepos || []
        if (!list.length) return '<span class="text-gray-500 text-sm">No repos available</span>'
        const items = list.slice(0, 10).map(r => {
          const name = escapeHtml(r.full_name || r.name || '')
          const url = escapeHtml(r.html_url || '#')
          const desc = escapeHtml(r.description || '')
          const stars = r.stargazers_count || 0
          const forks = r.forks_count || 0
          return { name, url, desc, stars, forks }
        })
        if (mode === 'medium-list') {
          return `
            <div class="space-y-3">
              ${items.map(repo => `
                <div class="border rounded p-3">
                  <a href="${repo.url}" target="_blank" rel="noopener" class="font-semibold text-rd-orange hover:underline">${repo.name}</a>
                  ${repo.desc ? `<p class="text-sm text-gray-700 mt-1">${repo.desc}</p>` : ''}
                  <p class="text-xs text-gray-500 mt-1">★ ${repo.stars} • Forks ${repo.forks}</p>
                </div>
              `).join('')}
            </div>
          `
        }
        return `
          <ul class="space-y-1 text-sm">
            ${items.map(repo => `
              <li>
                <a href="${repo.url}" target="_blank" rel="noopener" class="text-rd-orange hover:underline">${repo.name}</a>
                <span class="text-gray-500">★ ${repo.stars}</span>
              </li>
            `).join('')}
          </ul>
        `
      }
      default:
        return _
    }
  })
}
