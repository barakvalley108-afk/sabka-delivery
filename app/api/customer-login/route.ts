import { ensureMarketTables } from "../../../db/market-store";
import {
  getCustomerRequestMeta,
  hashCustomerPin,
  isValidCustomerMobile,
  isValidCustomerPin,
  normalizeCustomerMobile,
  normalizeCustomerPin,
  secureTextEqual,
} from "../../../db/customer-pin";
import { randomHex, sha256 } from "../../../db/otp-utils";

type Runtime = {
  CUSTOMER_PIN_SECRET?: string;
  OTP_SECRET?: string;
};

type LoginBody = {
  mobile?: unknown;
  pin?: unknown;
};

type CustomerRecord = {
  id: number;
  mobile: string;
  name: string | null;
  pincode: string;
  pin_salt: string;
  pin_hash: string;
};

type AddressRecord = {
  recipient_name: string;
  mobile: string;
  address_line: string;
  landmark: string;
  area: string;
  pincode: string;
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

async function recordLoginAttempt(
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
  let body: LoginBody;

  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return json({ error: "Login details valid nahi hain" }, 400);
  }

  const mobile = normalizeCustomerMobile(body.mobile);
  const pin = normalizeCustomerPin(body.pin);

  if (!isValidCustomerMobile(mobile)) {
    return json({ error: "Valid 10-digit mobile number daalo" }, 400);
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

  const recentFailures = await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM market_customer_login_activity
       WHERE success = 0
         AND created_at > datetime('now', '-15 minutes')
         AND (mobile = ? OR (? <> '' AND ip_address = ?))`,
    )
    .bind(mobile, meta.ip, meta.ip)
    .first<{ count: number }>();

  if (Number(recentFailures?.count || 0) >= 5) {
    return json(
      { error: "Bahut galat login attempts hue. 15 minute baad try karo." },
      429,
    );
  }

  const customer = await db
    .prepare(
      `SELECT
         u.id,
         u.mobile,
         u.name,
         a.pincode,
         a.pin_salt,
         a.pin_hash
       FROM market_users u
       JOIN market_customer_auth a ON a.user_id = u.id
       WHERE u.mobile = ?`,
    )
    .bind(mobile)
    .first<CustomerRecord>();

  if (!customer) {
    await recordLoginAttempt(
      db,
      mobile,
      false,
      meta.ip,
      meta.userAgent,
    );

    return json(
      { error: "Is phone number ka account nahi mila. Pehle signup karo." },
      404,
    );
  }

  const candidateHash = await hashCustomerPin(
    customer.mobile,
    pin,
    customer.pin_salt,
    pinSecret,
  );

  if (!secureTextEqual(candidateHash, customer.pin_hash)) {
    await recordLoginAttempt(
      db,
      mobile,
      false,
      meta.ip,
      meta.userAgent,
    );

    return json({ error: "Phone number ya PIN galat hai" }, 401);
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
    .bind(customer.id)
    .run();

  await db
    .prepare(
      `INSERT INTO market_sessions (token_hash, user_id, expires_at)
       VALUES (?, ?, ?)`,
    )
    .bind(tokenHash, customer.id, expiresAt)
    .run();

  await recordLoginAttempt(
    db,
    mobile,
    true,
    meta.ip,
    meta.userAgent,
  );

  const address = await db
    .prepare(
      `SELECT
         recipient_name,
         mobile,
         address_line,
         landmark,
         area,
         pincode
       FROM market_customer_addresses
       WHERE user_id = ?
       LIMIT 1`,
    )
    .bind(customer.id)
    .first<AddressRecord>();

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
      message: "Login successful",
      user: {
        id: customer.id,
        name: customer.name,
        mobile: customer.mobile,
        pincode: customer.pincode,
        address: address || null,
      },
    },
    200,
    headers,
  );
}
