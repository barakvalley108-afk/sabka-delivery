"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { requestBackgroundNotifications, showBackgroundNotification } from "../components/background-notifications";
import { useLiveRefresh } from "../components/use-live-refresh";

type Rider = {
  id: number;
  name: string;
  phone: string;
  is_online: number;
  document_status: string;
  bank_account_masked: string;
  cod_collection: number;
  latitude: number | null;
  longitude: number | null;
  upiId: string;
  walletBalance: number;
};
type RiderOrderItem = {
  orderCode: string;
  itemName: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
};
type DeliveryRequest = {
  orderCode: string;
  customerName: string;
  phone: string;
  area: string;
  address: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  storeName: string;
  storeAddress: string;
  storeLatitude: number;
  storeLongitude: number;
  assignmentStatus: string | null;
  orderStatus: string;
  items: RiderOrderItem[];
};
type Active = DeliveryRequest & {
  tip: number;
  deliveryOtp: string;
};
type History = {
  orderCode: string;
  deliveryFee: number;
  tip: number;
  deliveredAt: string;
  storeName: string;
  area: string;
};
type Payout = {
  id: number;
  amount: number;
  period: string;
  status: string;
  upiId: string;
  reference: string;
  createdAt: string;
  completedAt: string | null;
};
type Data = {
  user: string;
  rider: Rider;
  requests: DeliveryRequest[];
  active: Active | null;
  history: History[];
  payouts: Payout[];
  earnings: { todayOrders: number; today: number; total: number };
};
type Tab = "Home" | "Earnings" | "Wallet" | "Profile";

