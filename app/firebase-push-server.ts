import { ensureControlTables } from "../db/control-store";

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
  project_id: string;
};

type PushAudience = {
  storeId?: number | null;
  includeRiders?: boolean;
};

type PushMessage = {
  title: string;
  body: string;
  url: string;
  tag: string;
};

let cachedAccessToken: { value: string; expiresAt: number } | null = null;

function base64Url(input: Uint8Array | string) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function pemToArrayBuffer(pem: string) {
  const base64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function getServiceAccount(): Promise<ServiceAccount | null> {
  const { env } = await import("cloudflare:workers");
  const raw = (env as unknown as Record<string, unknown>).FIREBASE_SERVICE_ACCOUNT;
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch {
    console.error("FIREBASE_SERVICE_ACCOUNT is not valid JSON");
    return null;
  }
}

async function getAccessToken(account: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60) return cachedAccessToken.value;

  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: account.token_uri || "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(account.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  ));
  const assertion = `${unsigned}.${base64Url(signature)}`;

  const response = await fetch(account.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) throw new Error(`Firebase OAuth failed: ${response.status}`);
  const result = await response.json() as { access_token: string; expires_in?: number };
  cachedAccessToken = {
    value: result.access_token,
    expiresAt: now + Math.max(300, Number(result.expires_in || 3600)),
  };
  return result.access_token;
}

export async function sendPanelPush(message: PushMessage, audience: PushAudience = {}) {
  try {
    const account = await getServiceAccount();
    if (!account) return { sent: 0, failed: 0, reason: "missing-service-account" };
    const db = await ensureControlTables();
    await db.prepare(`CREATE TABLE IF NOT EXISTS market_push_subscriptions (
      token TEXT PRIMARY KEY,
      username TEXT,
      role TEXT NOT NULL DEFAULT 'CUSTOMER',
      panel_type TEXT NOT NULL DEFAULT 'CUSTOMER',
      store_id INTEGER,
      rider_id INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`).run();

    const targetParts = ["role='SUPER_ADMIN'"];
    const binds: number[] = [];
    if (audience.storeId) {
      targetParts.push("store_id=?");
      binds.push(audience.storeId);
    }
    if (audience.includeRiders) targetParts.push("role='RIDER'", "panel_type='DELIVERY'");

    const rows = await db.prepare(
      `SELECT token FROM market_push_subscriptions
       WHERE is_active=1 AND (${targetParts.join(" OR ")})
       ORDER BY updated_at DESC LIMIT 50`,
    ).bind(...binds).all<{ token: string }>();
    if (!rows.results.length) return { sent: 0, failed: 0, reason: "no-active-subscriptions" };

    const accessToken = await getAccessToken(account);
    const endpoint = `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`;
    let sent = 0;
    let failed = 0;

    await Promise.all(rows.results.map(async ({ token }) => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token,
            data: {
              url: message.url,
              tag: message.tag,
            },
            webpush: {
              headers: { Urgency: "high", TTL: "86400" },
              notification: {
                title: message.title,
                body: message.body,
                icon: "/images/sabka-delivery-logo.png",
                badge: "/images/sabka-delivery-logo.png",
                tag: message.tag,
                renotify: true,
                requireInteraction: true,
                vibrate: [300, 120, 300, 120, 600],
                data: { url: message.url },
              },
              fcm_options: { link: message.url },
            },
          },
        }),
      });

      if (response.ok) {
        sent += 1;
        return;
      }

      failed += 1;
      const errorText = await response.text().catch(() => "");
      console.error("Firebase message rejected", response.status, errorText.slice(0, 500));
      if (response.status === 404 || response.status === 410) {
        await db.prepare("UPDATE market_push_subscriptions SET is_active=0 WHERE token=?").bind(token).run();
      }
    }));

    return { sent, failed };
  } catch (error) {
    console.error("Firebase push send failed", error);
    return { sent: 0, failed: 1, reason: "send-error" };
  }
}
