import { ensureMarketTables } from "./market-store";

/**
 * Kept for compatibility with existing imports.
 *
 * Schema creation, migrations, triggers, seed data and upgrade checks
 * must run only during deployment—not during customer or API requests.
 */
export async function ensureControlTables() {
  return ensureMarketTables();
}
