import express from 'express'
import bcryptjs from 'bcryptjs'
import * as db from '../db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await db.all('SELECT id, username, email, created_at FROM rdcms_users')
    res.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await db.get('SELECT id, username, email, created_at FROM rdcms_users WHERE id = ?', [req.params.id])
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    const hashedPassword = bcryptjs.hashSync(password, 10)
    
    const result = await db.run(
      'INSERT INTO rdcms_users (username, email, password) VALUES (?, ?, ?)',
      [username, email || null, hashedPassword]
    )

    res.json({
      id: result.lastID,
      username,
      email,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error creating user:', error)
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Username already exists' })
    } else {
      res.status(500).json({ error: 'Failed to create user' })
    }
  }
})

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username) {
      return res.status(400).json({ error: 'Username is required' })
    }

    let updateQuery = 'UPDATE rdcms_users SET username = ?, email = ?'
    let params = [username, email || null, parseInt(req.params.id)]

    if (password) {
      const hashedPassword = bcryptjs.hashSync(password, 10)
      updateQuery += ', password = ?'
      params.splice(2, 0, hashedPassword)
    }

    updateQuery += ' WHERE id = ?'

    await db.run(updateQuery, params)

    const user = await db.get('SELECT id, username, email, created_at FROM rdcms_users WHERE id = ?', [req.params.id])
    res.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Username already exists' })
    } else {
      res.status(500).json({ error: 'Failed to update user' })
    }
  }
})

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own user account' })
    }

    await db.run('DELETE FROM rdcms_users WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

export default router
