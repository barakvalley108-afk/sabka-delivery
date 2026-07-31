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
import { randomHex, sha256 } from "../../../db/otp-utils";

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

type ServiceArea = {
  id: number;
  name: string;
  pin_code: string;
  delivery_charge: number;
  min_order: number;
  free_delivery_above: number;
};

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function json(
  body: Record<string, unknown>,
  status = 200,
  headers?: Headers,
) {
  const responseHeaders = headers ?? new Headers();
  responseHeaders.set("Cache-Control", "no-store");

  return Response.json(body, {
    status,
    headers: responseHeaders,
  });
}

async function recordSignupAttempt(
  db: D1Database,
  mobile: string,
  success: boolean,
  ip: string,
  userAgent: string,
) {
  await db
    .prepare(
      `INSERT INTO market_customer_login_activity
         (mobile, success, ip_address, user_agent)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(mobile, success ? 1 : 0, ip, userAgent)
    .run();
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

  const serviceArea = await db
    .prepare(
      `SELECT
         id,
         name,
         pin_code,
         delivery_charge,
         min_order,
         free_delivery_above
       FROM market_service_areas
       WHERE is_active = 1
         AND TRIM(pin_code) = ?
       LIMIT 1`,
    )
    .bind(pincode)
    .first<ServiceArea>();

  if (!serviceArea) {
    await recordSignupAttempt(
      db,
      mobile,
      false,
      meta.ip,
      meta.userAgent,
    );

    return json(
      {
        error: "Currently unavailable in your area",
        message: `Sabka Delivery abhi ${pincode} pincode par available nahi hai.`,
        unavailablePincode: pincode,
      },
      409,
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
    await recordSignupAttempt(
      db,
      mobile,
      false,
      meta.ip,
      meta.userAgent,
    );

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
    await recordSignupAttempt(
      db,
      mobile,
      false,
      meta.ip,
      meta.userAgent,
    );

    return json(
      { error: "Ye phone number pehle se registered hai. Login karo." },
      409,
    );
  }

  const token = randomHex(32);
  const tokenHash = await sha256(token);
  const expiresAt = new Date(
    Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  ).toISOString();

  await db
    .prepare(
      `DELETE FROM market_sessions
       WHERE user_id = ? OR expires_at <= CURRENT_TIMESTAMP`,
    )
    .bind(userId)
    .run();

  await db
    .prepare(
      `INSERT INTO market_sessions (token_hash, user_id, expires_at)
       VALUES (?, ?, ?)`,
    )
    .bind(tokenHash, userId, expiresAt)
    .run();

  await recordSignupAttempt(
    db,
    mobile,
    true,
    meta.ip,
    meta.userAgent,
  );

  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `sabka_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  );
  headers.append(
    "Set-Cookie",
    "apna_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
  );

  return json(
    {
      message: "Account successfully create ho gaya",
      redirectTo: "home",
      user: {
        id: userId,
        name,
        mobile,
        pincode,
        address: null,
      },
      serviceArea: {
        id: serviceArea.id,
        name: serviceArea.name,
        pincode: serviceArea.pin_code,
        deliveryCharge: Number(serviceArea.delivery_charge),
        minOrder: Number(serviceArea.min_order),
        freeDeliveryAbove: Number(serviceArea.free_delivery_above),
      },
    },
    201,
    headers,
  );
}
