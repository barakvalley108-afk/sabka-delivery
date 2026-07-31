import { ensureControlTables } from "../../../../db/control-store";
import { getPanelSession } from "../../../panel-auth";

type AreaBody = {
  id?: unknown;
  name?: unknown;
  pincode?: unknown;
  deliveryCharge?: unknown;
  minOrder?: unknown;
  freeDeliveryAbove?: unknown;
  isActive?: unknown;
};

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

async function superAdminSession() {
  const session = await getPanelSession("SUPER_ADMIN");
  return session?.role === "SUPER_ADMIN" ? session : null;
}

function normalizePincode(value: unknown) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 6);
}

function normalizeMoney(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.round(number));
}

function normalizeActive(value: unknown) {
  return value === false || value === 0 || value === "0" ? 0 : 1;
}

async function logActivity(
  db: D1Database,
  username: string,
  action: string,
  target: string,
) {
  try {
    await db
      .prepare(
        `INSERT INTO market_admin_activity
           (username, action, target, details)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(
        username,
        action,
        target,
        JSON.stringify({ source: "delivery-areas" }),
      )
      .run();
  } catch {
    // Delivery-area operation must not fail only because activity logging failed.
  }
}

export async function GET() {
  const session = await superAdminSession();

  if (!session) {
    return json({ error: "Unauthorized" }, 401);
  }

  const db = await ensureControlTables();

  const result = await db
    .prepare(
      `SELECT
         id,
         name,
         pin_code AS pincode,
         delivery_charge AS deliveryCharge,
         min_order AS minOrder,
         free_delivery_above AS freeDeliveryAbove,
         is_active AS isActive
       FROM market_service_areas
       ORDER BY is_active DESC, name ASC, pin_code ASC`,
    )
    .all();

  return json({
    areas: result.results,
  });
}

export async function POST(request: Request) {
  const session = await superAdminSession();

  if (!session) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: AreaBody;

  try {
    body = (await request.json()) as AreaBody;
  } catch {
    return json({ error: "Delivery area details valid nahi hain" }, 400);
  }

  const name = String(body.name ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  const pincode = normalizePincode(body.pincode);
  const deliveryCharge = normalizeMoney(body.deliveryCharge);
  const minOrder = normalizeMoney(body.minOrder);
  const freeDeliveryAbove = normalizeMoney(body.freeDeliveryAbove);
  const isActive = normalizeActive(body.isActive);

  if (name.length < 2) {
    return json({ error: "Valid area name daalo" }, 400);
  }

  if (!/^\d{6}$/.test(pincode)) {
    return json({ error: "Valid 6-digit pincode daalo" }, 400);
  }

  if (
    deliveryCharge === null ||
    minOrder === null ||
    freeDeliveryAbove === null
  ) {
    return json(
      { error: "Delivery charge aur order limits valid rakho" },
      400,
    );
  }

  const db = await ensureControlTables();

  const duplicate = await db
    .prepare(
      `SELECT id
       FROM market_service_areas
       WHERE TRIM(pin_code) = ?
       LIMIT 1`,
    )
    .bind(pincode)
    .first<{ id: number }>();

  if (duplicate) {
    return json(
      { error: "Ye pincode pehle se Delivery Areas me add hai" },
      409,
    );
  }

  try {
    const result = await db
      .prepare(
        `INSERT INTO market_service_areas
           (
             name,
             pin_code,
             delivery_charge,
             min_order,
             free_delivery_above,
             is_active
           )
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        name,
        pincode,
        deliveryCharge,
        minOrder,
        freeDeliveryAbove,
        isActive,
      )
      .run();

    const id = Number(result.meta.last_row_id);

    await logActivity(
      db,
      session.username,
      "SERVICE_AREA_CREATE",
      String(id),
    );

    return json(
      {
        ok: true,
        area: {
          id,
          name,
          pincode,
          deliveryCharge,
          minOrder,
          freeDeliveryAbove,
          isActive,
        },
      },
      201,
    );
  } catch {
    return json(
      { error: "Area name ya pincode pehle se use ho raha hai" },
      409,
    );
  }
}

export async function PATCH(request: Request) {
  const session = await superAdminSession();

  if (!session) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: AreaBody;

  try {
    body = (await request.json()) as AreaBody;
  } catch {
    return json({ error: "Delivery area details valid nahi hain" }, 400);
  }

  const id = Number(body.id);
  const name = String(body.name ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  const pincode = normalizePincode(body.pincode);
  const deliveryCharge = normalizeMoney(body.deliveryCharge);
  const minOrder = normalizeMoney(body.minOrder);
  const freeDeliveryAbove = normalizeMoney(body.freeDeliveryAbove);
  const isActive = normalizeActive(body.isActive);

  if (!Number.isInteger(id) || id < 1) {
    return json({ error: "Valid delivery area select karo" }, 400);
  }

  if (name.length < 2 || !/^\d{6}$/.test(pincode)) {
    return json({ error: "Area name aur pincode valid rakho" }, 400);
  }

  if (
    deliveryCharge === null ||
    minOrder === null ||
    freeDeliveryAbove === null
  ) {
    return json(
      { error: "Delivery charge aur order limits valid rakho" },
      400,
    );
  }

  const db = await ensureControlTables();

  const duplicate = await db
    .prepare(
      `SELECT id
       FROM market_service_areas
       WHERE TRIM(pin_code) = ?
         AND id <> ?
       LIMIT 1`,
    )
    .bind(pincode, id)
    .first<{ id: number }>();

  if (duplicate) {
    return json(
      { error: "Ye pincode kisi doosre Delivery Area me add hai" },
      409,
    );
  }

  try {
    const result = await db
      .prepare(
        `UPDATE market_service_areas
         SET
           name = ?,
           pin_code = ?,
           delivery_charge = ?,
           min_order = ?,
           free_delivery_above = ?,
           is_active = ?
         WHERE id = ?`,
      )
      .bind(
        name,
        pincode,
        deliveryCharge,
        minOrder,
        freeDeliveryAbove,
        isActive,
        id,
      )
      .run();

    if (Number(result.meta.changes || 0) < 1) {
      return json({ error: "Delivery area nahi mila" }, 404);
    }

    await logActivity(
      db,
      session.username,
      "SERVICE_AREA_UPDATE",
      String(id),
    );

    return json({
      ok: true,
      area: {
        id,
        name,
        pincode,
        deliveryCharge,
        minOrder,
        freeDeliveryAbove,
        isActive,
      },
    });
  } catch {
    return json(
      { error: "Area name ya pincode pehle se use ho raha hai" },
      409,
    );
  }
}

export async function DELETE(request: Request) {
  const session = await superAdminSession();

  if (!session) {
    return json({ error: "Unauthorized" }, 401);
  }

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));

  if (!Number.isInteger(id) || id < 1) {
    return json({ error: "Valid delivery area select karo" }, 400);
  }

  const db = await ensureControlTables();

  const result = await db
    .prepare("DELETE FROM market_service_areas WHERE id = ?")
    .bind(id)
    .run();

  if (Number(result.meta.changes || 0) < 1) {
    return json({ error: "Delivery area nahi mila" }, 404);
  }

  await logActivity(
    db,
    session.username,
    "SERVICE_AREA_DELETE",
    String(id),
  );

  return json({ ok: true });
}
