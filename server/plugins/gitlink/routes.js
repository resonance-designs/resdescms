import express from 'express'
import axios from 'axios'
import crypto from 'crypto'
import * as db from '../../db.js'

const router = express.Router()
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const GITHUB_CLIENT_ID = process.env.GITLINK_CLIENT_ID
const GITHUB_CLIENT_SECRET = process.env.GITLINK_CLIENT_SECRET
const stateStore = new Map()

async function getSettings() {
  const row = await db.get('SELECT settings FROM rdcms_plugins WHERE slug = ?', ['gitlink'])
  return row?.settings ? JSON.parse(row.settings) : {}
}

async function saveSettings(settings) {
  await db.run('UPDATE rdcms_plugins SET settings = ? WHERE slug = ?', [JSON.stringify(settings), 'gitlink'])
}

async function saveToken(tokenData) {
  await db.run('DELETE FROM rdcms_gitlink_tokens WHERE provider = ?', ['github'])
  await db.run(
    `INSERT INTO rdcms_gitlink_tokens (provider, access_token, token_type, scope, account_login)
     VALUES (?, ?, ?, ?, ?)`,
    ['github', tokenData.access_token || null, tokenData.token_type || null, tokenData.scope || null, tokenData.account_login || null]
  )
}

async function getToken() {
  return db.get('SELECT * FROM rdcms_gitlink_tokens WHERE provider = ? ORDER BY id DESC LIMIT 1', ['github'])
}

router.get('/auth-url', async (_req, res) => {
  try {
    const settings = await getSettings()
    const clientId = GITHUB_CLIENT_ID || settings.clientId
    const redirectUri = process.env.GITLINK_REDIRECT_URI || settings.redirectUri || 'http://localhost:3001/api/plugins/gitlink/callback'
    if (!clientId) return res.status(400).json({ error: 'GitLink not configured (Client ID missing)' })
    const state = crypto.randomUUID()
    stateStore.set(state, Date.now())
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'repo',
      state
    })
    res.json({ url: `https://github.com/login/oauth/authorize?${params.toString()}` })
  } catch (err) {
    console.error('GitLink auth-url error', err)
    res.status(500).json({ error: 'Failed to build auth URL' })
  }
})

router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query
    if (!code || !state || !stateStore.has(state)) return res.status(400).send('Invalid state or code')
    stateStore.delete(state)
    const settings = await getSettings()
    const clientId = GITHUB_CLIENT_ID || settings.clientId
    const clientSecret = GITHUB_CLIENT_SECRET || settings.clientSecret
    const redirectUri = process.env.GITLINK_REDIRECT_URI || settings.redirectUri || 'http://localhost:3001/api/plugins/gitlink/callback'
    if (!clientId || !clientSecret) return res.status(400).send('GitLink not configured')

    const params = {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri
    }
    const tokenRes = await axios.post('https://github.com/login/oauth/access_token', params, {
      headers: { Accept: 'application/json' }
    })
    await saveToken(tokenRes.data)
    res.redirect(`${FRONTEND_URL}/admin/gitlink?connected=1`)
  } catch (err) {
    console.error('GitLink callback error', err.response?.data || err.message)
    res.status(500).send('OAuth callback failed')
  }
})

router.get('/status', async (_req, res) => {
  const token = await getToken()
  const settings = await getSettings()
  res.json({ connected: !!token, hasConfig: !!((GITHUB_CLIENT_ID || settings.clientId) && (GITHUB_CLIENT_SECRET || settings.clientSecret)) })
})

router.get('/repos', async (_req, res) => {
  try {
    const token = await getToken()
    if (!token?.access_token) return res.status(400).json({ error: 'Not connected' })
    const { data } = await axios.get('https://api.github.com/user/repos', {
      headers: { Authorization: `token ${token.access_token}`, Accept: 'application/vnd.github+json' }
    })
    res.json(
      (data || []).map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        html_url: repo.html_url,
        description: repo.description,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        language: repo.language,
        updated_at: repo.updated_at
      }))
    )
  } catch (err) {
    console.error('GitLink repos error', err.response?.data || err.message)
    res.status(err.response?.status || 500).json({ error: 'Failed to fetch repos' })
  }
})

export default router
