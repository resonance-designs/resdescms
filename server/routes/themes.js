import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { authenticateToken } from '../middleware/auth.js'
import {
  listThemes,
  getActiveTheme,
  setActiveTheme,
  saveThemeSettings,
  installThemeFromZip,
  bootstrapThemesFromDisk,
  themesRoot
} from '../services/themeService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.join(__dirname, '..', 'uploads', 'themes')
fs.mkdirSync(uploadDir, { recursive: true })
const upload = multer({ dest: uploadDir })
const router = express.Router()

router.get('/', async (_req, res) => {
  try {
    const themes = await listThemes()
    res.json(themes)
  } catch (err) {
    console.error('Error listing themes:', err)
    res.status(500).json({ error: 'Failed to list themes' })
  }
})

router.get('/active', async (_req, res) => {
  try {
    const theme = await getActiveTheme()
    res.json(theme || null)
  } catch (err) {
    console.error('Error fetching active theme:', err)
    res.status(500).json({ error: 'Failed to fetch active theme' })
  }
})

router.post('/activate', authenticateToken, async (req, res) => {
  try {
    const { slug } = req.body
    if (!slug) return res.status(400).json({ error: 'Theme slug is required' })
    const theme = await setActiveTheme(slug)
    res.json(theme)
  } catch (err) {
    console.error('Error activating theme:', err)
    res.status(500).json({ error: err.message || 'Failed to activate theme' })
  }
})

router.put('/:slug/settings', authenticateToken, async (req, res) => {
  try {
    const { slug } = req.params
    const settings = req.body || {}
    const theme = await saveThemeSettings(slug, settings)
    res.json(theme)
  } catch (err) {
    console.error('Error saving theme settings:', err)
    res.status(500).json({ error: err.message || 'Failed to save theme settings' })
  }
})

router.post('/install', authenticateToken, upload.single('theme'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Theme zip file is required (field name: theme)' })
    const theme = await installThemeFromZip(req.file.path)
    res.json(theme)
  } catch (err) {
    console.error('Error installing theme:', err)
    res.status(500).json({ error: err.message || 'Failed to install theme' })
  }
})

router.post('/bootstrap', authenticateToken, async (_req, res) => {
  try {
    await bootstrapThemesFromDisk()
    const themes = await listThemes()
    res.json(themes)
  } catch (err) {
    console.error('Error bootstrapping themes:', err)
    res.status(500).json({ error: 'Failed to bootstrap themes' })
  }
})

export default router
