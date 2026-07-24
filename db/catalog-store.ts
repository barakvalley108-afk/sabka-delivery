const menuTableSql = `CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  restaurant TEXT NOT NULL,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  is_available INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;
const settingsTableSql = `CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)`;
export async function ensureCatalogTables() {
  const {env}=await import("cloudflare:workers");
  if(!env.DB) throw new Error("Catalog database is unavailable");
  await env.DB.batch([env.DB.prepare(menuTableSql),env.DB.prepare(settingsTableSql)]);
  await env.DB.prepare("INSERT OR IGNORE INTO app_settings (key,value) VALUES ('delivery_fee','20')").run();
}
