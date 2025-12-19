import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import * as db from '../db.js'
import { authenticateToken } from '../middleware/auth.js'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, '../uploads')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date()
    const year = `${now.getFullYear()}`
    const month = `${now.getMonth() + 1}`.padStart(2, '0')
    const targetDir = path.join(uploadsDir, year, month)
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }
    cb(null, targetDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = path.basename(file.originalname, ext)
    const filename = `${name}-${Date.now()}${ext}`
    cb(null, filename)
  }
})

const upload = multer({ storage })
const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const limitParam = req.query.limit
    const pageParam = req.query.page
    const paginate = typeof limitParam !== 'undefined' || typeof pageParam !== 'undefined'

    if (!paginate || limitParam === 'all') {
      const media = await db.all(`
        SELECT m.*, u.username as uploader_name
        FROM rdcms_media m
        LEFT JOIN rdcms_users u ON m.uploaded_by = u.id
        ORDER BY m.created_at DESC
      `)
      const total = media.length
      return res.json({
        data: media,
        pagination: { page: 1, limit: total || 0, total, pages: 1 }
      })
    }

    const page = Math.max(parseInt(pageParam, 10) || 1, 1)
    const limit = Math.max(parseInt(limitParam, 10) || 10, 1)
    const offset = (page - 1) * limit

    const totalRow = await db.get('SELECT COUNT(*) as count FROM rdcms_media')
    const media = await db.all(
      `
        SELECT m.*, u.username as uploader_name
        FROM rdcms_media m
        LEFT JOIN rdcms_users u ON m.uploaded_by = u.id
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
      `,
      [limit, offset]
    )

    const total = totalRow?.count || 0
    res.json({
      data: media,
      pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const result = await db.run(
      'INSERT INTO rdcms_media (filename, url, mime_type, size, uploaded_by) VALUES (?, ?, ?, ?, ?)',
      [
        path.relative(uploadsDir, path.join(req.file.destination, req.file.filename)).replace(/\\/g, '/'),
        `/uploads/${path.relative(uploadsDir, path.join(req.file.destination, req.file.filename)).replace(/\\/g, '/')}`,
        req.file.mimetype,
        req.file.size,
        req.user?.id || null
      ]
    )

    const media = await db.get(`
      SELECT m.*, u.username as uploader_name
      FROM rdcms_media m
      LEFT JOIN rdcms_users u ON m.uploaded_by = u.id
      WHERE m.id = ?
    `, [result.lastID])
    res.json(media)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const media = await db.get('SELECT * FROM rdcms_media WHERE id = ?', [req.params.id])
    if (!media) return res.status(404).json({ error: 'Media not found' })

    const filePath = path.join(uploadsDir, media.filename)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    await db.run('DELETE FROM rdcms_media WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
