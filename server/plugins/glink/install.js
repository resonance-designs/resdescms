export async function install(db) {
  await db.run(`
    CREATE TABLE IF NOT EXISTS rdcms_glink_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      scope TEXT,
      token_expiry INTEGER,
      account_email TEXT,
      account_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  const addColumn = async (colDef) => {
    try {
      await db.run(`ALTER TABLE rdcms_glink_tokens ADD COLUMN ${colDef}`)
    } catch (err) {
      // ignore if exists
    }
  }

  await addColumn('account_email TEXT')
  await addColumn('account_id TEXT')
  await addColumn('token_expiry INTEGER')
}
