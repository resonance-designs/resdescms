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
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating users table:', err)

      db.get('SELECT * FROM users WHERE username = ?', ['resonancedesigns'], (err, row) => {
        if (!row && !err) {
          const hashedPassword = bcryptjs.hashSync('i4Vc$oUU%AR!WK3W', 10)
          db.run(
            'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
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
      CREATE TABLE IF NOT EXISTS categories (
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
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        content TEXT,
        excerpt TEXT,
        featured_image TEXT,
        category_id INTEGER,
        published INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `, (err) => {
      if (err) console.error('Error creating posts table:', err)
    })

    db.run(`
      CREATE TABLE IF NOT EXISTS pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        content TEXT,
        featured_image TEXT,
        category_id INTEGER,
        published INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `, (err) => {
      if (err) console.error('Error creating pages table:', err)
    })

    db.run(`
      CREATE TABLE IF NOT EXISTS media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        url TEXT NOT NULL,
        mime_type TEXT,
        size INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating media table:', err)
    })

    db.run(`
      CREATE TABLE IF NOT EXISTS navigation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        label TEXT NOT NULL,
        url TEXT NOT NULL,
        page_id INTEGER,
        order_index INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (page_id) REFERENCES pages(id)
      )
    `, (err) => {
      if (err) console.error('Error creating navigation table:', err)
    })

    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating settings table:', err)
    })

    db.run(`
      CREATE TABLE IF NOT EXISTS design_settings (
        id INTEGER PRIMARY KEY,
        settings TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating design_settings table:', err)
    })

    db.run(`
      CREATE TABLE IF NOT EXISTS themes (
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

    addMissingColumns()
    seedDefaults()
  })
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
          <li><strong>Welcome to ResDesCMS</strong> — A starter post to demo the platform.</li>
          <li><strong>Design System Tips</strong> — How to keep your design consistent.</li>
          <li><strong>Launching Your Site</strong> — Steps to go live.</li>
        </ul>
      `
    },
    { title: 'About', slug: 'about', content: '<h1>About</h1><p>Edit this page to tell visitors about your brand.</p>' }
  ]

  defaultPosts.forEach(post => {
    db.get('SELECT id FROM posts WHERE slug = ?', [post.slug], (err, row) => {
      if (err) return console.error('Error checking post:', err)
      if (!row) {
        db.run(
          `INSERT INTO posts (title, slug, content, excerpt, featured_image, published) VALUES (?, ?, ?, ?, ?, 1)`,
          [post.title, post.slug, post.content, post.excerpt, post.featured_image],
          (insertErr) => insertErr && console.error('Error seeding post:', insertErr)
        )
      }
    })
  })

  defaultPages.forEach(page => {
    db.get('SELECT id FROM pages WHERE slug = ?', [page.slug], (err, row) => {
      if (err) return console.error('Error checking page:', err)
      if (!row) {
        db.run(
          `INSERT INTO pages (title, slug, content, published) VALUES (?, ?, ?, 1)`,
          [page.title, page.slug, page.content],
          (insertErr) => insertErr && console.error('Error seeding page:', insertErr)
        )
      }
    })
  })
}

function addMissingColumns() {
  const addColumnIfMissing = (table, column, definition) => {
    db.get(`PRAGMA table_info(${table})`, (err, row) => {
      if (err || !row) return
      db.all(`PRAGMA table_info(${table})`, (infoErr, columns) => {
        if (infoErr) return
        const exists = columns.some(col => col.name === column)
        if (!exists) {
          db.run(`ALTER TABLE ${table} ADD COLUMN ${definition}`, alterErr => {
            if (alterErr) console.error(`Error adding column ${column} to ${table}:`, alterErr)
          })
        }
      })
    })
  }

  addColumnIfMissing('posts', 'category_id', 'category_id INTEGER')
  addColumnIfMissing('pages', 'category_id', 'category_id INTEGER')
  addColumnIfMissing('posts', 'excerpt', 'excerpt TEXT')
  addColumnIfMissing('posts', 'featured_image', 'featured_image TEXT')
  addColumnIfMissing('pages', 'featured_image', 'featured_image TEXT')
  addColumnIfMissing('posts', 'published', 'published INTEGER DEFAULT 0')
  addColumnIfMissing('pages', 'published', 'published INTEGER DEFAULT 0')
  addColumnIfMissing('navigation', 'page_id', 'page_id INTEGER')
  addColumnIfMissing('pages', 'layout_json', 'layout_json TEXT')
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
