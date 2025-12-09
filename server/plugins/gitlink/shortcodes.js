import { escapeHtml } from '../../utils/shortcodeUtils.js'

export function gitlinkRenderer(attrs, context) {
  const mode = (attrs.mode || 'small-list').toLowerCase()
  const list = context.gitRepos || []
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

export function registerShortcodes() {
  return {
    gitlink: gitlinkRenderer
  }
}

export default registerShortcodes
