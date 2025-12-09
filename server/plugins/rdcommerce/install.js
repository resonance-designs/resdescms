export async function install(db) {
  await db.run(`
    CREATE TABLE IF NOT EXISTS rdcms_rdcommerce_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      token_type TEXT,
      scope TEXT,
      expires_at INTEGER,
      account_id TEXT,
      account_name TEXT,
      location_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(provider)
    )
  `)

  // Add any missing columns for future migrations
  const addColumn = async (colDef) => {
    try {
      await db.run(`ALTER TABLE rdcms_rdcommerce_tokens ADD COLUMN ${colDef}`)
    } catch (err) {
      // ignore if exists
    }
  }

  await addColumn('location_id TEXT')
  await addColumn('account_name TEXT')
}