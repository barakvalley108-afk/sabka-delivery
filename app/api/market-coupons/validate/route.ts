import { validateCoupon } from "../../../../db/coupon-service";
import { ensureControlTables } from "../../../../db/control-store";

type Payload = {
  code?: string;
  mobile?: string;
  storeId?: number;
  items?: Record<string, number>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const mobile = String(body.mobile || "").trim();
    const storeId = Number(body.storeId);
    const requested = Object.entries(body.items || {})
      .map(([id, quantity]) => ({ id: Number(id), quantity: Number(quantity) }))
      .filter(
        (entry) =>
          Number.isInteger(entry.id) &&
          Number.isInteger(entry.quantity) &&
          entry.quantity > 0 &&
          entry.quantity <= 20,
      );

    if (!/^\d{10}$/.test(mobile)) {
      return Response.json(
        { error: "Valid 10-digit mobile number daalo" },
        { status: 400 },
      );
    }
    if (!Number.isInteger(storeId) || !requested.length) {
      return Response.json({ error: "Cart is empty" }, { status: 400 });
    }

    const db = await ensureControlTables();
    const placeholders = requested.map(() => "?").join(",");
    const variants = await db
      .prepare(
        `SELECT v.id,v.price,v.discount_price discountPrice,i.store_id storeId
         FROM market_variants v
         JOIN market_items i ON i.id=v.item_id
         WHERE v.id IN (${placeholders}) AND v.is_active=1 AND i.is_active=1`,
      )
      .bind(...requested.map((entry) => entry.id))
      .all<{
        id: number;
        price: number;
        discountPrice: number | null;
        storeId: number;
      }>();
    if (
      variants.results.length !== requested.length ||
      variants.results.some((variant) => variant.storeId !== storeId)
    ) {
      return Response.json({ error: "Cart items invalid hain" }, { status: 400 });
    }

    const quantities = Object.fromEntries(
      requested.map((entry) => [entry.id, entry.quantity]),
    );
    const subtotal = variants.results.reduce(
      (sum, variant) =>
        sum +
        (variant.discountPrice ?? variant.price) * quantities[variant.id],
      0,
    );
    const result = await validateCoupon({
      db,
      rawCode: body.code,
      mobile,
      storeId,
      subtotal,
    });
    if (!result.ok) {
      return Response.json(
        { error: result.error, reason: result.reason },
        { status: result.status },
      );
    }

    return Response.json(
      {
        coupon: {
          code: result.coupon.code,
          title: result.coupon.title,
          discount: result.discount,
          subtotal,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Coupon validate nahi hua. Dobara try karo." },
      { status: 500 },
    );
  }
}
