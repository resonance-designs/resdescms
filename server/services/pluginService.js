import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import AdmZip from 'adm-zip'
import * as db from '../db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const pluginsRoot = path.join(__dirname, '..', 'plugins')

async function ensureDir(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true })
}

async function loadManifestFromDir(pluginDir, fallbackManifest) {
  let manifest = null

  const functionsPath = path.join(pluginDir, 'functions.js')
  if (fs.existsSync(functionsPath)) {
    const importUrl = `${pathToFileURL(functionsPath).href}?t=${Date.now()}`
    const mod = await import(importUrl)
    manifest = mod.default || mod
  }

  const jsonPath = path.join(pluginDir, 'plugin.json')
  if (!manifest && fs.existsSync(jsonPath)) {
    manifest = JSON.parse(await fs.promises.readFile(jsonPath, 'utf-8'))
  }

  // merge fallback manifest (from DB) if present but prefer on-disk values
  if (fallbackManifest) {
    manifest = { ...fallbackManifest, ...(manifest || {}) }
  }

  return manifest
}

function mergeSettings(manifest, storedSettingsJson) {
  const stored = storedSettingsJson ? JSON.parse(storedSettingsJson) : {}
  const defaults = manifest?.defaultSettings || {}
  return { ...defaults, ...stored }
}

export async function hydratePlugin(row) {
  if (!row) return null
  const pluginDir = path.join(pluginsRoot, row.slug)
  const manifest = await loadManifestFromDir(pluginDir, row.manifest ? JSON.parse(row.manifest) : null)
  if (!manifest) return null

  const settings = mergeSettings(manifest, row.settings)

  return {
    slug: row.slug,
    name: manifest.name || row.name || row.slug,
    version: manifest.version || row.version,
    description: manifest.description || row.description,
    isActive: !!row.is_active,
    settings,
    manifest: manifest || {},
    adminMenu: manifest.adminMenu || [],
    adminView: manifest.adminView || manifest.admin_view || `/server/plugins/${row.slug}/admin/index.vue`,
    client: manifest.client || {}
  }
}

export async function ensurePluginTable() {
  await db.run(`
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
  `)
}

export async function listPlugins() {
  const rows = await db.all('SELECT * FROM rdcms_plugins')
  const hydrated = []
  for (const row of rows) {
    const plugin = await hydratePlugin(row)
    if (plugin) hydrated.push(plugin)
  }
  return hydrated
}

async function runInstallScript(pluginDir) {
  const installPath = path.join(pluginDir, 'install.js')
  if (!fs.existsSync(installPath)) return
  const mod = await import(pathToFileURL(installPath).href)
  if (typeof mod.install === 'function') {
    await mod.install(db)
  }
}

async function runUninstallScript(pluginDir) {
  const uninstallPath = path.join(pluginDir, 'uninstall.js')
  if (!fs.existsSync(uninstallPath)) return
  const mod = await import(pathToFileURL(uninstallPath).href)
  if (typeof mod.uninstall === 'function') {
    await mod.uninstall(db)
  }
}

export async function activatePlugin(slug) {
  const existing = await db.get('SELECT * FROM rdcms_plugins WHERE slug = ?', [slug])
  if (!existing) {
    throw new Error('Plugin not found')
  }
  await db.run('UPDATE rdcms_plugins SET is_active = 1 WHERE slug = ?', [slug])
  const pluginDir = path.join(pluginsRoot, slug)
  await runInstallScript(pluginDir)
  return hydratePlugin({ ...existing, is_active: 1 })
}

export async function deactivatePlugin(slug) {
  const existing = await db.get('SELECT * FROM rdcms_plugins WHERE slug = ?', [slug])
  if (!existing) throw new Error('Plugin not found')
  await db.run('UPDATE rdcms_plugins SET is_active = 0 WHERE slug = ?', [slug])
  return hydratePlugin({ ...existing, is_active: 0 })
}

export async function savePluginSettings(slug, settings) {
  const row = await db.get('SELECT * FROM rdcms_plugins WHERE slug = ?', [slug])
  if (!row) throw new Error('Plugin not found')
  await db.run('UPDATE rdcms_plugins SET settings = ? WHERE slug = ?', [JSON.stringify(settings), slug])
  return hydratePlugin({ ...row, settings: JSON.stringify(settings) })
}

export async function registerPluginFromDir(pluginDir, { forceActive = false } = {}) {
  const manifest = await loadManifestFromDir(pluginDir)
  if (!manifest?.slug) {
    throw new Error('Plugin manifest missing required slug')
  }
  const defaults = mergeSettings(manifest)
  await db.run(
    `
      INSERT INTO rdcms_plugins (slug, name, version, description, is_active, settings, manifest)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        name = excluded.name,
        version = excluded.version,
        description = excluded.description,
        manifest = excluded.manifest
    `,
    [
      manifest.slug,
      manifest.name || manifest.slug,
      manifest.version || '1.0.0',
      manifest.description || '',
      forceActive ? 1 : 0,
      JSON.stringify(defaults),
      JSON.stringify(manifest)
    ]
  )

  if (forceActive) {
    await activatePlugin(manifest.slug)
  }

  return hydratePlugin({
    slug: manifest.slug,
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    is_active: forceActive ? 1 : 0,
    settings: JSON.stringify(defaults),
    manifest: JSON.stringify(manifest)
  })
}

export async function installPluginFromZip(zipPath) {
  await ensureDir(pluginsRoot)

  const tempDir = path.join(pluginsRoot, `tmp-${Date.now()}`)
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
    throw new Error('Cannot install plugin: functions.js or plugin.json with a slug is required.')
  }

  const targetDir = path.join(pluginsRoot, manifest.slug)
  await fs.promises.rm(targetDir, { recursive: true, force: true })
  await ensureDir(targetDir)
  await fs.promises.cp(candidateDir, targetDir, { recursive: true })
  await fs.promises.rm(tempDir, { recursive: true, force: true })
  await fs.promises.rm(zipPath, { force: true })

  const plugin = await registerPluginFromDir(targetDir)
  return plugin
}

export async function deletePlugin(slug, { deleteFiles = false, deleteData = false } = {}) {
  const existing = await db.get('SELECT * FROM rdcms_plugins WHERE slug = ?', [slug])
  if (!existing) throw new Error('Plugin not found')
  const pluginDir = path.join(pluginsRoot, slug)

  // deactivate first
  await db.run('UPDATE rdcms_plugins SET is_active = 0 WHERE slug = ?', [slug])

  if (deleteData) {
    try {
      await runUninstallScript(pluginDir)
    } catch (err) {
      console.error('Plugin uninstall failed', err)
    }
  }

  await db.run('DELETE FROM rdcms_plugins WHERE slug = ?', [slug])

  if (deleteFiles) {
    await fs.promises.rm(pluginDir, { recursive: true, force: true })
  }

  return true
}

export async function bootstrapPluginsFromDisk() {
  await ensureDir(pluginsRoot)
  const entries = await fs.promises.readdir(pluginsRoot)
  const pluginDirs = []
  for (const entry of entries) {
    const full = path.join(pluginsRoot, entry)
    if ((await fs.promises.stat(full)).isDirectory()) {
      pluginDirs.push(full)
    }
  }

  for (const dir of pluginDirs) {
    try {
      const manifest = await loadManifestFromDir(dir)
      if (manifest?.slug) {
        const existing = await db.get('SELECT * FROM rdcms_plugins WHERE slug = ?', [manifest.slug])
        if (!existing) {
          await registerPluginFromDir(dir)
        }
      }
    } catch (err) {
      console.error('Failed to bootstrap plugin from', dir, err)
    }
  }
}
