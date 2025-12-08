import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import fs from 'fs'
import { authenticateToken } from '../middleware/auth.js'
import {
  listPlugins,
  installPluginFromZip,
  activatePlugin,
  savePluginSettings,
  deactivatePlugin,
  deletePlugin,
  bootstrapPluginsFromDisk,
  pluginsRoot
} from '../services/pluginService.js'
import * as db from '../db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.join(__dirname, '..', 'uploads', 'plugins')
fs.mkdirSync(uploadDir, { recursive: true })
const upload = multer({ dest: uploadDir })
const router = express.Router()

const mountedPluginRouters = new Set()

async function mountPluginRoutes() {
  const plugins = await listPlugins()
  for (const plugin of plugins) {
    const manifest = plugin.manifest || {}
    const routeFile = manifest.serverRoutes || 'routes.js'
    const fullPath = path.join(pluginsRoot, plugin.slug, routeFile)
    if (!fs.existsSync(fullPath)) continue
    if (mountedPluginRouters.has(plugin.slug)) continue
    try {
      const mod = await import(pathToFileURL(fullPath).href)
      const pluginRouter = mod.default || mod.router
      if (!pluginRouter) continue
      const guard = express.Router()
      guard.use(async (req, res, next) => {
        const row = await db.get('SELECT is_active FROM rdcms_plugins WHERE slug = ?', [plugin.slug])
        if (!row?.is_active) return res.status(404).json({ error: 'Plugin inactive' })
        next()
      })
      guard.use(pluginRouter)
      router.use(`/${plugin.slug}`, guard)
      mountedPluginRouters.add(plugin.slug)
    } catch (err) {
      console.error(`Failed to mount routes for plugin ${plugin.slug}`, err)
    }
  }
}

router.get('/', async (_req, res) => {
  try {
    const plugins = await listPlugins()
    res.json(plugins)
  } catch (err) {
    console.error('Error listing plugins:', err)
    res.status(500).json({ error: 'Failed to list plugins' })
  }
})

router.post('/install', authenticateToken, upload.single('plugin'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Plugin zip file is required (field name: plugin)' })
    const plugin = await installPluginFromZip(req.file.path)
    await mountPluginRoutes()
    res.json(plugin)
  } catch (err) {
    console.error('Error installing plugin:', err)
    res.status(500).json({ error: err.message || 'Failed to install plugin' })
  }
})

router.post('/:slug/activate', authenticateToken, async (req, res) => {
  try {
    const { slug } = req.params
    const plugin = await activatePlugin(slug)
    await mountPluginRoutes()
    res.json(plugin)
  } catch (err) {
    console.error('Error activating plugin:', err)
    res.status(500).json({ error: err.message || 'Failed to activate plugin' })
  }
})

router.post('/:slug/deactivate', authenticateToken, async (req, res) => {
  try {
    const { slug } = req.params
    const plugin = await deactivatePlugin(slug)
    res.json(plugin)
  } catch (err) {
    console.error('Error deactivating plugin:', err)
    res.status(500).json({ error: err.message || 'Failed to deactivate plugin' })
  }
})

router.delete('/:slug', authenticateToken, async (req, res) => {
  try {
    const { slug } = req.params
    const { deleteFiles = false, deleteData = false } = req.body || {}
    await deletePlugin(slug, { deleteFiles, deleteData })
    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting plugin:', err)
    res.status(500).json({ error: err.message || 'Failed to delete plugin' })
  }
})

router.put('/:slug/settings', authenticateToken, async (req, res) => {
  try {
    const { slug } = req.params
    const settings = req.body || {}
    const plugin = await savePluginSettings(slug, settings)
    res.json(plugin)
  } catch (err) {
    console.error('Error saving plugin settings:', err)
    res.status(500).json({ error: err.message || 'Failed to save plugin settings' })
  }
})

router.post('/bootstrap', authenticateToken, async (_req, res) => {
  try {
    await bootstrapPluginsFromDisk()
    await mountPluginRoutes()
    const plugins = await listPlugins()
    res.json(plugins)
  } catch (err) {
    console.error('Error bootstrapping plugins:', err)
    res.status(500).json({ error: 'Failed to bootstrap plugins' })
  }
})

// initial mount on load
mountPluginRoutes().catch(err => console.error('Failed to mount plugin routes', err))

export default router
