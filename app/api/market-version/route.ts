import { ensureControlTables } from "../../../db/control-store";

const VERSION_READ_TIMEOUT_MS = 1_500;

export async function GET() {
  try {
    const db = await ensureControlTables();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error("Catalog version read timed out")),
        VERSION_READ_TIMEOUT_MS,
      );
    });
    const revision = await Promise.race([
      db
        .prepare(
          "SELECT version,updated_at updatedAt FROM market_catalog_revision WHERE id=1",
        )
        .first<{ version: number; updatedAt: string }>(),
      timeout,
    ]).finally(() => {
      if (timeoutId) clearTimeout(timeoutId);
    });

    return Response.json(revision || { version: 1, updatedAt: "" }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (error) {
    console.error("Catalog version read failed", error);
    return Response.json(
      { error: "Catalog version temporarily unavailable" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      },
    );
  }
}
