import express from 'express'
import * as db from '../db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

function slugify(name) {
  return name
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'menu'
}

async function getMenusWithItems() {
  const menus = await db.all('SELECT * FROM rdcms_navigation_menus ORDER BY is_default DESC, name ASC')
  const items = await db.all(`
    SELECT ni.*, p.slug as page_slug
    FROM rdcms_navigation_items ni
    LEFT JOIN rdcms_pages p ON ni.page_id = p.id
    ORDER BY ni.order_index
  `)

  return menus.map(menu => ({
    ...menu,
    items: items.filter(item => item.menu_id === menu.id)
  }))
}

router.get('/', async (req, res) => {
  try {
    const menus = await getMenusWithItems()
    res.json({ menus })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, is_default: isDefault } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' })
    }

    const baseSlug = slugify(name)
    let uniqueSlug = baseSlug
    let counter = 1
    const maxAttempts = 100
    // ensure slug uniqueness
    // eslint-disable-next-line no-constant-condition
    while (counter <= maxAttempts) {
      // sqlite driver returns undefined if not found
      // eslint-disable-next-line no-await-in-loop
      const existing = await db.get('SELECT id FROM rdcms_navigation_menus WHERE slug = ?', [uniqueSlug])
      if (!existing) break
      counter += 1
      uniqueSlug = `${baseSlug}-${counter}`
    }
    if (counter > maxAttempts) {
      return res.status(400).json({ error: 'Unable to generate unique slug' })
    }

    if (isDefault) {
      await db.run('UPDATE rdcms_navigation_menus SET is_default = 0')
    }

    const insertResult = await db.run(
      'INSERT INTO rdcms_navigation_menus (name, slug, is_default) VALUES (?, ?, ?)',
      [name.trim(), uniqueSlug, isDefault ? 1 : 0]
    )

    const menus = await getMenusWithItems()
    const createdMenu = menus.find(m => m.id === insertResult.lastID) || null
    res.json({ menu: createdMenu, menus })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { name, is_default: isDefault } = req.body

    const existing = await db.get('SELECT id FROM rdcms_navigation_menus WHERE id = ?', [id])
    if (!existing) {
      return res.status(404).json({ error: 'Menu not found' })
    }

    if (isDefault) {
      await db.run('UPDATE rdcms_navigation_menus SET is_default = 0')
    }

    if (name) {
      await db.run('UPDATE rdcms_navigation_menus SET name = ?, is_default = COALESCE(?, is_default) WHERE id = ?', [
        name.trim(),
        isDefault ? 1 : null,
        id
      ])
    } else if (typeof isDefault !== 'undefined') {
      await db.run('UPDATE rdcms_navigation_menus SET is_default = ? WHERE id = ?', [isDefault ? 1 : 0, id])
    }

    const menus = await getMenusWithItems()
    const updatedMenu = menus.find(m => m.id === Number(id)) || null
    res.json({ menu: updatedMenu, menus })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id/items', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { items } = req.body

    const menu = await db.get('SELECT id FROM rdcms_navigation_menus WHERE id = ?', [id])
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found' })
    }

    await db.run('DELETE FROM rdcms_navigation_items WHERE menu_id = ?', [id])

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      // eslint-disable-next-line no-await-in-loop
      await db.run(
        'INSERT INTO rdcms_navigation_items (menu_id, label, url, page_id, target, order_index) VALUES (?, ?, ?, ?, ?, ?)',
        [id, item.label, item.url, item.page_id || null, item.target || '_self', i]
      )
    }

    const menus = await getMenusWithItems()
    const updatedMenu = menus.find(m => m.id === Number(id)) || null
    res.json({ menu: updatedMenu, menus })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const menu = await db.get('SELECT * FROM rdcms_navigation_menus WHERE id = ?', [id])
    if (!menu) return res.status(404).json({ error: 'Menu not found' })
    if (menu.is_default) return res.status(400).json({ error: 'Default menu cannot be deleted' })

    await db.run('DELETE FROM rdcms_navigation_items WHERE menu_id = ?', [id])
    await db.run('DELETE FROM rdcms_navigation_menus WHERE id = ?', [id])

    const menus = await getMenusWithItems()
    res.json({ menus })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
