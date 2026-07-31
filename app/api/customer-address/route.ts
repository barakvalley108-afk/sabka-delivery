import { ensureMarketTables } from "../../../db/market-store";
import { sha256 } from "../../../db/otp-utils";

type SessionUser = {
  id: number;
  mobile: string;
  name: string | null;
};

type AddressBody = {
  recipientName?: unknown;
  address?: unknown;
  landmark?: unknown;
  area?: unknown;
};

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function sessionToken(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  return (
    cookie.match(/(?:^|; )sabka_session=([^;]+)/)?.[1] ||
    cookie.match(/(?:^|; )apna_session=([^;]+)/)?.[1] ||
    ""
  );
}

async function getSessionUser(request: Request) {
  const token = sessionToken(request);
  if (!token) return null;

  const db = await ensureMarketTables();
  const tokenHash = await sha256(token);
  const user = await db
    .prepare(
      `SELECT u.id, u.mobile, u.name
       FROM market_sessions s
       JOIN market_users u ON u.id = s.user_id
       WHERE s.token_hash = ?
         AND s.expires_at > CURRENT_TIMESTAMP`,
    )
    .bind(tokenHash)
    .first<SessionUser>();

  return user ? { db, user } : null;
}

export async function GET(request: Request) {
  const session = await getSessionUser(request);
  if (!session) return json({ error: "Unauthorized" }, 401);

  const address = await session.db
    .prepare(
      `SELECT recipient_name recipientName,
              mobile,
              address_line address,
              landmark,
              area,
              pincode
       FROM market_customer_addresses
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT 1`,
    )
    .bind(session.user.id)
    .first();

  return json({ address: address || null });
}

export async function POST(request: Request) {
  const session = await getSessionUser(request);
  if (!session) return json({ error: "Unauthorized" }, 401);

  let body: AddressBody;
  try {
    body = (await request.json()) as AddressBody;
  } catch {
    return json({ error: "Invalid address details" }, 400);
  }

  const recipientName = String(body.recipientName ?? session.user.name ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);
  const address = String(body.address ?? "").trim().replace(/\s+/g, " ").slice(0, 500);
  const landmark = String(body.landmark ?? "").trim().replace(/\s+/g, " ").slice(0, 150);
  const area = String(body.area ?? "Lala Bazar").trim().replace(/\s+/g, " ").slice(0, 100);

  if (recipientName.length < 2 || address.length < 8) {
    return json({ error: "Valid name aur address required" }, 400);
  }

  const auth = await session.db
    .prepare("SELECT pincode FROM market_customer_auth WHERE user_id = ?")
    .bind(session.user.id)
    .first<{ pincode: string }>();

  const pincode = String(auth?.pincode || "").replace(/\D/g, "").slice(0, 6);

  await session.db.batch([
    session.db
      .prepare("DELETE FROM market_customer_addresses WHERE user_id = ?")
      .bind(session.user.id),
    session.db
      .prepare(
        `INSERT INTO market_customer_addresses
           (user_id, recipient_name, mobile, address_line, landmark, area, pincode)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        session.user.id,
        recipientName,
        session.user.mobile,
        address,
        landmark,
        area || "Lala Bazar",
        pincode,
      ),
  ]);

  return json({ message: "Address saved", address: { recipientName, mobile: session.user.mobile, address, landmark, area, pincode } });
}
