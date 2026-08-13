import { ensureControlTables } from "../../../db/control-store";

const DEFAULT_FOOD_BANNERS = [
  "/images/hero-food-collage.png",
  "/images/hero-food.png",
  "/images/biryani-card.png",
  "/images/curry-card.png",
  "/images/hero-food-collage.png",
];

const DEFAULT_GROCERY_BANNERS = [
  "/images/grocery-daily-needs.png",
  "/images/grocery-vegetables.png",
  "/images/grocery-staples.png",
  "/images/grocery-daily-needs.png",
  "/images/grocery-vegetables.png",
];

function configuredBanners(configured: Map<string, string>, start: number, fallbacks: string[]) {
  return fallbacks.map((fallback, index) => configured.get(`homepage_banner_${start + index}`) || fallback);
}

export async function GET() {
  const db = await ensureControlTables();
  const result = await db
    .prepare("SELECT key,value FROM market_settings WHERE key LIKE 'homepage_banner_%'")
    .all<{ key: string; value: string }>();

  const configured = new Map(result.results.map((row) => [String(row.key), String(row.value)]));
  const foodBanners = configuredBanners(configured, 1, DEFAULT_FOOD_BANNERS);
  const groceryBanners = configuredBanners(configured, 6, DEFAULT_GROCERY_BANNERS);

  return Response.json(
    {
      banners: foodBanners,
      foodBanners,
      groceryBanners,
    },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
  );
}
