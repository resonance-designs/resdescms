import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, 'server', 'cms.db')

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database error:', err)
    process.exit(1)
  }
  console.log('Connected to SQLite database')
})

db.all('SELECT username, password FROM users WHERE username=?', ['resonancedesigns'], (err, rows) => {
  if (err) {
    console.error('Query error:', err)
  } else {
    console.log('Users found:')
    rows.forEach(row => {
      console.log('Username:', row.username)
      console.log('Password hash:', row.password)
    })
  }
  db.close()
})
