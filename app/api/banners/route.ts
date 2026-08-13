import { ensureControlTables } from "../../../db/control-store";

const DEFAULT_BANNERS = [
  "/images/hero-food-collage.png",
  "/images/hero-food.png",
  "/images/biryani-card.png",
  "/images/curry-card.png",
  "/images/grocery-daily-needs.png",
  "/images/grocery-vegetables.png",
  "/images/grocery-staples.png",
  "/images/electronics-hero.webp",
  "/images/sabka-delivery-logo.png",
  "/images/hero-food-collage.png",
];

export async function GET() {
  const db = await ensureControlTables();
  const result = await db
    .prepare("SELECT key,value FROM market_settings WHERE key LIKE 'homepage_banner_%'")
    .all<{ key: string; value: string }>();

  const configured = new Map(result.results.map((row) => [String(row.key), String(row.value)]));
  const banners = DEFAULT_BANNERS.map((fallback, index) => configured.get(`homepage_banner_${index + 1}`) || fallback);

  return Response.json(
    { banners },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
  );
}
