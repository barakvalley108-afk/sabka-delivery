import { ensureMarketTables } from "../../../db/market-store";
import { sha256 } from "../../../db/otp-utils";

type SessionUser = { id: number; mobile: string; name: string | null };
type ProfileBody = { name?: unknown; photoData?: unknown };

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function tokenFrom(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  return cookie.match(/(?:^|; )sabka_session=([^;]+)/)?.[1] || cookie.match(/(?:^|; )apna_session=([^;]+)/)?.[1] || "";
}

async function sessionUser(request: Request) {
  const token = tokenFrom(request);
  if (!token) return null;
  const db = await ensureMarketTables();
  const hash = await sha256(token);
  const user = await db.prepare(`SELECT u.id,u.mobile,u.name FROM market_sessions s JOIN market_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>CURRENT_TIMESTAMP`).bind(hash).first<SessionUser>();
  return user ? { db, user } : null;
}

export async function GET(request: Request) {
  const session = await sessionUser(request);
  if (!session) return json({ error: "Unauthorized" }, 401);
  const profile = await session.db.prepare("SELECT photo_data photoData FROM market_customer_profiles WHERE user_id=?").bind(session.user.id).first<{ photoData: string }>();
  return json({ user: { ...session.user, photoData: profile?.photoData || "" } });
}

export async function POST(request: Request) {
  const session = await sessionUser(request);
  if (!session) return json({ error: "Unauthorized" }, 401);

  let body: ProfileBody;
  try { body = (await request.json()) as ProfileBody; }
  catch { return json({ error: "Invalid profile details" }, 400); }

  const name = String(body.name ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  const photoData = String(body.photoData ?? "");
  if (name.length < 2) return json({ error: "Valid name required" }, 400);
  if (photoData && !/^data:image\/(jpeg|png|webp);base64,/i.test(photoData)) return json({ error: "Only JPG, PNG or WEBP photo allowed" }, 400);
  if (photoData.length > 470000) return json({ error: "Photo size zyada hai. Chhoti photo choose karo." }, 400);

  await session.db.batch([
    session.db.prepare("UPDATE market_users SET name=? WHERE id=?").bind(name, session.user.id),
    session.db.prepare(`INSERT INTO market_customer_profiles (user_id,photo_data,updated_at) VALUES (?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET photo_data=excluded.photo_data,updated_at=CURRENT_TIMESTAMP`).bind(session.user.id, photoData),
  ]);

  return json({ message: "Profile updated", user: { id: session.user.id, mobile: session.user.mobile, name, photoData } });
}
