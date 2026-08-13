import { ensureControlTables } from "../../../../db/control-store";
import { getPanelSession } from "../../../panel-auth";

const MAX_DATA_URL = 500_000;

async function session() {
  const current = await getPanelSession("SUPER_ADMIN");
  return current?.role === "SUPER_ADMIN" ? current : null;
}

export async function GET() {
  const current = await session();
  if (!current) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const db = await ensureControlTables();
  const result = await db
    .prepare("SELECT key,value FROM market_settings WHERE key LIKE 'homepage_banner_%'")
    .all<{ key: string; value: string }>();
  return Response.json(
    { banners: result.results.map((row) => ({ key: row.key, image: row.value })) },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
  );
}

export async function POST(request: Request) {
  const current = await session();
  if (!current) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { banners?: Array<{ slot?: number; image?: string }> };
  const banners = Array.isArray(body.banners) ? body.banners : [];
  const db = await ensureControlTables();
  const statements = [];

  for (let index = 1; index <= 10; index += 1) {
    const requested = banners.find((entry) => Number(entry.slot) === index)?.image?.trim() || "";
    if (requested.length > MAX_DATA_URL) {
      return Response.json({ error: `Banner ${index} image bahut badi hai. Chhoti image use karo.` }, { status: 400 });
    }
    if (requested && !(requested.startsWith("/") || requested.startsWith("https://") || requested.startsWith("data:image/"))) {
      return Response.json({ error: `Banner ${index} image URL invalid hai.` }, { status: 400 });
    }
    statements.push(
      db.prepare(
        "INSERT INTO market_settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      ).bind(`homepage_banner_${index}`, requested),
    );
  }

  await db.batch(statements);
  return Response.json({ ok: true, updatedBy: current.username });
}
