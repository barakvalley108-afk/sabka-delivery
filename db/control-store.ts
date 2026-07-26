import { getMarketDatabase } from "./market-store";

/**
 * Backwards-compatible runtime accessor.
 *
 * The previous implementation bootstrapped the complete schema, triggers,
 * upgrades and seed data from request handlers. All of that work now belongs
 * to the explicit deployment migration. Runtime callers only receive env.DB.
 */
export async function ensureControlTables(): Promise<D1Database> {
  return getMarketDatabase();
}
