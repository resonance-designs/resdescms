import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import bcryptjs from 'bcryptjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, 'cms.db')

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database error:', err)
  } else {
    console.log('Connected to SQLite database')
  }
})

db.configure('busyTimeout', 5000)

export function ensureTablesExist() {
  db.serialize(() => {
    createTables()
    migrateLegacyTables()
    addMissingColumns()
    seedDefaults()
  })
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS rdcms_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating users table:', err)

    db.get('SELECT * FROM rdcms_users WHERE username = ?', ['resonancedesigns'], (err, row) => {
      if (!row && !err) {
        const hashedPassword = bcryptjs.hashSync('i4Vc$oUU%AR!WK3W', 10)
        db.run(
          'INSERT INTO rdcms_users (username, password, email) VALUES (?, ?, ?)',
          ['resonancedesigns', hashedPassword, 'info@resonancedesigns.dev'],
          (err) => {
            if (err) console.error('Error inserting default user:', err)
            else console.log('Default admin user created')
          }
        )
      }
    })
  })

  db.run(`
    CREATE TABLE IF NOT EXISTS rdcms_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating categories table:', err)
  })

  db.run(`
    CREATE TABLE IF NOT EXISTS rdcms_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT,
      excerpt TEXT,
      featured_image TEXT,
      category_id INTEGER,
      post_type TEXT DEFAULT 'post',
      published INTEGER DEFAULT 0,
      author_id INTEGER,
      publish_at DATETIME,
      featured_image_alt TEXT,
      featured_image_title TEXT,
      featured_image_caption TEXT,
      featured_image_description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES rdcms_categories(id),
      FOREIGN KEY (author_id) REFERENCES rdcms_users(id)
    )
  `, (err) => {
    if (err) console.error('Error creating posts table:', err)
  })

  db.run(`
    CREATE TABLE IF NOT EXISTS rdcms_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT,
      featured_image TEXT,
      category_id INTEGER,
      author_id INTEGER,
      parent_id INTEGER,
      published INTEGER DEFAULT 0,
      publish_at DATETIME,
      featured_image_alt TEXT,
      featured_image_title TEXT,
      featured_image_caption TEXT,
      featured_image_description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      layout_json TEXT,
      FOREIGN KEY (category_id) REFERENCES rdcms_categories(id),
      FOREIGN KEY (author_id) REFERENCES rdcms_users(id),
      FOREIGN KEY (parent_id) REFERENCES rdcms_pages(id)
    )
  `, (err) => {
    if (err) console.error('Error creating pages table:', err)
  })

  db.run(`
    CREATE TABLE IF NOT EXISTS rdcms_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      url TEXT NOT NULL,
      mime_type TEXT,
      size INTEGER,
      uploaded_by INTEGER,
      alt_text TEXT,
      title TEXT,
      caption TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploaded_by) REFERENCES rdcms_users(id)
    )
  `, (err) => {
    if (err) console.error('Error creating media table:', err)
  })

  db.run(`
    CREATE TABLE IF NOT EXISTS rdcms_navigation_menus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating navigation_menus table:', err)
  })

  db.run(`
    CREATE TABLE IF NOT EXISTS rdcms_navigation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      menu_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      page_id INTEGER,
      target TEXT DEFAULT '_self',
      order_index INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (menu_id) REFERENCES rdcms_navigation_menus(id),
      FOREIGN KEY (page_id) REFERENCES rdcms_pages(id)
    )
  `, (err) => {
    if (err) console.error('Error creating navigation_items table:', err)
  })

  db.run(`
    CREATE TABLE IF NOT EXISTS rdcms_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating settings table:', err)
  })

  db.run(`
    CREATE TABLE IF NOT EXISTS rdcms_design_settings (
      id INTEGER PRIMARY KEY,
      settings TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating design_settings table:', err)
  })

  db.run(`
    CREATE TABLE IF NOT EXISTS rdcms_themes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT,
      version TEXT,
      author TEXT,
      description TEXT,
      is_active INTEGER DEFAULT 0,
      settings TEXT,
      manifest TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating themes table:', err)
  })

  db.run(`
    CREATE TABLE IF NOT EXISTS rdcms_postmeta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      meta_key TEXT NOT NULL,
      meta_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES rdcms_posts(id)
    )
  `, (err) => {
    if (err) console.error('Error creating postmeta table:', err)
  })

  db.run(`
    CREATE TABLE IF NOT EXISTS rdcms_plugins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT,
      version TEXT,
      description TEXT,
      is_active INTEGER DEFAULT 0,
      settings TEXT,
      manifest TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating plugins table:', err)
  })
}

