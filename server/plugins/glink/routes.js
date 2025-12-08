import express from 'express'
import crypto from 'crypto'
import axios from 'axios'
import * as db from '../../db.js'

const router = express.Router()
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const GLINK_SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/analytics.edit',
  'https://www.googleapis.com/auth/userinfo.email'
]
const stateStore = new Map()

async function getStoredToken(dbConn) {
  return dbConn.get('SELECT * FROM rdcms_glink_tokens WHERE provider = ? ORDER BY id DESC LIMIT 1', ['google'])
}

async function saveToken(dbConn, tokenData) {
  const { access_token, refresh_token, scope, expires_in, account_email, account_id } = tokenData
  const expiry = expires_in ? Date.now() + expires_in * 1000 : null
  await dbConn.run('DELETE FROM rdcms_glink_tokens WHERE provider = ?', ['google'])
  await dbConn.run(
    `INSERT INTO rdcms_glink_tokens (provider, access_token, refresh_token, scope, token_expiry, account_email, account_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['google', access_token || null, refresh_token || null, scope || GLINK_SCOPES.join(' '), expiry, account_email || null, account_id || null]
  )
}

async function refreshAccessToken(dbConn, cfg) {
  const stored = await getStoredToken(dbConn)
  if (!stored?.refresh_token) return null
  if (!cfg.clientId || !cfg.clientSecret) return null
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    refresh_token: stored.refresh_token,
    grant_type: 'refresh_token'
  })
  const { data } = await axios.post('https://oauth2.googleapis.com/token', params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
  await saveToken(dbConn, {
    ...stored,
    access_token: data.access_token,
    refresh_token: stored.refresh_token,
    expires_in: data.expires_in
  })
  return data.access_token
}

async function getValidAccessToken(cfg) {
  const stored = await getStoredToken(db)
  if (!stored) return null
  if (stored.token_expiry && stored.token_expiry > Date.now() + 30000) {
    return stored.access_token
  }
  return refreshAccessToken(db, cfg)
}

async function getGlinkSettings() {
  const row = await db.get('SELECT settings FROM rdcms_plugins WHERE slug = ?', ['glink'])
  const settings = row?.settings ? JSON.parse(row.settings) : {}
  return settings
}

async function getGlinkConfig() {
  const settings = await getGlinkSettings()
  return {
    clientId: process.env.GLINK_CLIENT_ID || settings.clientId || '',
    clientSecret: process.env.GLINK_CLIENT_SECRET || settings.clientSecret || '',
    redirectUri: process.env.GLINK_REDIRECT_URI || settings.redirectUri || 'http://localhost:3001/api/plugins/glink/callback'
  }
}

router.get('/auth-url', (_req, res) => {
  getGlinkConfig().then(cfg => {
    if (!cfg.clientId || !cfg.clientSecret) {
      return res.status(400).json({ error: 'GLink client not configured. Add Client ID/Secret in GLink settings.' })
    }
    const state = crypto.randomUUID()
    stateStore.set(state, Date.now())
    const params = new URLSearchParams({
      client_id: cfg.clientId,
      redirect_uri: cfg.redirectUri,
      response_type: 'code',
      scope: GLINK_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state
    })
    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` })
  }).catch(err => {
    console.error('GLink auth-url error', err)
    res.status(500).json({ error: 'Failed to build auth URL' })
  })
})

router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query
    if (!state || !stateStore.has(state)) {
      return res.status(400).send('Invalid state')
    }
    stateStore.delete(state)
    if (!code) return res.status(400).send('Missing code')

    const cfg = await getGlinkConfig()
    if (!cfg.clientId || !cfg.clientSecret) return res.status(400).send('GLink not configured')

    const params = new URLSearchParams({
      code,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: cfg.redirectUri,
      grant_type: 'authorization_code'
    })

    const { data: tokenData } = await axios.post('https://oauth2.googleapis.com/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })

    // fetch basic profile email for display
    let accountEmail = null
    try {
      const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      })
      accountEmail = profile.email
    } catch (err) {
      console.error('Failed to fetch userinfo', err.message)
    }

    await saveToken(db, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      scope: tokenData.scope,
      expires_in: tokenData.expires_in,
      account_email: accountEmail
    })

    res.redirect(`${FRONTEND_URL}/admin/glink?connected=1`)
  } catch (err) {
    console.error('GLink callback error', err)
    res.status(500).send('OAuth callback failed')
  }
})

router.get('/status', async (_req, res) => {
  const stored = await getStoredToken(db)
  const cfg = await getGlinkConfig()
  res.json({
    connected: !!stored,
    account_email: stored?.account_email || null,
    hasConfig: !!(cfg.clientId && cfg.clientSecret)
  })
})

router.get('/accounts', async (_req, res) => {
  try {
    const cfg = await getGlinkConfig()
    const token = await getValidAccessToken(cfg)
    if (!token) return res.status(400).json({ error: 'Not connected' })
    const { data } = await axios.get('https://analyticsadmin.googleapis.com/v1beta/accounts', {
      headers: { Authorization: `Bearer ${token}` }
    })
    const accounts = (data.accounts || []).map(a => ({ id: a.name?.split('/').pop(), name: a.displayName }))
    res.json(accounts)
  } catch (err) {
    const message = err.response?.data?.error?.message
      || (typeof err.response?.data === 'string' ? err.response.data : '')
      || err.message
      || 'Failed to fetch accounts'
    const linkMatch = message.match(/https?:\/\/\S+/)
    const link = linkMatch ? linkMatch[0] : null
    console.error('Failed to fetch accounts', err.response?.data || err.message)
    res.status(err.response?.status || 500).json({ error: message, link })
  }
})

