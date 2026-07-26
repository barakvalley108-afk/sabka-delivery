export async function getMarketDatabase(): Promise<D1Database> {
  const { env } = await import("cloudflare:workers");
  if (!env.DB) throw new Error("Market database is unavailable");
  return env.DB;
}

/**
 * Backwards-compatible runtime accessor.
 *
 * Schema creation and migrations are intentionally handled by the deployment
 * migration command. Customer requests must never perform DDL or seed writes.
 */
export async function ensureMarketTables(): Promise<D1Database> {
  return getMarketDatabase();
}
