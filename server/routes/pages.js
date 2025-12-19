import express from 'express'
import * as db from '../db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

async function autoPublishScheduledPages() {
  try {
    const cols = await db.all(`PRAGMA table_info(rdcms_pages)`)
    const hasPublishAt = Array.isArray(cols) && cols.some(c => c.name === 'publish_at')
    if (!hasPublishAt) return
    await db.run(`
      UPDATE rdcms_pages
      SET published = 1
      WHERE publish_at IS NOT NULL
        AND published = 0
        AND datetime(publish_at) <= CURRENT_TIMESTAMP
    `)
  } catch (error) {
    console.error('Error auto publishing scheduled pages', error)
  }
}

router.get('/', async (req, res) => {
  try {
    await autoPublishScheduledPages()
    const limitParam = req.query.limit
    const pageParam = req.query.page
    const paginate = typeof limitParam !== 'undefined' || typeof pageParam !== 'undefined'

    if (!paginate || limitParam === 'all') {
      const pages = await db.all(`
        SELECT p.*, c.name as category_name, u.username as author_name, parent.title as parent_title
        FROM rdcms_pages p
        LEFT JOIN rdcms_categories c ON p.category_id = c.id
        LEFT JOIN rdcms_users u ON p.author_id = u.id
        LEFT JOIN rdcms_pages parent ON p.parent_id = parent.id
        ORDER BY p.created_at DESC
      `)

      const total = pages.length
      return res.json({
        data: pages,
        pagination: { page: 1, limit: total || 0, total, pages: 1 }
      })
    }

    const page = Math.max(parseInt(pageParam, 10) || 1, 1)
    const limit = Math.max(parseInt(limitParam, 10) || 10, 1)
    const offset = (page - 1) * limit

    const totalRow = await db.get('SELECT COUNT(*) as count FROM rdcms_pages')
    const pages = await db.all(`
      SELECT p.*, c.name as category_name, u.username as author_name, parent.title as parent_title
      FROM rdcms_pages p
      LEFT JOIN rdcms_categories c ON p.category_id = c.id
      LEFT JOIN rdcms_users u ON p.author_id = u.id
      LEFT JOIN rdcms_pages parent ON p.parent_id = parent.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset])

    const total = totalRow?.count || 0
    res.json({
      data: pages,
      pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/slug/:slug', async (req, res) => {
  try {
    await autoPublishScheduledPages()
    const page = await db.get(`
      SELECT p.*, c.name as category_name, u.username as author_name, parent.title as parent_title
      FROM rdcms_pages p
      LEFT JOIN rdcms_categories c ON p.category_id = c.id
      LEFT JOIN rdcms_users u ON p.author_id = u.id
      LEFT JOIN rdcms_pages parent ON p.parent_id = parent.id
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
    await autoPublishScheduledPages()
    const page = await db.get(`
      SELECT p.*, c.name as category_name, u.username as author_name, parent.title as parent_title
      FROM rdcms_pages p
      LEFT JOIN rdcms_categories c ON p.category_id = c.id
      LEFT JOIN rdcms_users u ON p.author_id = u.id
      LEFT JOIN rdcms_pages parent ON p.parent_id = parent.id
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
    const {
      title,
      slug,
      content,
      featured_image,
      category_id,
      published,
      layout_json,
      author_id,
      publish_at,
      parent_id,
      featured_image_alt,
      featured_image_title,
      featured_image_caption,
      featured_image_description
    } = req.body

    if (!title || !slug) {
      return res.status(400).json({ error: 'Title and slug are required' })
    }

    const publishNow = !publish_at || new Date(publish_at) <= new Date()
    const publishValue = publishNow ? 1 : (published ? 1 : 0)

    const result = await db.run(
      `INSERT INTO rdcms_pages
        (title, slug, content, featured_image, category_id, author_id, parent_id, published, publish_at,
         featured_image_alt, featured_image_title, featured_image_caption, featured_image_description, layout_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ,[
        title,
        slug,
        content,
        featured_image,
        category_id || null,
        author_id || req.user?.id || null,
        parent_id || null,
        publishValue ? 1 : 0,
        publish_at || null,
        featured_image_alt || null,
        featured_image_title || null,
        featured_image_caption || null,
        featured_image_description || null,
        layout_json || null
      ]
    )

    const page = await db.get(`
      SELECT p.*, c.name as category_name, u.username as author_name, parent.title as parent_title
      FROM rdcms_pages p
      LEFT JOIN rdcms_categories c ON p.category_id = c.id
      LEFT JOIN rdcms_users u ON p.author_id = u.id
      LEFT JOIN rdcms_pages parent ON p.parent_id = parent.id
      WHERE p.id = ?
    `, [result.lastID])
    res.json(page)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      slug,
      content,
      featured_image,
      category_id,
      published,
      layout_json,
      author_id,
      publish_at,
      parent_id,
      featured_image_alt,
      featured_image_title,
      featured_image_caption,
      featured_image_description
    } = req.body

    const publishNow = !publish_at || new Date(publish_at) <= new Date()
    const publishValue = publishNow ? 1 : (published ? 1 : 0)
    await db.run(
      `UPDATE rdcms_pages
       SET title = ?, slug = ?, content = ?, featured_image = ?, category_id = ?, author_id = ?, parent_id = ?, published = ?, publish_at = ?,
           featured_image_alt = ?, featured_image_title = ?, featured_image_caption = ?, featured_image_description = ?,
           layout_json = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title,
        slug,
        content,
        featured_image,
        category_id || null,
        author_id || req.user?.id || null,
        parent_id || null,
        publishValue ? 1 : 0,
        publish_at || null,
        featured_image_alt || null,
        featured_image_title || null,
        featured_image_caption || null,
        featured_image_description || null,
        layout_json || null,
        req.params.id
      ]
    )

    const page = await db.get(`
      SELECT p.*, c.name as category_name, u.username as author_name, parent.title as parent_title
      FROM rdcms_pages p
      LEFT JOIN rdcms_categories c ON p.category_id = c.id
      LEFT JOIN rdcms_users u ON p.author_id = u.id
      LEFT JOIN rdcms_pages parent ON p.parent_id = parent.id
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
