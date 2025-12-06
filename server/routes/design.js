import express from 'express'
import * as db from '../db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const design = await db.get('SELECT settings FROM design_settings WHERE id = 1')
    if (design) {
      res.json(JSON.parse(design.settings))
    } else {
      res.json(null)
    }
  } catch (error) {
    console.error('Error fetching design settings:', error)
    res.status(500).json({ error: 'Failed to fetch design settings' })
  }
})

router.post('/', authenticateToken, async (req, res) => {
  try {
    const settings = req.body

    const existing = await db.get('SELECT id FROM design_settings WHERE id = 1')

    if (existing) {
      await db.run(
        'UPDATE design_settings SET settings = ? WHERE id = 1',
        [JSON.stringify(settings)]
      )
    } else {
      await db.run(
        'INSERT INTO design_settings (id, settings) VALUES (?, ?)',
        [1, JSON.stringify(settings)]
      )
    }

    res.json(settings)
  } catch (error) {
    console.error('Error saving design settings:', error)
    res.status(500).json({ error: 'Failed to save design settings' })
  }
})

export default router
