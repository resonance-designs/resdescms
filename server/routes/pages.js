import express from 'express'
import * as db from '../db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const pages = await db.all(`
      SELECT p.*, c.name as category_name FROM rdcms_pages p
      LEFT JOIN rdcms_categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `)
    res.json(pages)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/slug/:slug', async (req, res) => {
  try {
    const page = await db.get(`
      SELECT p.*, c.name as category_name FROM rdcms_pages p
      LEFT JOIN rdcms_categories c ON p.category_id = c.id
      WHERE p.slug = ?
    `, [req.params.slug])
    if (!page) return res.status(404).json({ error: 'Page not found' })
    res.json(page)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const page = await db.get(`
      SELECT p.*, c.name as category_name FROM rdcms_pages p
      LEFT JOIN rdcms_categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [req.params.id])
    if (!page) return res.status(404).json({ error: 'Page not found' })
    res.json(page)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, slug, content, featured_image, category_id, published, layout_json } = req.body

    if (!title || !slug) {
      return res.status(400).json({ error: 'Title and slug are required' })
    }

    const result = await db.run(
      'INSERT INTO rdcms_pages (title, slug, content, featured_image, category_id, published, layout_json) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, slug, content, featured_image, category_id || null, published ? 1 : 0, layout_json || null]
    )

    const page = await db.get(`
      SELECT p.*, c.name as category_name FROM rdcms_pages p
      LEFT JOIN rdcms_categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [result.lastID])
    res.json(page)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, slug, content, featured_image, category_id, published, layout_json } = req.body

    await db.run(
      'UPDATE rdcms_pages SET title = ?, slug = ?, content = ?, featured_image = ?, category_id = ?, published = ?, layout_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, slug, content, featured_image, category_id || null, published ? 1 : 0, layout_json || null, req.params.id]
    )

    const page = await db.get(`
      SELECT p.*, c.name as category_name FROM rdcms_pages p
      LEFT JOIN rdcms_categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [req.params.id])
    res.json(page)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM rdcms_pages WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
