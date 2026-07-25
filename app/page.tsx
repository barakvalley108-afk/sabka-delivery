import { getInitialMarketCatalog } from "../db/market-catalog";
import MarketHome, { type MarketCatalog } from "./market-home";

export const dynamic = "force-dynamic";

export default async function Page() {
  const initialMarket = await getInitialMarketCatalog();
  return (
    <MarketHome initialMarket={initialMarket as unknown as MarketCatalog} />
  );
}
