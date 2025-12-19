import express from 'express'
import * as db from '../db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

async function autoPublishScheduledPosts() {
  try {
    const cols = await db.all(`PRAGMA table_info(rdcms_posts)`)
    const hasPublishAt = Array.isArray(cols) && cols.some(c => c.name === 'publish_at')
    if (!hasPublishAt) return
    await db.run(`
      UPDATE rdcms_posts
      SET published = 1
      WHERE publish_at IS NOT NULL
        AND published = 0
        AND datetime(publish_at) <= CURRENT_TIMESTAMP
    `)
  } catch (error) {
    console.error('Error auto publishing scheduled posts', error)
  }
}

async function getMetaForPost(postId) {
  const metaRows = await db.all('SELECT meta_key, meta_value FROM rdcms_postmeta WHERE post_id = ?', [postId])
  const meta = {}
  metaRows.forEach(row => { meta[row.meta_key] = row.meta_value })
  return meta
}

async function attachMeta(posts) {
  if (!posts) return posts
  const list = Array.isArray(posts) ? posts : [posts]
  const withMeta = await Promise.all(list.map(async (p) => ({
    ...p,
    meta: await getMetaForPost(p.id)
  })))
  return Array.isArray(posts) ? withMeta : withMeta[0]
}

router.get('/', async (req, res) => {
  try {
    await autoPublishScheduledPosts()
    const limitParam = req.query.limit
    const pageParam = req.query.page
    const paginate = typeof limitParam !== 'undefined' || typeof pageParam !== 'undefined'

    if (!paginate || limitParam === 'all') {
      const posts = await db.all(`
        SELECT p.*, c.name as category_name, u.username as author_name FROM rdcms_posts p
        LEFT JOIN rdcms_categories c ON p.category_id = c.id
        LEFT JOIN rdcms_users u ON p.author_id = u.id
        ORDER BY p.created_at DESC
      `)

      const data = await attachMeta(posts)
      const total = data.length
      return res.json({
        data,
        pagination: {
          page: 1,
          limit: total || 0,
          total,
          pages: 1
        }
      })
    }

    const page = Math.max(parseInt(pageParam, 10) || 1, 1)
    const limit = Math.max(parseInt(limitParam, 10) || 10, 1)
    const offset = (page - 1) * limit

    const totalRow = await db.get('SELECT COUNT(*) as count FROM rdcms_posts')
    const posts = await db.all(`
      SELECT p.*, c.name as category_name, u.username as author_name FROM rdcms_posts p
      LEFT JOIN rdcms_categories c ON p.category_id = c.id
      LEFT JOIN rdcms_users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset])

    const data = await attachMeta(posts)
    const total = totalRow?.count || 0

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(Math.ceil(total / limit), 1)
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/slug/:slug', async (req, res) => {
  try {
    await autoPublishScheduledPosts()
    const post = await db.get(`
      SELECT p.*, c.name as category_name, u.username as author_name FROM rdcms_posts p
      LEFT JOIN rdcms_categories c ON p.category_id = c.id
      LEFT JOIN rdcms_users u ON p.author_id = u.id
      WHERE p.slug = ?
    `, [req.params.slug])
    if (!post) return res.status(404).json({ error: 'Post not found' })
    res.json(await attachMeta(post))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    await autoPublishScheduledPosts()
    const post = await db.get(`
      SELECT p.*, c.name as category_name, u.username as author_name FROM rdcms_posts p
      LEFT JOIN rdcms_categories c ON p.category_id = c.id
      LEFT JOIN rdcms_users u ON p.author_id = u.id
      WHERE p.id = ?
    `, [req.params.id])
    if (!post) return res.status(404).json({ error: 'Post not found' })
    res.json(await attachMeta(post))
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
      excerpt,
      featured_image,
      featured_image_alt,
      featured_image_title,
      featured_image_caption,
      featured_image_description,
      category_id,
      published,
      post_type,
      meta,
      author_id,
      publish_at
    } = req.body

    if (!title || !slug) {
      return res.status(400).json({ error: 'Title and slug are required' })
    }

    const publishNow = !publish_at || new Date(publish_at) <= new Date()
    const publishValue = publishNow ? 1 : (published ? 1 : 0)

    const result = await db.run(
      `INSERT INTO rdcms_posts
        (title, slug, content, excerpt, featured_image, featured_image_alt, featured_image_title, featured_image_caption, featured_image_description,
         category_id, post_type, published, author_id, publish_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        slug,
        content,
        excerpt,
        featured_image,
        featured_image_alt || null,
        featured_image_title || null,
        featured_image_caption || null,
        featured_image_description || null,
        category_id || null,
        post_type || 'post',
        publishValue ? 1 : 0,
        author_id || req.user?.id || null,
        publish_at || null
      ]
    )

    if (meta && typeof meta === 'object') {
      await db.run('BEGIN TRANSACTION')
      try {
        await db.run('DELETE FROM rdcms_postmeta WHERE post_id = ?', [result.lastID])
        for (const [key, value] of Object.entries(meta)) {
          await db.run('INSERT INTO rdcms_postmeta (post_id, meta_key, meta_value) VALUES (?, ?, ?)', [
            result.lastID, key, value
          ])
        }
        await db.run('COMMIT')
      } catch (err) {
        await db.run('ROLLBACK')
        throw err
      }
    }

    const post = await db.get(`
      SELECT p.*, c.name as category_name, u.username as author_name FROM rdcms_posts p
      LEFT JOIN rdcms_categories c ON p.category_id = c.id
      LEFT JOIN rdcms_users u ON p.author_id = u.id
      WHERE p.id = ?
    `, [result.lastID])
    res.json(await attachMeta(post))
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
      excerpt,
      featured_image,
      featured_image_alt,
      featured_image_title,
      featured_image_caption,
      featured_image_description,
      category_id,
      published,
      post_type,
      meta,
      author_id,
      publish_at
    } = req.body

    const publishNow = !publish_at || new Date(publish_at) <= new Date()
    const publishValue = publishNow ? 1 : (published ? 1 : 0)
    await db.run(
      `UPDATE rdcms_posts
       SET title = ?, slug = ?, content = ?, excerpt = ?, featured_image = ?, featured_image_alt = ?, featured_image_title = ?, featured_image_caption = ?, featured_image_description = ?,
           category_id = ?, post_type = ?, published = ?, publish_at = ?, author_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title,
        slug,
        content,
        excerpt,
        featured_image,
        featured_image_alt || null,
        featured_image_title || null,
        featured_image_caption || null,
        featured_image_description || null,
        category_id || null,
        post_type || 'post',
        publishValue ? 1 : 0,
        publish_at || null,
        author_id || req.user?.id || null,
        req.params.id
      ]
    )

    if (meta && typeof meta === 'object') {
      await db.run('BEGIN TRANSACTION')
      try {
        await db.run('DELETE FROM rdcms_postmeta WHERE post_id = ?', [req.params.id])
        for (const [key, value] of Object.entries(meta)) {
          await db.run('INSERT INTO rdcms_postmeta (post_id, meta_key, meta_value) VALUES (?, ?, ?)', [
            req.params.id, key, value
          ])
        }
        await db.run('COMMIT')
      } catch (err) {
        await db.run('ROLLBACK')
        throw err
      }
    }

    const post = await db.get(`
      SELECT p.*, c.name as category_name, u.username as author_name FROM rdcms_posts p
      LEFT JOIN rdcms_categories c ON p.category_id = c.id
      LEFT JOIN rdcms_users u ON p.author_id = u.id
      WHERE p.id = ?
    `, [req.params.id])
    res.json(await attachMeta(post))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM rdcms_posts WHERE id = ?', [req.params.id])
    await db.run('DELETE FROM rdcms_postmeta WHERE post_id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
