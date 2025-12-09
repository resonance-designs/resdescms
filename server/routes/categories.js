import express from 'express'
import * as db from '../db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params
    const categories = await db.all('SELECT * FROM rdcms_categories WHERE type = ? ORDER BY name ASC', [type])
    res.json(categories)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const categories = await db.all('SELECT * FROM rdcms_categories ORDER BY type ASC, name ASC')
    res.json(categories)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, slug, description, type } = req.body

    if (!name || !slug || !type) {
      return res.status(400).json({ error: 'Name, slug, and type are required' })
    }

    const result = await db.run(
      'INSERT INTO rdcms_categories (name, slug, description, type) VALUES (?, ?, ?, ?)',
      [name, slug, description, type]
    )

    const category = await db.get('SELECT * FROM rdcms_categories WHERE id = ?', [result.lastID])
    res.json(category)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, slug, description, type } = req.body

    await db.run(
      'UPDATE rdcms_categories SET name = ?, slug = ?, description = ?, type = ? WHERE id = ?',
      [name, slug, description, type, req.params.id]
    )

    const category = await db.get('SELECT * FROM rdcms_categories WHERE id = ?', [req.params.id])
    res.json(category)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM rdcms_categories WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
