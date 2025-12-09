import express from 'express'
import axios from 'axios'
import crypto from 'crypto'
import * as db from '../../db.js'

const router = express.Router()
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001'
const SQUARE_APPLICATION_ID = process.env.RDCOMMERCE_SQUARE_APP_ID
const SQUARE_APPLICATION_SECRET = process.env.RDCOMMERCE_SQUARE_APP_SECRET
const SQUARE_ACCESS_TOKEN = process.env.RDCOMMERCE_SQUARE_ACCESS_TOKEN
const stateStore = new Map()
const STATE_TTL_MS = 10 * 60 * 1000 // 10 minutes

// Clean up expired states periodically
setInterval(() => {
  const now = Date.now()
  for (const [state, timestamp] of stateStore) {
    if (now - timestamp > STATE_TTL_MS) stateStore.delete(state)
  }
}, 60 * 1000) // Clean every minute

// Square OAuth configuration
const SQUARE_SCOPES = ['ITEMS_READ', 'INVENTORY_READ', 'MERCHANT_PROFILE_READ']

async function getSettings() {
  const row = await db.get('SELECT settings FROM rdcms_plugins WHERE slug = ?', ['rdcommerce'])
  return row?.settings ? JSON.parse(row.settings) : {}
}

async function saveSettings(settings) {
  await db.run('UPDATE rdcms_plugins SET settings = ? WHERE slug = ?', [JSON.stringify(settings), 'rdcommerce'])
}

