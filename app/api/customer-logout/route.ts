import { ensureMarketTables } from "../../../db/market-store";
import { sha256 } from "../../../db/otp-utils";

function getSessionToken(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  return (
    cookie.match(/(?:^|; )sabka_session=([^;]+)/)?.[1] ||
    cookie.match(/(?:^|; )apna_session=([^;]+)/)?.[1] ||
    ""
  );
}

export async function POST(request: Request) {
  const token = getSessionToken(request);

  if (token) {
    try {
      const db = await ensureMarketTables();
      await db.prepare("DELETE FROM market_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
    } catch {
      // Cookie clear phir bhi hona chahiye.
    }
  }

  const headers = new Headers();
  headers.append("Set-Cookie", "sabka_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0");
  headers.append("Set-Cookie", "apna_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0");
  return Response.json({ success: true }, { headers });
}
