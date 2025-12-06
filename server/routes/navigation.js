import express from 'express'
import * as db from '../db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const items = await db.all(`
      SELECT n.*, p.slug as page_slug FROM navigation n
      LEFT JOIN pages p ON n.page_id = p.id
      ORDER BY n.order_index
    `)
    res.json(items)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/', authenticateToken, async (req, res) => {
  try {
    const { items } = req.body

    await db.run('DELETE FROM navigation')

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      await db.run(
        'INSERT INTO navigation (label, url, page_id, order_index) VALUES (?, ?, ?, ?)',
        [item.label, item.url, item.page_id || null, i]
      )
    }

    const updatedItems = await db.all(`
      SELECT n.*, p.slug as page_slug FROM navigation n
      LEFT JOIN pages p ON n.page_id = p.id
      ORDER BY n.order_index
    `)
    res.json(updatedItems)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