async function saveToken(provider, tokenData) {
  await db.run('DELETE FROM rdcms_rdcommerce_tokens WHERE provider = ?', [provider])
  await db.run(
    `INSERT INTO rdcms_rdcommerce_tokens (provider, access_token, refresh_token, token_type, scope, expires_at, account_id, account_name, location_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      provider,
      tokenData.access_token || null,
      tokenData.refresh_token || null,
      tokenData.token_type || null,
      tokenData.scope || null,
      tokenData.expires_at || null,
      tokenData.account_id || null,
      tokenData.account_name || null,
      tokenData.location_id || null
    ]
  )
}

async function getToken(provider) {
  return db.get('SELECT * FROM rdcms_rdcommerce_tokens WHERE provider = ? ORDER BY id DESC LIMIT 1', [provider])
}

// Square connection routes
router.get('/square/auth-url', async (req, res) => {
  try {
    console.log('Getting Square auth URL...')
    const settings = await getSettings()
    console.log('Settings retrieved:', settings)
    const appId = (SQUARE_APPLICATION_ID || settings.squareApplicationId || '').trim()
    const accessToken = (SQUARE_ACCESS_TOKEN || settings.squareAccessToken || '').trim()
    console.log('App ID:', appId ? 'present' : 'missing')
    console.log('Access Token:', accessToken ? 'present' : 'missing')

    const isSandbox = settings.squareSandbox !== false // Default to true for safety
    console.log('Is sandbox:', isSandbox)

    if (isSandbox) {
      // Sandbox mode: Test direct API access
      if (!accessToken) return res.status(400).json({ error: 'Square Access Token required for sandbox mode' })

      try {
        const baseUrl = 'https://connect.squareupsandbox.com'
        const response = await axios.get(`${baseUrl}/v2/merchants/me`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        console.log('Sandbox API test successful:', response.data.merchant.business_name)

        // Save sandbox token directly
        await saveToken('square', {
          access_token: accessToken,
          token_type: 'Bearer',
          account_id: response.data.merchant.id,
          account_name: response.data.merchant.business_name,
          location_id: '' // Will be set when importing
        })

        return res.json({ success: true, sandbox: true, account_name: response.data.merchant.business_name })
      } catch (apiErr) {
        console.error('Sandbox API test failed:', apiErr.response?.status, apiErr.response?.data || apiErr.message)
        console.log('Falling back to OAuth flow due to sandbox API failure')
        // Fall through to OAuth flow
      }
    } else {
      // Production mode: OAuth flow
      if (!appId) return res.status(400).json({ error: 'Square Application ID not configured' })

      const state = crypto.randomUUID()
      stateStore.set(state, Date.now())

      const baseUrl = 'https://connect.squareup.com'
      const redirectUri = `${API_BASE_URL}/api/plugins/rdcommerce/square/callback`
      console.log('Redirect URI:', redirectUri)
      const params = new URLSearchParams({
        client_id: appId,
        redirect_uri: redirectUri,
        scope: SQUARE_SCOPES.join(' '),
        session: 'false',
        state
      })

      const authUrl = `${baseUrl}/oauth2/authorize?${params.toString()}`
      console.log('Square OAuth URL:', authUrl)
      res.json({ url: authUrl })
    }
  } catch (err) {
    console.error('Square auth-url error:', err)
    res.status(500).json({ error: 'Failed to build auth URL: ' + err.message })
  }
})

router.get('/square/callback', async (req, res) => {
  try {
    console.log('Square OAuth callback received:', req.query)
    const { code, state } = req.query
    if (!code || !state || !stateStore.has(state)) {
      console.log('Invalid callback parameters:', { code: !!code, state: !!state, stateValid: stateStore.has(state) })
      return res.status(400).send('Invalid state or code')
    }
    stateStore.delete(state)

    const settings = await getSettings()
    const appId = (SQUARE_APPLICATION_ID || settings.squareApplicationId || '').trim()
    const appSecret = (SQUARE_APPLICATION_SECRET || settings.squareApplicationSecret || '').trim()
    const accessToken = (SQUARE_ACCESS_TOKEN || settings.squareAccessToken || '').trim()

    if (!appId || !appSecret) {
      console.log('Square not configured:', { appId: !!appId, appSecret: !!appSecret })
      return res.status(400).send('Square not configured')
    }

    const isSandbox = settings.squareSandbox !== false // Default to true for safety
    const baseUrl = isSandbox ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com'
    console.log('Exchanging code for token with baseUrl:', baseUrl)
    const tokenRes = await axios.post(`${baseUrl}/oauth2/token`, {
      client_id: appId,
      client_secret: appSecret,
      code,
      grant_type: 'authorization_code'
    })
    console.log('Token exchange successful')

    // Get merchant info
    const merchantRes = await axios.get(`${baseUrl}/v2/merchants/me`, {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
    })
    console.log('Merchant info retrieved:', merchantRes.data.merchant.business_name)

    // Get locations
    const locationsRes = await axios.get(`${baseUrl}/v2/locations`, {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
    })

    const merchant = merchantRes.data.merchant
    const location = locationsRes.data.locations[0]

    await saveToken('square', {
      access_token: tokenRes.data.access_token,
      refresh_token: tokenRes.data.refresh_token,
      token_type: tokenRes.data.token_type,
      scope: tokenRes.data.scope,
      expires_at: tokenRes.data.expires_at,
      account_id: merchant.id,
      account_name: merchant.business_name,
      location_id: location?.id
    })
    console.log('Token saved successfully')

    const redirectUrl = `${FRONTEND_URL}/admin/rdcommerce?connected=square`
    console.log('Redirecting to:', redirectUrl)
    res.redirect(redirectUrl)
  } catch (err) {
    console.error('Square callback error:', err.response?.data || err.message)
    console.error('Full error:', err)
    res.status(500).send('OAuth callback failed: ' + (err.response?.data?.message || err.message))
  }
})

router.get('/square/status', async (req, res) => {
  try {
    const token = await getToken('square')
    const settings = await getSettings()
    const isSandbox = settings.squareSandbox !== false

    res.json({
      connected: !!token,
      account_name: token?.account_name || null,
      hasConfig: !!(settings.squareApplicationId && settings.squareApplicationSecret),
      sandbox: isSandbox
    })
  } catch (err) {
    console.error('Square status error:', err)
    res.status(500).json({ error: 'Failed to get status' })
  }
})

// Import products from Square
router.post('/square/import', async (req, res) => {
  try {
    const { dateFrom, dateTo, inStockOnly } = req.body
    const token = await getToken('square')
    if (!token?.access_token) return res.status(400).json({ error: 'Not connected to Square' })

    const settings = await getSettings()
    const isSandbox = settings.squareSandbox !== false // Default to true for safety
    const baseUrl = isSandbox ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com'

    console.log('Importing from Square, sandbox:', isSandbox, 'baseUrl:', baseUrl)

    // Fetch catalog items
    const catalogRes = await axios.get(`${baseUrl}/v2/catalog/list`, {
      headers: { Authorization: `Bearer ${token.access_token}` },
      params: { types: 'ITEM' }
    })

    const items = catalogRes.data.objects || []
    console.log(`Found ${items.length} items in catalog`)
    let imported = 0
    let skipped = 0

    for (const item of items) {
      // Check date filter
      if (dateFrom || dateTo) {
        const updatedAt = new Date(item.updated_at)
        if (dateFrom && updatedAt < new Date(dateFrom)) continue
        if (dateTo && updatedAt > new Date(dateTo)) continue
      }

      // Check stock filter
      if (inStockOnly && token.location_id) {
        try {
          const inventoryRes = await axios.get(`${baseUrl}/v2/inventory/counts`, {
            headers: { Authorization: `Bearer ${token.access_token}` },
            params: {
              catalog_object_ids: item.id,
              location_ids: token.location_id
            }
          })
          const counts = inventoryRes.data.counts || []
          const hasStock = counts.some(c => parseInt(c.quantity) > 0)
          if (!hasStock) continue
        } catch (invErr) {
          console.log('Inventory check failed, skipping stock filter:', invErr.message)
        }
      }

      // Get variation for price/stock
      const variation = item.item_data?.variations?.[0]
      if (!variation) continue

      const price = variation.item_variation_data?.price_money?.amount
      const sku = variation.item_variation_data?.sku

      // Check if product already exists
      const existing = await db.get('SELECT id FROM rdcms_posts WHERE post_type = ? AND slug = ?', [
        'product',
        `product-${item.id}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      ])

      if (existing) {
        skipped++
        continue
      }

      // Create product post
      const slug = `product-${item.id}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      const result = await db.run(
        'INSERT INTO rdcms_posts (title, slug, content, post_type, published) VALUES (?, ?, ?, ?, ?)',
        [
          item.item_data?.name || 'Unnamed Product',
          slug,
          item.item_data?.description || '',
          'product',
          1
        ]
      )

      // Add meta
      const meta = [
        ['square_id', item.id],
        ['sku', sku || ''],
        ['price', price ? (price / 100).toString() : '0'], // Convert cents to dollars
        ['stock', '0'], // Will be updated if inventory API is called
        ['category', item.item_data?.category_id || '']
      ]

      for (const [key, value] of meta) {
        await db.run('INSERT INTO rdcms_postmeta (post_id, meta_key, meta_value) VALUES (?, ?, ?)', [
          result.lastID,
          key,
          value
        ])
      }

      imported++
    }

    console.log(`Import complete: ${imported} imported, ${skipped} skipped`)
    res.json({ imported, skipped, total: items.length })
  } catch (err) {
    console.error('Square import error:', err.response?.data || err.message)
    res.status(err.response?.status || 500).json({
      error: 'Import failed',
      details: err.response?.data?.message || err.message
    })
  }
})

export default router