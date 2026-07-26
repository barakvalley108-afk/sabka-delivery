import { getMarketCatalog } from "../../../db/market-catalog";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const response = Response.json(
      await getMarketCatalog({
        section: url.searchParams.get("section") || "FOOD",
        offset: Number(url.searchParams.get("offset") || 0),
      }),
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      },
    );
    return response;
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
