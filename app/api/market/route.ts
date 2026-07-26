import { getMarketCatalog } from "../../../db/market-catalog";

export async function GET() {
  try {
    return Response.json(await getMarketCatalog(), {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Catalog temporarily unavailable" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      },
    );
  }
}
