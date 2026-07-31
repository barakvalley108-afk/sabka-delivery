import { ensureControlTables } from "../../../../db/control-store";
import {
  createCustomerPinSalt,
  hashCustomerPin,
  isValidCustomerMobile,
  isValidCustomerPin,
  normalizeCustomerMobile,
  normalizeCustomerPin,
} from "../../../../db/customer-pin";
import { getPanelSession } from "../../../panel-auth";

type Runtime = {
  CUSTOMER_PIN_SECRET?: string;
  OTP_SECRET?: string;
};

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function requireSuperAdmin() {
  const session = await getPanelSession("SUPER_ADMIN");
  return session?.role === "SUPER_ADMIN" ? session : null;
}

export async function GET(request: Request) {
  const session = await requireSuperAdmin();
  if (!session) return json({ error: "Unauthorized" }, 401);

  const url = new URL(request.url);
  const search = normalizeCustomerMobile(url.searchParams.get("search"));
  const db = await ensureControlTables();

  const result = search
    ? await db
        .prepare(
          `SELECT u.id, u.name, u.mobile, a.pincode, a.updated_at updatedAt
           FROM market_users u
           JOIN market_customer_auth a ON a.user_id = u.id
           WHERE u.mobile LIKE ?
           ORDER BY u.id DESC
           LIMIT 50`,
        )
        .bind(`%${search}%`)
        .all()
    : await db
        .prepare(
          `SELECT u.id, u.name, u.mobile, a.pincode, a.updated_at updatedAt
           FROM market_users u
           JOIN market_customer_auth a ON a.user_id = u.id
           ORDER BY u.id DESC
           LIMIT 100`,
        )
        .all();

  return json({ customers: result.results });
}

export async function POST(request: Request) {
  const session = await requireSuperAdmin();
  if (!session) return json({ error: "Unauthorized" }, 401);

  let body: { mobile?: unknown; pin?: unknown };
  try {
    body = (await request.json()) as { mobile?: unknown; pin?: unknown };
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const mobile = normalizeCustomerMobile(body.mobile);
  const pin = normalizeCustomerPin(body.pin);

  if (!isValidCustomerMobile(mobile)) {
    return json({ error: "Valid customer mobile number daalo" }, 400);
  }
  if (!isValidCustomerPin(pin)) {
    return json({ error: "Naya PIN exactly 4 digit ka hona chahiye" }, 400);
  }

  const { env } = await import("cloudflare:workers");
  const runtime = env as unknown as Runtime;
  const secret = runtime.CUSTOMER_PIN_SECRET || runtime.OTP_SECRET;
  if (!secret) {
    return json({ error: "CUSTOMER_PIN_SECRET configure nahi hai" }, 503);
  }

  const db = await ensureControlTables();
  const customer = await db
    .prepare(
      `SELECT u.id
       FROM market_users u
       JOIN market_customer_auth a ON a.user_id = u.id
       WHERE u.mobile = ?`,
    )
    .bind(mobile)
    .first<{ id: number }>();

  if (!customer) return json({ error: "Customer account nahi mila" }, 404);

  const salt = createCustomerPinSalt();
  const pinHash = await hashCustomerPin(mobile, pin, salt, secret);

  await db.batch([
    db
      .prepare(
        `UPDATE market_customer_auth
         SET pin_salt = ?, pin_hash = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
      )
      .bind(salt, pinHash, customer.id),
    db.prepare("DELETE FROM market_sessions WHERE user_id = ?").bind(customer.id),
  ]);

  try {
    await db
      .prepare(
        `INSERT INTO market_admin_activity (username, action, target, details)
         VALUES (?, 'RESET_CUSTOMER_PIN', ?, ?)`,
      )
      .bind(
        session.displayName,
        mobile,
        JSON.stringify({ userId: customer.id, sessionsRevoked: true }),
      )
      .run();
  } catch {
    // PIN reset must not fail only because audit logging failed.
  }

  return json({
    message: "Customer PIN reset ho gaya. Purane sessions logout kar diye gaye.",
  });
}
