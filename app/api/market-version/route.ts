import { ensureControlTables } from "../../../db/control-store";

export async function GET() {
  const db = await ensureControlTables();

  const revision = await db
    .prepare(
      `SELECT cast(version as integer) version,updated_at updatedAt
       FROM market_catalog_revision
       WHERE id=1`,
    )
    .first<{
      version: number;
      updatedAt: string;
    }>();

  return Response.json(
    revision || {
      version: 1,
      updatedAt: "",
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