const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function RiderConsole() {
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<Tab>("Home");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [alerts, setAlerts] = useState(false);
  const known = useRef<Set<string> | null>(null);

  const beep = useCallback(() => {
    try {
      const Context =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const context = new Context();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 1040;
      gain.gain.value = 0.1;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.3);
    } catch {}
  }, []);

  const load = useCallback(async () => {
    const response = await fetch("/api/rider/control", { cache: "no-store" });
    if (response.status === 401) {
      location.href = "/panel-login";
      return;
    }
    const result = await response.json();
    if (!response.ok) {
      setError(result.error);
      return;
    }
    const fresh = (result.requests as DeliveryRequest[]).filter(
      (request) => !known.current?.has(request.orderCode),
    );
    if (known.current && fresh.length && alerts) {
      beep();
      void showBackgroundNotification({
        title: "New delivery request",
        body: `${fresh[0].storeName} to ${fresh[0].area}`,
        url: "/rider-panel",
        tag: `rider-order-${fresh[0].orderCode}`,
      });
    }
    known.current = new Set(
      (result.requests as DeliveryRequest[]).map((request) => request.orderCode),
    );
    setData(result);
    setError("");
  }, [alerts, beep]);

  useLiveRefresh(load, 3000, { runWhenHidden: alerts });

  async function send(body: Record<string, unknown>) {
    setBusy(true);
    const response = await fetch("/api/rider/control", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) setError(result.error);
    else await load();
    setBusy(false);
  }

  async function enable() {
    if (await requestBackgroundNotifications(
      "Delivery alerts enabled",
      "New delivery request aate hi background notification milega.",
      "/rider-panel",
    )) {
      setAlerts(true);
      beep();
    }
  }

  function toggle() {
    if (!data) return;
    if (!data.rider.is_online && navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        (position) =>
          send({
            action: "availability",
            isOnline: true,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
        () => send({ action: "availability", isOnline: true }),
      );
    else void send({ action: "availability", isOnline: false });
  }

  if (!data)
    return (
      <main className="rider-loading">
        <h1>Rider panel load ho raha hai...</h1>
        <p>{error}</p>
      </main>
    );

  const rider = data.rider;
  return (
    <main className="rider-app">
      <header>
        <div>
          <img src="/images/sabka-delivery-logo.png" alt="" />
          <span>
            <small>SABKA RIDER</small>
            <b>{data.user}</b>
          </span>
        </div>
        <div>
          <button className={alerts ? "alert-on" : ""} onClick={enable}>
            Alerts
          </button>
          <button className={rider.is_online ? "online" : "offline"} onClick={toggle}>
            {rider.is_online ? "ONLINE" : "OFFLINE"}
          </button>
        </div>
      </header>
      {error && <p className="rider-error">{error}</p>}
      <section className="rider-body">
        {tab === "Home" && <Home data={data} send={send} busy={busy} />}
        {tab === "Earnings" && <Earnings data={data} />}
        {tab === "Wallet" && <Wallet data={data} send={send} />}
        {tab === "Profile" && <Profile data={data} />}
      </section>
      <nav>
        {(["Home", "Earnings", "Wallet", "Profile"] as Tab[]).map((item) => (
          <button
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
            key={item}
          >
            <i>{item === "Home" ? "H" : item === "Earnings" ? "₹" : item === "Wallet" ? "W" : "P"}</i>
            {item}
          </button>
        ))}
      </nav>
    </main>
  );
}

function Home({
  data,
  send,
  busy,
}: {
  data: Data;
  send: (body: Record<string, unknown>) => Promise<void>;
  busy: boolean;
}) {
  return (
    <>
      {data.active ? (
        <ActiveCard order={data.active} send={send} />
      ) : (
        <section className="rider-ready">
          <span>✓</span>
          <h1>{data.rider.is_online ? "You are ready" : "You are offline"}</h1>
          <p>
            {data.rider.is_online
              ? "Delivery request aate hi notification milega."
              : "Orders paane ke liye Online button on karo."}
          </p>
        </section>
      )}
      <section className="rider-stats">
        <p>
          <small>TODAY EARNING</small>
          <b>{money(data.earnings.today)}</b>
        </p>
        <p>
          <small>DELIVERIES</small>
          <b>{data.earnings.todayOrders}</b>
        </p>
        <p>
          <small>COD HELD</small>
          <b>{money(data.rider.cod_collection)}</b>
        </p>
      </section>
      <h2 className="rider-title">Assigned delivery requests</h2>
      <section className="rider-requests">
        {data.requests.map((request) => {
          const ready = request.orderStatus === "READY_FOR_PICKUP";
          return (
            <article key={request.orderCode}>
              <div className="rider-request-status">
                {ready
                  ? "READY FOR PICKUP"
                  : `${request.orderStatus.replaceAll("_", " ")} · ASSIGNED TO YOU`}
              </div>
              <div className="rider-route">
                <i />
                <p>
                  <small>PICKUP</small>
                  <b>{request.storeName}</b>
                  <span>{request.storeAddress}</span>
                </p>
              </div>
              <div className="rider-route drop">
                <i />
                <p>
                  <small>DROP</small>
                  <b>{request.area}</b>
                  <span>{request.address}</span>
                </p>
              </div>
              <div className="rider-customer-detail">
                <p>
                  <small>CUSTOMER</small>
                  <b>{request.customerName}</b>
                  <a href={`tel:${request.phone}`}>{request.phone}</a>
                </p>
                <p>
                  <small>BILL</small>
                  <b>{money(request.total)}</b>
                  <span>
                    Items {money(request.subtotal)} · Delivery {money(request.deliveryFee)}
                  </span>
                </p>
              </div>
              <OrderItems items={request.items} />
              <footer>
                <p>
                  <small>ORDER</small>
                  <b>{request.orderCode}</b>
                </p>
                <p>
                  <small>PAYMENT</small>
                  <b>{request.paymentMethod}</b>
                </p>
                <button
                  disabled={busy || !data.rider.is_online || !!data.active || !ready}
                  onClick={() => send({ action: "accept", orderCode: request.orderCode })}
                >
                  {ready ? "Accept delivery" : "Waiting for shop"}
                </button>
              </footer>
            </article>
          );
        })}
        {!data.requests.length && (
          <p className="no-requests">Abhi koi assigned pickup request nahi hai.</p>
        )}
      </section>
    </>
  );
}

function OrderItems({ items }: { items: RiderOrderItem[] }) {
  if (!items.length) return null;
  const totalQty = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  return (
    <section className="rider-order-items">
      <header>
        <span>ORDER ITEMS</span>
        <b>{totalQty} qty</b>
      </header>
      {items.map((item, index) => (
        <p key={`${item.orderCode}-${index}`}>
          <span>
            <b>{item.itemName}</b>
            <small>
              {item.variantLabel} · Qty {item.quantity} · {money(item.unitPrice)} each
            </small>
          </span>
          <strong>{money(item.unitPrice * item.quantity)}</strong>
        </p>
      ))}
    </section>
  );
}

function ActiveCard({
  order,
  send,
}: {
  order: Active;
  send: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [otp, setOtp] = useState("");
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watch = navigator.geolocation.watchPosition(
      (position) =>
        void send({
          action: "location",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [send]);
  return (
    <section className="active-delivery">
      <header>
        <span>ACTIVE DELIVERY</span>
        <b>{order.orderCode}</b>
      </header>
      <h1>
        {order.storeName} to {order.area}
      </h1>
      <div>
        <p>
          <small>PICKUP</small>
          <b>{order.storeAddress}</b>
          <a
            target="_blank"
            href={`https://www.google.com/maps/dir/?api=1&destination=${order.storeLatitude},${order.storeLongitude}`}
          >
            Navigate
          </a>
        </p>
        <p>
          <small>CUSTOMER</small>
          <b>{order.customerName}</b>
          <span>{order.address}</span>
          <a href={`tel:${order.phone}`}>Call customer: {order.phone}</a>
          <a
            target="_blank"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.address},${order.area}`)}`}
          >
            Open map
          </a>
        </p>
        <p>
          <small>ORDER BILL</small>
          <b>{money(order.total)}</b>
          <span>
            {order.paymentMethod} · Items {money(order.subtotal)} · Delivery {money(order.deliveryFee)}
          </span>
        </p>
      </div>
      <OrderItems items={order.items} />
      <footer>
        <label>
          Customer delivery OTP
          <input
            value={otp}
            onChange={(event) =>
              setOtp(event.target.value.replace(/\D/g, "").slice(0, 4))
            }
            inputMode="numeric"
            placeholder="4-digit OTP"
          />
        </label>
        <button
          disabled={otp.length !== 4}
          onClick={() => send({ action: "deliver", orderCode: order.orderCode, otp })}
        >
          Complete delivery
        </button>
      </footer>
    </section>
  );
}

function Earnings({ data }: { data: Data }) {
  return (
    <>
      <section className="earning-hero">
        <small>TOTAL DELIVERY EARNING</small>
        <strong>{money(data.earnings.total)}</strong>
        <span>{data.history.length} completed deliveries</span>
      </section>
      <h2 className="rider-title">Delivery history</h2>
      <section className="rider-history">
        {data.history.map((row) => (
          <p key={row.orderCode}>
            <span>
              <b>
                {row.storeName} to {row.area}
              </b>
              <small>
                {row.orderCode} · {new Date(`${row.deliveredAt}Z`).toLocaleDateString("en-IN")}
              </small>
            </span>
            <strong>+{money(row.deliveryFee + row.tip)}</strong>
          </p>
        ))}
      </section>
    </>
  );
}

function Wallet({
  data,
  send,
}: {
  data: Data;
  send: (body: Record<string, unknown>) => Promise<void>;
}) {
  function saveUpi(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void send({ action: "upi", upiId: form.get("upiId") });
  }
  function withdraw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    const form = new FormData(target);
    void send({ action: "withdraw", amount: Number(form.get("amount")) }).then(() =>
      target.reset(),
    );
  }
  return (
    <>
      <section className="earning-hero dark">
        <small>AVAILABLE WALLET</small>
        <strong>{money(data.rider.walletBalance)}</strong>
        <span>
          Minimum withdrawal ₹20 · COD held {money(data.rider.cod_collection)}
        </span>
      </section>
      <form className="rider-bank rider-upi-form" onSubmit={saveUpi}>
        <h2>Withdrawal UPI ID</h2>
        <p>
          Saved: <b>{data.rider.upiId || "Not added"}</b>
        </p>
        <input
          name="upiId"
          required
          defaultValue={data.rider.upiId}
          placeholder="name@bank"
          autoCapitalize="none"
        />
        <button>Save UPI ID</button>
      </form>
      <form className="rider-bank withdrawal-form" onSubmit={withdraw}>
        <h2>Withdraw wallet balance</h2>
        <p>Request seedha Super Admin ke paas jayegi.</p>
        <input
          name="amount"
          type="number"
          min="20"
          max={data.rider.walletBalance}
          step="1"
          required
          placeholder="Minimum ₹20"
        />
        <button disabled={!data.rider.upiId || data.rider.walletBalance < 20}>
          Request withdrawal
        </button>
      </form>
      <section className="withdrawal-history">
        <h2>Withdrawal requests</h2>
        {data.payouts.map((payout) => (
          <article key={payout.id}>
            <div>
              <b>{money(payout.amount)}</b>
              <small>
                {payout.upiId} · {new Date(`${payout.createdAt}Z`).toLocaleString("en-IN")}
              </small>
            </div>
            <span className={payout.status.toLowerCase()}>
              {payout.status === "PAID" ? "SUCCESS" : payout.status}
            </span>
          </article>
        ))}
        {!data.payouts.length && <p>Abhi koi withdrawal request nahi hai.</p>}
      </section>
    </>
  );
}

function Profile({ data }: { data: Data }) {
  return (
    <section className="rider-profile">
      <i>{data.rider.name.slice(0, 1)}</i>
      <h1>{data.rider.name}</h1>
      <a href={`tel:${data.rider.phone}`}>{data.rider.phone}</a>
      <span>{data.rider.document_status} DOCUMENTS</span>
      <p>GPS: {data.rider.latitude ? "Live location active" : "Location waiting"}</p>
      <a href="/api/panel-auth/logout">Sign out</a>
    </section>
  );
}
