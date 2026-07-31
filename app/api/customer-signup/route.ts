import { ensureMarketTables } from "../../../db/market-store";
import {
  createCustomerPinSalt,
  getCustomerRequestMeta,
  hashCustomerPin,
  isValidCustomerMobile,
  isValidCustomerName,
  isValidCustomerPin,
  isValidCustomerPincode,
  normalizeCustomerMobile,
  normalizeCustomerName,
  normalizeCustomerPin,
  normalizeCustomerPincode,
} from "../../../db/customer-pin";

type Runtime = {
  CUSTOMER_PIN_SECRET?: string;
  OTP_SECRET?: string;
};

type SignupBody = {
  name?: unknown;
  mobile?: unknown;
  pincode?: unknown;
  pin?: unknown;
};

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  let body: SignupBody;

  try {
    body = (await request.json()) as SignupBody;
  } catch {
    return json({ error: "Signup details valid nahi hain" }, 400);
  }

  const name = normalizeCustomerName(body.name);
  const mobile = normalizeCustomerMobile(body.mobile);
  const pincode = normalizeCustomerPincode(body.pincode);
  const pin = normalizeCustomerPin(body.pin);

  if (!isValidCustomerName(name)) {
    return json({ error: "Apna valid name daalo" }, 400);
  }

  if (!isValidCustomerMobile(mobile)) {
    return json({ error: "Valid 10-digit mobile number daalo" }, 400);
  }

  if (!isValidCustomerPincode(pincode)) {
    return json({ error: "Valid 6-digit pincode daalo" }, 400);
  }

  if (!isValidCustomerPin(pin)) {
    return json({ error: "4-digit login PIN daalo" }, 400);
  }

  const { env } = await import("cloudflare:workers");
  const runtime = env as unknown as Runtime;
  const pinSecret = runtime.CUSTOMER_PIN_SECRET || runtime.OTP_SECRET;

  if (!pinSecret) {
    return json(
      { error: "Customer PIN security secret configure nahi hai" },
      503,
    );
  }

  const db = await ensureMarketTables();
  const meta = getCustomerRequestMeta(request);

  const recent = await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM market_customer_login_activity
       WHERE created_at > datetime('now', '-15 minutes')
         AND (mobile = ? OR (? <> '' AND ip_address = ?))`,
    )
    .bind(mobile, meta.ip, meta.ip)
    .first<{ count: number }>();

  if (Number(recent?.count || 0) >= 10) {
    return json(
      { error: "Bahut signup attempts hue. 15 minute baad try karo." },
      429,
    );
  }

  const existing = await db
    .prepare(
      `SELECT u.id, a.user_id AS auth_user_id
       FROM market_users u
       LEFT JOIN market_customer_auth a ON a.user_id = u.id
       WHERE u.mobile = ?`,
    )
    .bind(mobile)
    .first<{ id: number; auth_user_id: number | null }>();

  if (existing?.auth_user_id) {
    await db
      .prepare(
        `INSERT INTO market_customer_login_activity
           (mobile, success, ip_address, user_agent)
         VALUES (?, 0, ?, ?)`,
      )
      .bind(mobile, meta.ip, meta.userAgent)
      .run();

    return json(
      { error: "Ye phone number pehle se registered hai. Login karo." },
      409,
    );
  }

  let userId = existing?.id;

  if (userId) {
    await db
      .prepare("UPDATE market_users SET name = ?, is_verified = 1 WHERE id = ?")
      .bind(name, userId)
      .run();
  } else {
    await db
      .prepare(
        "INSERT INTO market_users (mobile, name, is_verified) VALUES (?, ?, 1)",
      )
      .bind(mobile, name)
      .run();

    const createdUser = await db
      .prepare("SELECT id FROM market_users WHERE mobile = ?")
      .bind(mobile)
      .first<{ id: number }>();

    if (!createdUser) {
      return json({ error: "Account create nahi hua. Dobara try karo." }, 500);
    }

    userId = createdUser.id;
  }

  const salt = createCustomerPinSalt();
  const pinHash = await hashCustomerPin(mobile, pin, salt, pinSecret);

  try {
    await db
      .prepare(
        `INSERT INTO market_customer_auth
           (user_id, pincode, pin_salt, pin_hash, updated_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      )
      .bind(userId, pincode, salt, pinHash)
      .run();
  } catch {
    await db
      .prepare(
        `INSERT INTO market_customer_login_activity
           (mobile, success, ip_address, user_agent)
         VALUES (?, 0, ?, ?)`,
      )
      .bind(mobile, meta.ip, meta.userAgent)
      .run();

    return json(
      { error: "Ye phone number pehle se registered hai. Login karo." },
      409,
    );
  }

  await db
    .prepare(
      `INSERT INTO market_customer_login_activity
         (mobile, success, ip_address, user_agent)
       VALUES (?, 1, ?, ?)`,
    )
    .bind(mobile, meta.ip, meta.userAgent)
    .run();

  return json(
    {
      message: "Account successfully create ho gaya. Ab login karo.",
      redirectTo: "login",
      mobile,
    },
    201,
  );
}