router.get('/properties', async (req, res) => {
  const { accountId } = req.query
  if (!accountId) return res.status(400).json({ error: 'accountId required' })
  try {
    const cfg = await getGlinkConfig()
    const token = await getValidAccessToken(cfg)
    if (!token) return res.status(400).json({ error: 'Not connected' })
    const parent = accountId.startsWith('accounts/') ? accountId : `accounts/${accountId}`
    const { data } = await axios.get(
      `https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:${parent}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const props = (data.properties || []).map(p => ({
      id: p.name?.split('/').pop(),
      name: p.displayName,
      measurementId: p.measurementId || null
    }))
    res.json(props)
  } catch (err) {
    const status = err.response?.status || 500
    const raw = typeof err.response?.data === 'string' ? err.response.data : err.response?.data
    let message = err.response?.data?.error?.message
      || (typeof err.response?.data === 'string' ? err.response.data : '')
      || err.message
      || 'Failed to fetch properties'

    let link = null
    const linkMatch = message.match(/https?:\/\/\S+/)
    if (linkMatch) link = linkMatch[0]

    if (status === 404 && (!link || /<html/i.test(message))) {
      message = 'Analytics Admin API returned 404 for this account. Ensure the Google Analytics Admin API is enabled and the account has GA4 properties.'
      link = 'https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com'
    }

    console.error('Failed to fetch properties', raw || err.message)
    res.status(status).json({ error: message, link, status, raw })
  }
})

router.post('/properties', async (req, res) => {
  const { accountId, displayName, timeZone, websiteUrl } = req.body || {}
  if (!accountId || !displayName) {
    return res.status(400).json({ error: 'accountId and displayName are required' })
  }
  try {
    const cfg = await getGlinkConfig()
    const token = await getValidAccessToken(cfg)
    if (!token) return res.status(400).json({ error: 'Not connected' })
    const parent = accountId.startsWith('accounts/') ? accountId : `accounts/${accountId}`

    const createProp = await axios.post(
      'https://analyticsadmin.googleapis.com/v1beta/properties',
      {
        parent,
        displayName,
        timeZone: timeZone || 'Etc/UTC'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    const propName = createProp.data?.name
    const propId = propName?.split('/').pop()
    let measurementId = null

    if (propName) {
      try {
        const payload = {
          type: 'WEB_DATA_STREAM',
          displayName: displayName || websiteUrl || FRONTEND_URL,
          webStreamData: {
            defaultUri: websiteUrl || FRONTEND_URL
          }
        }
        const createStream = await axios.post(
          `https://analyticsadmin.googleapis.com/v1beta/${propName}/dataStreams`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        measurementId = createStream.data?.webStreamData?.measurementId
          || createStream.data?.measurementId
          || createStream.data?.web_stream_data?.measurement_id
          || null
      } catch (streamErr) {
        console.error('Failed to create web data stream', streamErr.response?.data || streamErr.message)
      }
    }

    res.json({
      id: propId,
      name: displayName,
      measurementId: measurementId || null
    })
  } catch (err) {
    const status = err.response?.status || 500
    const raw = typeof err.response?.data === 'string' ? err.response.data : err.response?.data
    let message = err.response?.data?.error?.message
      || (typeof err.response?.data === 'string' ? err.response.data : '')
      || err.message
      || 'Failed to create property'
    const linkMatch = message.match(/https?:\/\/\S+/)
    const link = linkMatch ? linkMatch[0] : null
    if (status === 403 && /insufficient authentication scopes/i.test(message)) {
      message = 'Google rejected the request due to insufficient scopes. Reconnect GLink and re-consent with the requested permissions, then retry.'
    }
    console.error('Failed to create property', raw || err.message)
    res.status(status).json({ error: message, link, status, raw })
  }
})

router.get('/properties/:id/streams', async (req, res) => {
  const { id } = req.params
  if (!id) return res.status(400).json({ error: 'property id required' })
  try {
    const cfg = await getGlinkConfig()
    const token = await getValidAccessToken(cfg)
    if (!token) return res.status(400).json({ error: 'Not connected' })
    const propName = id.startsWith('properties/') ? id : `properties/${id}`
    const { data } = await axios.get(
      `https://analyticsadmin.googleapis.com/v1beta/${propName}/dataStreams`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const streams = (data.dataStreams || [])
      .filter(s => s.type === 'WEB_DATA_STREAM')
      .map(s => ({
        id: s.name?.split('/').pop(),
        name: s.displayName || s.name || s.webStreamData?.defaultUri || 'Web Stream',
        measurementId: s.webStreamData?.measurementId || null,
        defaultUri: s.webStreamData?.defaultUri || ''
      }))
    const measurementId = streams[0]?.measurementId || null
    res.json({ measurementId, streams })
  } catch (err) {
    const status = err.response?.status || 500
    const raw = typeof err.response?.data === 'string' ? err.response.data : err.response?.data
    let message = err.response?.data?.error?.message
      || (typeof err.response?.data === 'string' ? err.response.data : '')
      || err.message
      || 'Failed to fetch data streams'
    const linkMatch = message.match(/https?:\/\/\S+/)
    const link = linkMatch ? linkMatch[0] : null
    res.status(status).json({ error: message, link, status, raw })
  }
})

export default router
