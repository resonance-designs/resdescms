import express from 'express'
import * as db from '../db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const posts = await db.all(`
      SELECT p.*, c.name as category_name FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `)
    res.json(posts)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/slug/:slug', async (req, res) => {
  try {
    const post = await db.get(`
      SELECT p.*, c.name as category_name FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ?
    `, [req.params.slug])
    if (!post) return res.status(404).json({ error: 'Post not found' })
    res.json(post)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const post = await db.get(`
      SELECT p.*, c.name as category_name FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [req.params.id])
    if (!post) return res.status(404).json({ error: 'Post not found' })
    res.json(post)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, slug, content, excerpt, featured_image, category_id, published } = req.body

    if (!title || !slug) {
      return res.status(400).json({ error: 'Title and slug are required' })
    }

    const result = await db.run(
      'INSERT INTO posts (title, slug, content, excerpt, featured_image, category_id, published) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, slug, content, excerpt, featured_image, category_id || null, published ? 1 : 0]
    )

    const post = await db.get(`
      SELECT p.*, c.name as category_name FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [result.lastID])
    res.json(post)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, slug, content, excerpt, featured_image, category_id, published } = req.body

    await db.run(
      'UPDATE posts SET title = ?, slug = ?, content = ?, excerpt = ?, featured_image = ?, category_id = ?, published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, slug, content, excerpt, featured_image, category_id || null, published ? 1 : 0, req.params.id]
    )

    const post = await db.get(`
      SELECT p.*, c.name as category_name FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [req.params.id])
    res.json(post)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM posts WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
