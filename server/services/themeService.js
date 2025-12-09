import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import AdmZip from 'adm-zip'
import * as db from '../db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const themesRoot = path.join(__dirname, '..', 'themes')

async function ensureDir(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true })
}

async function loadManifestFromDir(themeDir, fallbackManifest) {
  let manifest = fallbackManifest || null

  const functionsPath = path.join(themeDir, 'functions.js')
  if (fs.existsSync(functionsPath)) {
    const importUrl = `${pathToFileURL(functionsPath).href}?t=${Date.now()}`
    const mod = await import(importUrl)
    manifest = mod.default || mod
  }

  if (!manifest) {
    const jsonPath = path.join(themeDir, 'theme.json')
    if (fs.existsSync(jsonPath)) {
      manifest = JSON.parse(await fs.promises.readFile(jsonPath, 'utf-8'))
    }
  }

  return manifest
}

function mergeSettings(manifest, storedSettingsJson) {
  const stored = storedSettingsJson ? JSON.parse(storedSettingsJson) : {}
  const defaults =
    manifest?.defaultSettings ||
    manifest?.settings ||
    (manifest?.settingsSchema || []).reduce((acc, field) => {
      if (field.default !== undefined) acc[field.key] = field.default
      return acc
    }, {})
  return { ...defaults, ...stored }
}

export async function hydrateTheme(row) {
  if (!row) return null
  const themeDir = path.join(themesRoot, row.slug)
  const manifest = await loadManifestFromDir(themeDir, row.manifest ? JSON.parse(row.manifest) : null)
  if (!manifest) return null

  const settings = mergeSettings(manifest, row.settings)

  return {
    slug: row.slug,
    name: manifest.name || row.name || row.slug,
    version: manifest.version || row.version,
    author: manifest.author || row.author,
    description: manifest.description || row.description,
    isActive: !!row.is_active,
    settings,
    settingsSchema: manifest.settingsSchema || [],
    style: manifest.style || 'style.css',
    styleUrl: `/themes/${row.slug}/${manifest.style || 'style.css'}`,
    manifest
  }
}

export async function ensureThemeTable() {
  await db.run(`
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
  `)
}

export async function listThemes() {
  const rows = await db.all('SELECT * FROM rdcms_themes')
  const hydrated = []
  for (const row of rows) {
    const theme = await hydrateTheme(row)
    if (theme) hydrated.push(theme)
  }
  return hydrated
}

export async function getActiveTheme() {
  const row = await db.get('SELECT * FROM rdcms_themes WHERE is_active = 1 LIMIT 1')
  return hydrateTheme(row)
}

export async function setActiveTheme(slug) {
  const existing = await db.get('SELECT * FROM rdcms_themes WHERE slug = ?', [slug])
  if (!existing) {
    throw new Error('Theme not found')
  }
  await db.run('UPDATE rdcms_themes SET is_active = 0')
  await db.run('UPDATE rdcms_themes SET is_active = 1 WHERE slug = ?', [slug])
  return hydrateTheme({ ...existing, is_active: 1 })
}

export async function saveThemeSettings(slug, settings) {
  const row = await db.get('SELECT * FROM rdcms_themes WHERE slug = ?', [slug])
  if (!row) throw new Error('Theme not found')
  await db.run('UPDATE rdcms_themes SET settings = ? WHERE slug = ?', [JSON.stringify(settings), slug])
  return hydrateTheme({ ...row, settings: JSON.stringify(settings) })
}

export async function registerThemeFromDir(themeDir, { forceActive = false } = {}) {
  const manifest = await loadManifestFromDir(themeDir)
  if (!manifest?.slug) {
    throw new Error('Theme manifest missing required slug')
  }
  const defaults = mergeSettings(manifest)
  await db.run(
    `
      INSERT INTO rdcms_themes (slug, name, version, author, description, is_active, settings, manifest)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        name = excluded.name,
        version = excluded.version,
        author = excluded.author,
        description = excluded.description,
        manifest = excluded.manifest
    `,
    [
      manifest.slug,
      manifest.name || manifest.slug,
      manifest.version || '1.0.0',
      manifest.author || 'Unknown',
      manifest.description || '',
      forceActive ? 1 : 0,
      JSON.stringify(defaults),
      JSON.stringify(manifest)
    ]
  )

  const active = await getActiveTheme()
  if (!active || forceActive) {
    await setActiveTheme(manifest.slug)
  }

  return hydrateTheme({
    slug: manifest.slug,
    name: manifest.name,
    version: manifest.version,
    author: manifest.author,
    description: manifest.description,
    is_active: forceActive ? 1 : 0,
    settings: JSON.stringify(defaults),
    manifest: JSON.stringify(manifest)
  })
}

export async function installThemeFromZip(zipPath) {
  await ensureDir(themesRoot)

  const tempDir = path.join(themesRoot, `tmp-${Date.now()}`)
  await ensureDir(tempDir)

  const zip = new AdmZip(zipPath)
  zip.extractAllTo(tempDir, true)

  const entries = await fs.promises.readdir(tempDir)
  const candidateDir = entries.length === 1 && (await fs.promises.stat(path.join(tempDir, entries[0]))).isDirectory()
    ? path.join(tempDir, entries[0])
    : tempDir

  const manifest = await loadManifestFromDir(candidateDir)
  if (!manifest?.slug) {
    await fs.promises.rm(tempDir, { recursive: true, force: true })
    throw new Error('Cannot install theme: functions.js or theme.json with a slug is required.')
  }

  const targetDir = path.join(themesRoot, manifest.slug)
  await fs.promises.rm(targetDir, { recursive: true, force: true })
  await ensureDir(targetDir)
  await fs.promises.cp(candidateDir, targetDir, { recursive: true })
  await fs.promises.rm(tempDir, { recursive: true, force: true })
  await fs.promises.rm(zipPath, { force: true })

  const theme = await registerThemeFromDir(targetDir)
  return theme
}

export async function bootstrapThemesFromDisk() {
  await ensureDir(themesRoot)
  const entries = await fs.promises.readdir(themesRoot)
  const themeDirs = []
  for (const entry of entries) {
    const full = path.join(themesRoot, entry)
    if ((await fs.promises.stat(full)).isDirectory()) {
      themeDirs.push(full)
    }
  }

  for (const dir of themeDirs) {
    try {
      const manifest = await loadManifestFromDir(dir)
      if (manifest?.slug) {
        const existing = await db.get('SELECT * FROM rdcms_themes WHERE slug = ?', [manifest.slug])
        if (!existing) {
          await registerThemeFromDir(dir)
        }
      }
    } catch (err) {
      console.error('Failed to bootstrap theme from', dir, err)
    }
  }

  const active = await getActiveTheme()
  if (!active) {
    const all = await listThemes()
    if (all.length > 0) {
      await setActiveTheme(all[0].slug)
    }
  }
}
