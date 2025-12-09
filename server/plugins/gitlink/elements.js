import { h } from 'vue'

function isValidUrl(url) {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export function renderGitHubRepos(el, pluginStore) {
  const mode = el.data?.mode === 'medium-list' ? 'medium-list' : 'small-list'
  const list = pluginStore.pluginData?.gitlink?.gitRepos || []
  if (!list.length) {
    return h('div', { class: 'text-gray-500 text-sm' }, 'No repositories available')
  }
  const items = list.slice(0, 10)
  if (mode === 'medium-list') {
    return h(
      'div',
      { class: 'space-y-3' },
      items.map(repo =>
        h('div', { class: 'border rounded p-3' }, [
          h(
            'a',
            { href: isValidUrl(repo.html_url) ? repo.html_url : '#', target: '_blank', rel: 'noopener', class: 'font-semibold text-rd-orange hover:underline' },
            repo.full_name || repo.name
          ),
          repo.description ? h('p', { class: 'text-sm text-gray-700 mt-1' }, repo.description) : null,
          h('p', { class: 'text-xs text-gray-500 mt-1' }, `★ ${repo.stargazers_count || 0} • Forks ${repo.forks_count || 0}`)
        ])
      )
    )
  }
  return h(
    'ul',
    { class: 'space-y-1 text-sm' },
    items.map(repo =>
      h('li', {}, [
        h(
          'a',
          { href: isValidUrl(repo.html_url) ? repo.html_url : '#', target: '_blank', rel: 'noopener', class: 'text-rd-orange hover:underline' },
          repo.full_name || repo.name
        ),
        h('span', { class: 'text-gray-500 ml-1' }, `★ ${repo.stargazers_count || 0}`)
      ])
    )
  )
}

export function registerElements() {
  return {
    'github-repos': renderGitHubRepos
  }
}

export default registerElements
