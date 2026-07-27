export async function getMarketDatabase() {
  const { env } = await import("cloudflare:workers");

  const db = env.DB;

  if (!db) {
    throw new Error("Market database is unavailable");
  }

  return db;
}

/**
 * Kept for compatibility with existing imports.
 *
 * Database tables must be created through deployment migrations.
 * Normal customer and API requests must never run schema creation.
 */
export async function ensureMarketTables() {
  return getMarketDatabase();
}
