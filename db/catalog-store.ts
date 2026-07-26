import { getMarketDatabase } from "./market-store";

/** Runtime compatibility helper. Database setup runs during deployment only. */
export async function ensureCatalogTables(): Promise<D1Database> {
  return getMarketDatabase();
}
