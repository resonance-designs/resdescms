export async function install(db) {
  await db.run(`
    CREATE TABLE IF NOT EXISTS rdcms_gitlink_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      access_token TEXT,
      token_type TEXT,
      scope TEXT,
      account_login TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
}
