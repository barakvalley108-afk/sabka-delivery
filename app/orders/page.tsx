"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
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
  PLACED: "Accepted",
  ACCEPTED: "Accepted",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  PACKING: "Packing",
  READY_FOR_PICKUP: "Ready for pickup",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const foodSteps = [
  "ACCEPTED",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const grocerySteps = [
  "ACCEPTED",
  "CONFIRMED",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const electronicsSteps = [
  "ACCEPTED",
  "CONFIRMED",
  "PACKING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

function normalizedStatus(status: string) {
  return status === "PLACED" ? "ACCEPTED" : status;
}

function trackingSteps(order: Order) {
  const type = String(order.storeType || "").toUpperCase();
  if (type.includes("GROCERY")) return grocerySteps;
  if (type.includes("ELECTRONIC")) return electronicsSteps;
  return foodSteps;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancellingOrder, setCancellingOrder] = useState("");
  const activeSearchRef = useRef("");

  const loadOrders = useCallback(async (searchOrderId = "", silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    if (!silent) setError("");

    try {
      const query = searchOrderId.trim()
        ? `?orderId=${encodeURIComponent(searchOrderId.trim())}`
        : "";
      const response = await fetch(`/api/customer-orders${query}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await response.json();
      if (response.status === 401) {
        window.location.replace("/customer-access?next=/orders");
        return;
      }
      if (!response.ok) throw new Error(data.error || "Orders load nahi hue");
      setOrders(data.orders || []);
      if (silent) setError("");
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : "Orders load nahi hue");
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") {
        void loadOrders(activeSearchRef.current, true);
      }
    };

    const timer = window.setInterval(refresh, 3000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [loadOrders]);

  function search(event: FormEvent) {
    event.preventDefault();
    activeSearchRef.current = orderId.trim();
    void loadOrders(activeSearchRef.current);
  }

  async function cancelOrder(order: Order) {
    if (cancellingOrder) return;
    const confirmed = window.confirm(
      `Kya aap ${order.orderCode} order ko cancel karna chahte hain?`,
    );
    if (!confirmed) return;

    setCancellingOrder(order.orderCode);
    setCancelError("");
    try {
      const response = await fetch("/api/customer-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderCode: order.orderCode }),
      });
      const data = await response.json().catch(() => ({ error: "Server response invalid hai" }));
      if (response.status === 401) {
        window.location.replace("/customer-access?next=/orders");
        return;
      }
      if (!response.ok) throw new Error(data.error || "Order cancel nahi hua");

      setOrders((current) =>
        current.map((item) =>
          item.orderCode === order.orderCode ? { ...item, status: "CANCELLED" } : item,
        ),
      );
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Order cancel nahi hua");
    } finally {
      setCancellingOrder("");
    }
  }

  return (
    <main className="orders-page">
      <header>
        <button onClick={() => router.push("/")}>←</button>
        <div><small>MY ACCOUNT</small><h1>Order History</h1></div>
        <button onClick={() => router.push("/profile")}>👤</button>
      </header>

      <section className="orders-card search-card">
        <div className="search-title">
          <div>
            <h2>Your orders</h2>
            <p>Restaurant ya store status change karte hi yahan automatically update hoga.</p>
          </div>
          <span className="live-indicator"><i />{refreshing ? "Updating" : "Live"}</span>
        </div>
        <form onSubmit={search}>
          <input
            value={orderId}
            onChange={(event) => setOrderId(event.target.value.toUpperCase().slice(0, 40))}
            placeholder="Optional: Order ID search karo"
          />
          <button type="submit">Search</button>
        </form>
        {orderId && <button className="clear" onClick={() => { setOrderId(""); activeSearchRef.current = ""; void loadOrders(); }}>Show all orders</button>}
      </section>

      {loading && <div className="state">Orders load ho rahe hain...</div>}
      {error && <div className="state error">{error}</div>}
      {cancelError && <div className="cancel-error">{cancelError}</div>}
      {!loading && !error && orders.length === 0 && (
        <div className="state"><b>Koi order nahi mila</b><span>Naya order karne ke baad automatically yahan dikhega.</span></div>
      )}

      <section className="order-list">
        {orders.map((order) => {
          const currentStatus = normalizedStatus(order.status);
          const steps = trackingSteps(order);
          const activeIndex = steps.indexOf(currentStatus);
          const cancelled = currentStatus === "CANCELLED";

          return (
            <article className="orders-card" key={order.orderCode}>
              <div className="order-top">
                <div><small>ORDER ID</small><b>{order.orderCode}</b></div>
                <span className={`status ${currentStatus.toLowerCase()}`}>{label[currentStatus] || currentStatus}</span>
              </div>
              <h3>{order.storeName}</h3>
              <p>{order.storeType} · {order.area}</p>
              <div className="details">
                <span><small>Total</small><b>₹{Number(order.total).toFixed(0)}</b></span>
                <span><small>Payment</small><b>{order.paymentMethod || "COD"}</b></span>
                <span><small>Ordered</small><b>{new Date(order.createdAt).toLocaleDateString("en-IN")}</b></span>
              </div>

              <div className={`tracking ${cancelled ? "cancelled" : ""}`}>
                <div className="tracking-head">
                  <div><small>LIVE TRACKING</small><b>{cancelled ? "Order cancelled" : label[currentStatus] || currentStatus}</b></div>
                  {!cancelled && <span>Auto refresh</span>}
                </div>
                {!cancelled ? (
                  <div className="track-steps">
                    {steps.map((step, index) => {
                      const done = activeIndex >= index;
                      const current = activeIndex === index;
                      return (
                        <div className={`track-step ${done ? "done" : ""} ${current ? "current" : ""}`} key={step}>
                          <i>{done ? "✓" : index + 1}</i>
                          <span>{label[step]}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="cancelled-note">Yeh order cancel ho chuka hai.</p>
                )}
              </div>

              {currentStatus === "ACCEPTED" && (
                <button
                  className="cancel-order"
                  disabled={Boolean(cancellingOrder)}
                  onClick={() => void cancelOrder(order)}
                >
                  {cancellingOrder === order.orderCode ? "Cancelling..." : "Cancel Order"}
                </button>
              )}
              {currentStatus === "OUT_FOR_DELIVERY" && (
                <div className="delivery-box">
                  {order.deliveryOtp && <span>Delivery OTP: <b>{order.deliveryOtp}</b></span>}
                  {order.riderName && <span>Rider: <b>{order.riderName}</b></span>}
                  {order.riderPhone && <a href={`tel:${order.riderPhone}`}>Call rider</a>}
                </div>
              )}
            </article>
          );
        })}
      </section>

      <style jsx>{`
        :global(body){margin:0;background:#fff9ef;color:#241413;font-family:Arial,sans-serif}
        .orders-page{min-height:100vh;padding:18px 16px 104px;max-width:720px;margin:auto}
        header{display:grid;grid-template-columns:44px 1fr 44px;align-items:center;gap:10px;margin-bottom:18px}
        header button{width:44px;height:44px;border:0;border-radius:14px;background:white;box-shadow:0 5px 18px #5b302018;font-size:20px}
        header small{color:#c7181b;font-weight:800;letter-spacing:.12em} h1{margin:3px 0 0;font-size:28px}
        .orders-card{background:white;border:1px solid #f0ddd1;border-radius:20px;padding:18px;box-shadow:0 8px 28px #63351f12;margin-bottom:14px}
        .search-title{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.search-card h2{margin:0 0 5px}.search-card p{margin:0 0 14px;color:#775d55;font-size:13px;line-height:1.5}.live-indicator{display:flex;align-items:center;gap:6px;white-space:nowrap;border-radius:999px;background:#eaf8ee;color:#176b2c;padding:7px 10px;font-size:11px;font-weight:900}.live-indicator i{width:8px;height:8px;border-radius:50%;background:#20a04a;box-shadow:0 0 0 4px #20a04a20}
        form{display:grid;grid-template-columns:1fr auto;gap:8px} input{min-width:0;border:1.5px solid #e5d4cb;border-radius:13px;padding:13px;font-size:15px;outline:none} form button{border:0;border-radius:13px;background:#c7181b;color:white;font-weight:800;padding:0 18px}.clear{border:0;background:transparent;color:#c7181b;font-weight:800;margin-top:10px}
        .state{display:grid;gap:6px;text-align:center;padding:35px 15px;color:#765d55}.state.error{color:#a51317}.cancel-error{margin:0 0 14px;padding:12px 14px;border-radius:12px;background:#fff0ef;color:#a51317;font-size:13px;font-weight:800}
        .order-top{display:flex;justify-content:space-between;gap:12px;align-items:center}.order-top div{display:grid;gap:3px}.order-top small,.details small{font-size:10px;color:#8a7067;font-weight:800}.order-top b{font-size:14px}.status{padding:8px 10px;border-radius:999px;background:#fff3d6;color:#8c5900;font-size:11px;font-weight:900}.status.confirmed,.status.preparing,.status.packing,.status.ready_for_pickup,.status.out_for_delivery{background:#edf5ff;color:#075ca8}.status.delivered{background:#e9f8ed;color:#176b2c}.status.cancelled{background:#fff0ef;color:#a51317}.orders-card h3{margin:16px 0 4px}.orders-card>p{margin:0;color:#80675f;font-size:13px}.details{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:16px}.details span{display:grid;gap:4px;background:#fff9ef;border-radius:12px;padding:10px}.details b{font-size:13px}
        .tracking{margin-top:16px;border:1px solid #eadfd8;border-radius:16px;padding:14px;background:#fffdf9}.tracking-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.tracking-head>div{display:grid;gap:3px}.tracking-head small{font-size:9px;letter-spacing:.12em;color:#c7181b;font-weight:900}.tracking-head b{font-size:14px}.tracking-head>span{font-size:10px;font-weight:800;color:#176b2c;background:#eaf8ee;border-radius:999px;padding:6px 8px}.track-steps{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}.track-step{position:relative;display:grid;justify-items:center;gap:6px;text-align:center;color:#a08b82;font-size:9px;font-weight:800}.track-step:not(:last-child)::after{content:"";position:absolute;top:13px;left:calc(50% + 15px);width:calc(100% - 24px);height:2px;background:#eadfd8}.track-step.done:not(:last-child)::after{background:#20a04a}.track-step i{position:relative;z-index:1;width:26px;height:26px;display:grid;place-items:center;border-radius:50%;background:#f2ebe7;color:#8f786e;font-style:normal;font-size:10px}.track-step.done i{background:#20a04a;color:white}.track-step.current i{box-shadow:0 0 0 5px #20a04a20}.track-step.done span{color:#2d4738}.tracking.cancelled{border-color:#f0caca;background:#fff8f7}.cancelled-note{margin:0;color:#a51317;font-size:13px;font-weight:800}
        .cancel-order{width:100%;margin-top:14px;padding:12px 16px;border:1px solid #c7181b;border-radius:13px;background:#fff;color:#c7181b;font-weight:900}.cancel-order:hover{background:#fff0ef}.cancel-order:disabled{opacity:.55;cursor:not-allowed}.delivery-box{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;padding:12px;border-radius:13px;background:#edf7ff;font-size:13px}.delivery-box a{color:#075ca8;font-weight:800}
        @media(max-width:620px){.track-steps{grid-template-columns:repeat(3,minmax(0,1fr));row-gap:14px}.track-step:not(:last-child)::after{display:none}.tracking-head{align-items:flex-start}.details{gap:6px}.details span{padding:9px 8px}.details b{font-size:12px}}
      `}</style>
    </main>
  );
}
