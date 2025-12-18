import { h } from 'vue'

export function registerElements() {
  return {
    'github-repos': {
      render(element, { h: createElement, pluginStore }) {
        const create = createElement || h
        const mode = element?.data?.mode === 'medium-list' ? 'medium-list' : 'small-list'
        const storeData = pluginStore?.pluginData?.value || {}
        const gitlinkState = storeData.gitlink || {}
        const repos = Array.isArray(gitlinkState.gitRepos) ? gitlinkState.gitRepos : []

        // Lazy fetch repos if not present (frontend render safeguard)
        if (!repos.length && !gitlinkState._fetching) {
          if (!storeData.gitlink) storeData.gitlink = {}
          storeData.gitlink._fetching = true
          const doFetch = async () => {
            try {
              const base = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/+$/, '')
              const res = await fetch(`${base}/api/plugins/gitlink/public/repos`, { cache: 'no-store' })
              if (!res.ok) throw new Error(`Public repos ${res.status}`)
              const data = await res.json()
              storeData.gitlink.gitRepos = data || []
            } catch (_) {
              try {
                const base = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/+$/, '')
                const res = await fetch(`${base}/api/plugins/gitlink/repos`, { cache: 'no-store' })
                if (!res.ok) throw new Error(`Auth repos ${res.status}`)
                const data = await res.json()
                storeData.gitlink.gitRepos = data || []
              } catch {
                storeData.gitlink.gitRepos = []
              }
            } finally {
              storeData.gitlink._fetching = false
              // trigger reactivity by replacing the ref value
              pluginStore.pluginData.value = {
                ...storeData,
                gitlink: { ...storeData.gitlink }
              }
            }
          }
          doFetch()
        }

        if (!repos.length) {
          return create('div', { class: 'text-gray-500 text-sm' }, 'No repositories available')
        }
        const items = repos.slice(0, 10)
        if (mode === 'medium-list') {
          return create(
            'div',
            { class: 'space-y-3' },
            items.map(repo =>
              create('div', { class: 'border rounded p-3' }, [
                create(
                  'a',
                  { href: repo.html_url, target: '_blank', rel: 'noopener', class: 'font-semibold text-rd-orange hover:underline' },
                  repo.full_name || repo.name
                ),
                repo.description ? create('p', { class: 'text-sm text-gray-700 mt-1' }, repo.description) : null,
                create('p', { class: 'text-xs text-gray-500 mt-1' }, `★ ${repo.stargazers_count || 0} · Forks ${repo.forks_count || 0}`)
              ])
            )
          )
        }
        return create(
          'ul',
          { class: 'space-y-1 text-sm' },
          items.map(repo =>
            create('li', {}, [
              create(
                'a',
                { href: repo.html_url, target: '_blank', rel: 'noopener', class: 'text-rd-orange hover:underline' },
                repo.full_name || repo.name
              ),
              create('span', { class: 'text-gray-500 ml-1' }, `★ ${repo.stargazers_count || 0}`)
            ])
          )
        )
      }
    }
  }
}

export default registerElements
