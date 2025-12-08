import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import db from './db.js'
import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import designRoutes from './routes/design.js'
import categoriesRoutes from './routes/categories.js'
import postsRoutes from './routes/posts.js'
import pagesRoutes from './routes/pages.js'
import mediaRoutes from './routes/media.js'
import navigationRoutes from './routes/navigation.js'
import themeRoutes from './routes/themes.js'
import { themesRoot, bootstrapThemesFromDisk } from './services/themeService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/themes', express.static(themesRoot))

app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/design', designRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/posts', postsRoutes)
app.use('/api/pages', pagesRoutes)
app.use('/api/media', mediaRoutes)
app.use('/api/navigation', navigationRoutes)
app.use('/api/themes', themeRoutes)

app.listen(PORT, () => {
  console.log(`ResDesCMS Server running on http://localhost:${PORT}`)
  db.ensureTablesExist()
  bootstrapThemesFromDisk().catch(err => console.error('Theme bootstrap failed:', err))
})
