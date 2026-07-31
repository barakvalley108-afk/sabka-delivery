"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Order = {
  orderCode: string;
  status: string;
  total: number;
  area: string;
  createdAt: string;
  storeName: string;
  storeType: string;
  deliveryOtp?: string | null;
  riderName?: string | null;
  riderPhone?: string | null;
  paymentMethod?: string;
  paymentStatus?: string | null;
};

const label: Record<string, string> = {
  ACCEPTED: "Accepted",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  PACKING: "Packing",
  READY_FOR_PICKUP: "Ready for pickup",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async (searchOrderId = "") => {
    setLoading(true);
    setError("");
    try {
      const query = searchOrderId.trim()
        ? `?orderId=${encodeURIComponent(searchOrderId.trim())}`
        : "";
      const response = await fetch(`/api/customer-orders${query}`, { cache: "no-store" });
      const data = await response.json();
      if (response.status === 401) {
        window.location.replace("/customer-access?next=/orders");
        return;
      }
      if (!response.ok) throw new Error(data.error || "Orders load nahi hue");
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Orders load nahi hue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  function search(event: FormEvent) {
    event.preventDefault();
    void loadOrders(orderId);
  }

  return (
    <main className="orders-page">
      <header>
        <button onClick={() => router.push("/")}>←</button>
        <div><small>MY ACCOUNT</small><h1>Order History</h1></div>
        <button onClick={() => router.push("/profile")}>👤</button>
      </header>

      <section className="orders-card search-card">
        <h2>Your orders</h2>
        <p>Is account se kiye gaye saare orders automatically yahan save rahenge.</p>
        <form onSubmit={search}>
          <input
            value={orderId}
            onChange={(event) => setOrderId(event.target.value.toUpperCase().slice(0, 40))}
            placeholder="Optional: Order ID search karo"
          />
          <button type="submit">Search</button>
        </form>
        {orderId && <button className="clear" onClick={() => { setOrderId(""); void loadOrders(); }}>Show all orders</button>}
      </section>

      {loading && <div className="state">Orders load ho rahe hain...</div>}
      {error && <div className="state error">{error}</div>}
      {!loading && !error && orders.length === 0 && (
        <div className="state"><b>Koi order nahi mila</b><span>Naya order karne ke baad automatically yahan dikhega.</span></div>
      )}

      <section className="order-list">
        {orders.map((order) => (
          <article className="orders-card" key={order.orderCode}>
            <div className="order-top">
              <div><small>ORDER ID</small><b>{order.orderCode}</b></div>
              <span className={`status ${order.status.toLowerCase()}`}>{label[order.status] || order.status}</span>
            </div>
            <h3>{order.storeName}</h3>
            <p>{order.storeType} · {order.area}</p>
            <div className="details">
              <span><small>Total</small><b>₹{Number(order.total).toFixed(0)}</b></span>
              <span><small>Payment</small><b>{order.paymentMethod || "COD"}</b></span>
              <span><small>Ordered</small><b>{new Date(order.createdAt).toLocaleDateString("en-IN")}</b></span>
            </div>
            {order.status === "OUT_FOR_DELIVERY" && (
              <div className="delivery-box">
                {order.deliveryOtp && <span>Delivery OTP: <b>{order.deliveryOtp}</b></span>}
                {order.riderName && <span>Rider: <b>{order.riderName}</b></span>}
                {order.riderPhone && <a href={`tel:${order.riderPhone}`}>Call rider</a>}
              </div>
            )}
          </article>
        ))}
      </section>

      <style jsx>{`
        :global(body){margin:0;background:#fff9ef;color:#241413;font-family:Arial,sans-serif}
        .orders-page{min-height:100vh;padding:18px 16px 104px;max-width:720px;margin:auto}
        header{display:grid;grid-template-columns:44px 1fr 44px;align-items:center;gap:10px;margin-bottom:18px}
        header button{width:44px;height:44px;border:0;border-radius:14px;background:white;box-shadow:0 5px 18px #5b302018;font-size:20px}
        header small{color:#c7181b;font-weight:800;letter-spacing:.12em} h1{margin:3px 0 0;font-size:28px}
        .orders-card{background:white;border:1px solid #f0ddd1;border-radius:20px;padding:18px;box-shadow:0 8px 28px #63351f12;margin-bottom:14px}
        .search-card h2{margin:0 0 5px}.search-card p{margin:0 0 14px;color:#775d55;font-size:13px;line-height:1.5}
        form{display:grid;grid-template-columns:1fr auto;gap:8px} input{min-width:0;border:1.5px solid #e5d4cb;border-radius:13px;padding:13px;font-size:15px;outline:none} form button{border:0;border-radius:13px;background:#c7181b;color:white;font-weight:800;padding:0 18px}.clear{border:0;background:transparent;color:#c7181b;font-weight:800;margin-top:10px}
        .state{display:grid;gap:6px;text-align:center;padding:35px 15px;color:#765d55}.state.error{color:#a51317}
        .order-top{display:flex;justify-content:space-between;gap:12px;align-items:center}.order-top div{display:grid;gap:3px}.order-top small,.details small{font-size:10px;color:#8a7067;font-weight:800}.order-top b{font-size:14px}.status{padding:8px 10px;border-radius:999px;background:#fff3d6;color:#8c5900;font-size:11px;font-weight:900}.status.delivered{background:#e9f8ed;color:#176b2c}.status.cancelled{background:#fff0ef;color:#a51317}.orders-card h3{margin:16px 0 4px}.orders-card>p{margin:0;color:#80675f;font-size:13px}.details{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:16px}.details span{display:grid;gap:4px;background:#fff9ef;border-radius:12px;padding:10px}.details b{font-size:13px}.delivery-box{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;padding:12px;border-radius:13px;background:#edf7ff;font-size:13px}.delivery-box a{color:#075ca8;font-weight:800}
      `}</style>
    </main>
  );
}
