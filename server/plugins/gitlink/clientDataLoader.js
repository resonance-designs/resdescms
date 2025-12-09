import axios from 'axios'

const API_BASE_URL = (import.meta.env.VITE_API_BASE || 'http://localhost:3001').replace(/\/+$/, '')

export async function loadContentData(content, layoutJson, { pluginData }) {
  const body = content || ''
  const layout = typeof layoutJson === 'string' ? layoutJson : JSON.stringify(layoutJson || {})
  const hasGithubReposElement = layout.includes('"type":"github-repos"')
  const hasGitlinkShortcode = /\[gitlink\b/i.test(body)

  if (hasGithubReposElement || hasGitlinkShortcode) {
    if (!pluginData.value.gitlink?.gitRepos?.length) {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/plugins/gitlink/repos`)
        if (!pluginData.value.gitlink) pluginData.value.gitlink = {}
        pluginData.value.gitlink.gitRepos = data || []
      } catch (err) {
        console.error('Failed to fetch GitLink repos', err)
        if (!pluginData.value.gitlink) pluginData.value.gitlink = {}
        pluginData.value.gitlink.gitRepos = []
      }
    }
  }
}

export default loadContentData