import { ensureControlTables } from "../../../db/control-store";
import { readPaymentOrderState } from "../../../db/payment-orders";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orderCode?: string;
      mobile?: string;
    };
    const orderCode = String(body.orderCode || "").trim().toUpperCase();
    const mobile = String(body.mobile || "").trim();
    if (!/^[A-Z0-9_-]{3,40}$/.test(orderCode) || !/^\d{10}$/.test(mobile))
      return Response.json(
        { error: "Valid order verification details required" },
        {
          status: 400,
          headers: { "Cache-Control": "no-store" },
        },
      );

    const db = await ensureControlTables();
    const order = await readPaymentOrderState(db, orderCode, mobile);
    if (!order)
      return Response.json(
        { error: "Order not found" },
        {
          status: 404,
          headers: { "Cache-Control": "no-store" },
        },
      );

    return Response.json(
      {
        order: {
          orderCode: order.orderCode,
          orderStatus: order.status,
          paymentStatus: order.paymentStatus,
          confirmed: order.confirmed,
          expiresAt: order.expiresAt,
          estimatedDelivery: order.estimatedDelivery,
        },
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  } catch (error) {
    console.error("Payment status lookup failed", error);
    return Response.json(
      { error: "Payment status abhi verify nahi hua" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