function migrateLegacyTables() {
  const copyTable = (legacy, modern, columns, transformRow = (row) => row) => {
    db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='${legacy}'`, (err, exists) => {
      if (err || !exists) return
      db.get(`SELECT COUNT(*) as count FROM ${modern}`, (err2, row) => {
        if (err2 || row?.count > 0) return
        db.all(`SELECT * FROM ${legacy}`, (err3, rows) => {
          if (err3 || !rows) return
          const placeholders = columns.map(() => '?').join(', ')
          rows.forEach((r) => {
            const mapped = transformRow(r)
            const values = columns.map(col => mapped[col] ?? null)
            db.run(`INSERT OR IGNORE INTO ${modern} (${columns.join(',')}) VALUES (${placeholders})`, values, (insertErr) => {
              if (insertErr) console.error(`Error migrating row from ${legacy} to ${modern}:`, insertErr)
            })
          })
        })
      })
    })
  }

  copyTable('users', 'rdcms_users', ['id', 'username', 'password', 'email', 'created_at'])
  copyTable('categories', 'rdcms_categories', ['id', 'name', 'slug', 'description', 'type', 'created_at'])
  copyTable('posts', 'rdcms_posts',
    ['id', 'title', 'slug', 'content', 'excerpt', 'featured_image', 'category_id', 'post_type', 'published', 'created_at', 'updated_at'],
    (row) => ({ ...row, post_type: row.post_type || 'post' })
  )
  copyTable('pages', 'rdcms_pages',
    ['id', 'title', 'slug', 'content', 'featured_image', 'category_id', 'published', 'created_at', 'updated_at', 'layout_json'])
  copyTable('media', 'rdcms_media', ['id', 'filename', 'url', 'mime_type', 'size', 'created_at'])
  copyTable('navigation_menus', 'rdcms_navigation_menus', ['id', 'name', 'slug', 'is_default', 'created_at'])
  copyTable('navigation_items', 'rdcms_navigation_items', ['id', 'menu_id', 'label', 'url', 'page_id', 'target', 'order_index', 'created_at'])
  copyTable('settings', 'rdcms_settings', ['id', 'key', 'value', 'updated_at'])
  copyTable('design_settings', 'rdcms_design_settings', ['id', 'settings', 'updated_at'])
  copyTable('themes', 'rdcms_themes', ['id', 'slug', 'name', 'version', 'author', 'description', 'is_active', 'settings', 'manifest', 'created_at'])
  copyTable('plugins', 'rdcms_plugins', ['id', 'slug', 'name', 'version', 'description', 'is_active', 'settings', 'manifest', 'created_at', 'updated_at'])
}

function addMissingColumns() {
  const ensureColumn = (table, column, definition) => {
    db.all(`PRAGMA table_info(${table})`, (err, rows) => {
      if (err || !rows || !Array.isArray(rows)) return
      const hasColumn = rows.some(r => r.name === column)
      if (!hasColumn) {
        db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (alterErr) => {
          if (alterErr) console.error(`Error adding column ${column} to ${table}:`, alterErr)
        })
      }
    })
  }

  ensureColumn('rdcms_pages', 'author_id', 'INTEGER')
  ensureColumn('rdcms_pages', 'parent_id', 'INTEGER')
  ensureColumn('rdcms_pages', 'publish_at', 'DATETIME')
  ensureColumn('rdcms_pages', 'featured_image_alt', 'TEXT')
  ensureColumn('rdcms_pages', 'featured_image_title', 'TEXT')
  ensureColumn('rdcms_pages', 'featured_image_caption', 'TEXT')
  ensureColumn('rdcms_pages', 'featured_image_description', 'TEXT')

  ensureColumn('rdcms_media', 'uploaded_by', 'INTEGER')
  ensureColumn('rdcms_media', 'alt_text', 'TEXT')
  ensureColumn('rdcms_media', 'title', 'TEXT')
  ensureColumn('rdcms_media', 'caption', 'TEXT')
  ensureColumn('rdcms_media', 'description', 'TEXT')

  ensureColumn('rdcms_posts', 'author_id', 'INTEGER')
  ensureColumn('rdcms_posts', 'publish_at', 'DATETIME')
  ensureColumn('rdcms_posts', 'featured_image_alt', 'TEXT')
  ensureColumn('rdcms_posts', 'featured_image_title', 'TEXT')
  ensureColumn('rdcms_posts', 'featured_image_caption', 'TEXT')
  ensureColumn('rdcms_posts', 'featured_image_description', 'TEXT')
}
function seedDefaults() {
  const defaultPosts = [
    { title: 'Welcome to ResDesCMS', slug: 'welcome-to-resdescms', excerpt: 'A starter post to demo the platform.', content: '<p>This is your new CMS. Edit or delete this post from the admin.</p>', featured_image: null },
    { title: 'Design System Tips', slug: 'design-system-tips', excerpt: 'How to keep your design consistent.', content: '<p>Use the Theme tab to tune colors, fonts, and layout.</p>', featured_image: null },
    { title: 'Launching Your Site', slug: 'launching-your-site', excerpt: 'Steps to go live.', content: '<p>Customize navigation, pages, and posts, then deploy!</p>', featured_image: null }
  ]

  const defaultPages = [
    {
      title: 'Posts',
      slug: 'posts',
      content: `
        <h1>Latest Posts</h1>
        <p>This is the default home page. It will list your posts once you add more.</p>
        <ul>
          <li><strong>Welcome to ResDesCMS</strong> - A starter post to demo the platform.</li>
          <li><strong>Design System Tips</strong> - How to keep your design consistent.</li>
          <li><strong>Launching Your Site</strong> - Steps to go live.</li>
        </ul>
      `
    },
    { title: 'About', slug: 'about', content: '<h1>About</h1><p>Edit this page to tell visitors about your brand.</p>' }
  ]

  defaultPosts.forEach(post => {
    db.get('SELECT id FROM rdcms_posts WHERE slug = ?', [post.slug], (err, row) => {
      if (err) return console.error('Error checking post:', err)
      if (!row) {
        db.run(
          `INSERT INTO rdcms_posts (title, slug, content, excerpt, featured_image, post_type, published) VALUES (?, ?, ?, ?, ?, 'post', 1)`,
          [post.title, post.slug, post.content, post.excerpt, post.featured_image],
          (insertErr) => insertErr && console.error('Error seeding post:', insertErr)
        )
      }
    })
  })

  seedPlaceholderPosts(20)

  defaultPages.forEach(page => {
    db.get('SELECT id FROM rdcms_pages WHERE slug = ?', [page.slug], (err, row) => {
      if (err) return console.error('Error checking page:', err)
      if (!row) {
        db.run(
          `INSERT INTO rdcms_pages (title, slug, content, published) VALUES (?, ?, ?, 1)`,
          [page.title, page.slug, page.content],
          (insertErr) => insertErr && console.error('Error seeding page:', insertErr)
        )
      }
    })
  })

  seedNavigationMenus()
}

function seedNavigationMenus() {
  const ensureDefaultMenu = () => {
    db.get('SELECT id FROM rdcms_navigation_menus WHERE is_default = 1', (err, row) => {
      if (err) return console.error('Error checking default navigation menu:', err)
      if (row) return ensureMenuItems(row.id)

      db.run(
        'INSERT INTO rdcms_navigation_menus (name, slug, is_default) VALUES (?, ?, 1)',
        ['Main Navigation', 'main'],
        function(insertErr) {
          if (insertErr) return console.error('Error creating default navigation menu:', insertErr)
          ensureMenuItems(this.lastID)
        }
      )
    })
  }

  const ensureMenuItems = (menuId) => {
    db.get('SELECT COUNT(*) as count FROM rdcms_navigation_items WHERE menu_id = ?', [menuId], (err, row) => {
      if (err) return console.error('Error counting navigation items:', err)
      if (row?.count > 0) return
      seedDefaultItems(menuId)
    })
  }

  const seedDefaultItems = (menuId) => {
    const defaults = [
      { label: 'Posts', slug: 'posts' },
      { label: 'About', slug: 'about' }
    ]

    defaults.forEach((item, idx) => {
      db.get('SELECT id, slug, title FROM rdcms_pages WHERE slug = ?', [item.slug], (err, pageRow) => {
        const label = pageRow?.title || item.label
        const url = pageRow ? `/page/${pageRow.slug}` : `/page/${item.slug}`
        const pageId = pageRow?.id || null
        db.run(
          'INSERT INTO rdcms_navigation_items (menu_id, label, url, page_id, target, order_index) VALUES (?, ?, ?, ?, ?, ?)',
          [menuId, label, url, pageId, '_self', idx],
          (insertErr) => insertErr && console.error('Error seeding navigation item:', insertErr)
        )
      })
    })
  }

  ensureDefaultMenu()
}

function seedPlaceholderPosts(count) {
  const placeholders = Array.from({ length: count }, (_, idx) => ({
    title: `Placeholder Post ${idx + 1}`,
    slug: `placeholder-post-${idx + 1}`,
    excerpt: 'Demo placeholder content for pagination testing.',
    content: `<p>This is placeholder post ${idx + 1} created for pagination samples.</p>`,
    featured_image: null
  }))

  placeholders.forEach(post => {
    db.get('SELECT id FROM rdcms_posts WHERE slug = ?', [post.slug], (err, row) => {
      if (err) return console.error('Error checking placeholder post:', err)
      if (!row) {
        db.run(
          `INSERT INTO rdcms_posts (title, slug, content, excerpt, featured_image, post_type, published) VALUES (?, ?, ?, ?, ?, 'post', 1)`,
          [post.title, post.slug, post.content, post.excerpt, post.featured_image],
          (insertErr) => insertErr && console.error('Error seeding placeholder post:', insertErr)
        )
      }
    })
  })
}

export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err)
      else resolve(this)
    })
  })
}

export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

export default { ensureTablesExist, run, get, all }

