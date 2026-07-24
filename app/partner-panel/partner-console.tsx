"use client";

import { useCallback, useMemo, useRef, useState, type FormEvent } from "react";
import ImagePicker from "../components/image-picker";
import FullItemEditor from "../components/full-item-editor";
import { requestBackgroundNotifications, showBackgroundNotification } from "../components/background-notifications";
import { useLiveRefresh } from "../components/use-live-refresh";

type Store = {
  id: number;
  name: string;
  description: string;
  address: string;
  image: string;
  isOpen: number;
  vertical: string;
  rating: number;
  commissionRate: number;
};
type Order = {
  orderCode: string;
  customerName: string;
  mobile: string;
  address: string;
  area: string;
  paymentMethod: string;
  total: number;
  status: string;
  createdAt: string;
  riderName: string | null;
};
type Line = {
  orderCode: string;
  itemName: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
};
type Item = {
  id: number;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  foodType: string;
  image: string;
  isActive: number;
  variantId: number;
  label: string;
  unit: string;
  unitValue: number;
  price: number;
  discountPrice: number;
  discountPercent: number;
  stockQuantity: number;
};
type Data = {
  user: string;
  panelType: string;
  store: Store;
  orders: Order[];
  orderItems: Line[];
  items: Item[];
  insights: { activeOrders: number; todayOrders: number; totalSales: number };
};
type Tab = "Orders" | "Catalog" | "Insights" | "Profile";

const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function PartnerConsole({
  expected,
}: {
  expected: "RESTAURANT" | "GROCERY" | "ELECTRONICS";
}) {
  const retail = expected !== "RESTAURANT";
  const panelName =
    expected === "GROCERY"
      ? "Grocery"
      : expected === "ELECTRONICS"
        ? "Electronics"
        : "Restaurant";
  const panelPath =
    expected === "GROCERY"
      ? "/grocery-panel"
      : expected === "ELECTRONICS"
        ? "/electronics-panel"
        : "/restaurant-panel";
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<Tab>("Orders");
  const [error, setError] = useState("");
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
      oscillator.frequency.value = 920;
      gain.gain.value = 0.09;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.25);
    } catch {}
  }, []);

  const load = useCallback(async () => {
    const response = await fetch("/api/partner/control", { cache: "no-store" });
    if (response.status === 401) {
      location.href = "/panel-login";
      return;
    }
    const result = await response.json();
    if (!response.ok) {
      setError(result.error);
      return;
    }
    const fresh = (result.orders as Order[]).filter(
      (order) => !known.current?.has(order.orderCode) && order.status === "ACCEPTED",
    );
    if (known.current && fresh.length && alerts) {
      beep();
      void showBackgroundNotification({
        title: `New ${panelName.toLowerCase()} order`,
        body: `${fresh[0].orderCode} · ${money(fresh[0].total)}`,
        url: "/partner-panel",
        tag: `partner-order-${fresh[0].orderCode}`,
      });
    }
    known.current = new Set(
      (result.orders as Order[]).map((order) => order.orderCode),
    );
    setData(result);
    setError("");
  }, [alerts, beep, panelName]);

  useLiveRefresh(load, 3000, { runWhenHidden: alerts });

  async function send(method: "POST" | "PATCH", body: Record<string, unknown>) {
    const response = await fetch("/api/partner/control", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) setError(result.error);
    else await load();
  }

  async function enable() {
    if (await requestBackgroundNotifications(
      "Order alerts enabled",
      "New order aate hi background notification milega.",
      "/partner-panel",
    )) {
      setAlerts(true);
      beep();
    }
  }

  const active = useMemo(
    () =>
      data?.orders.filter(
        (order) => !["DELIVERED", "CANCELLED"].includes(order.status),
      ) || [],
    [data],
  );

  if (!data)
    return (
      <main className="partner-loading">
        <h1>{panelName} panel load ho raha hai...</h1>
        <p>{error}</p>
      </main>
    );

  return (
    <main className={`partner-app ${expected.toLowerCase()}`}>
      <aside>
        <a href={panelPath}>
          <img src="/images/sabka-delivery-logo.png" alt="" />
          <span>
            SABKA<b>{expected} PARTNER</b>
          </span>
        </a>
        <div className="partner-shop">
          <small>{expected}</small>
          <h2>{data.store.name}</h2>
          <p>{data.store.address}</p>
          <button
            className={data.store.isOpen ? "open" : "closed"}
            onClick={() => send("PATCH", { action: "store", isOpen: !data.store.isOpen })}
          >
            {data.store.isOpen ? "Accepting orders" : "Shop offline"}
          </button>
        </div>
        <nav>
          {(["Orders", "Catalog", "Insights", "Profile"] as Tab[]).map((item) => (
            <button
              className={tab === item ? "active" : ""}
              onClick={() => setTab(item)}
              key={item}
            >
              {item}
              {item === "Orders" && active.length ? <em>{active.length}</em> : null}
            </button>
          ))}
        </nav>
        <div className="partner-signout">
          <b>{data.user}</b>
          <a href="/api/panel-auth/logout">Sign out</a>
        </div>
      </aside>
      <section className="partner-work">
        <header>
          <div>
            <small>LIVE {expected} OPERATIONS</small>
            <h1>{tab}</h1>
          </div>
          <div>
            <button className={alerts ? "on" : ""} onClick={enable}>
              {alerts ? "Alerts on" : "Enable order alerts"}
            </button>
            <a href="/" target="_blank">
              Customer site
            </a>
          </div>
        </header>
        {error && <p className="partner-error">{error}</p>}
        {tab === "Orders" && (
          <OrderList
            orders={data.orders}
            lines={data.orderItems}
            send={send}
            retail={retail}
          />
        )}
        {tab === "Catalog" && (
          <Catalog items={data.items} send={send} grocery={retail} />
        )}
        {tab === "Insights" && <Insights data={data} />}
        {tab === "Profile" && <Profile data={data} />}
      </section>
    </main>
  );
}

function OrderList({
  orders,
  lines,
  send,
  retail,
}: {
  orders: Order[];
  lines: Line[];
  send: (method: "POST" | "PATCH", body: Record<string, unknown>) => Promise<void>;
  retail: boolean;
}) {
  const active = orders.filter(
    (order) => !["DELIVERED", "CANCELLED"].includes(order.status),
  );
  return (
    <section className="partner-orders">
      {active.map((order) => (
        <article key={order.orderCode}>
          <header>
            <span>{order.status.replaceAll("_", " ")}</span>
            <b>{order.orderCode}</b>
            <strong>{money(order.total)}</strong>
          </header>
          <div className="partner-lines">
            {lines
              .filter((line) => line.orderCode === order.orderCode)
              .map((line, index) => (
                <p key={index}>
                  <b>{line.quantity}x</b>
                  <span>
                    {line.itemName}
                    <small>{line.variantLabel}</small>
                  </span>
                </p>
              ))}
          </div>
          <div className="partner-customer">
            <p>
              <small>CUSTOMER</small>
              <b>{order.customerName}</b>
              <a href={`tel:${order.mobile}`}>{order.mobile}</a>
            </p>
            <p>
              <small>DELIVERY</small>
              <b>{order.area}</b>
              <span>{order.address}</span>
            </p>
            <p>
              <small>PAYMENT</small>
              <b>{order.paymentMethod}</b>
              <span>{order.riderName || "Rider not assigned"}</span>
            </p>
          </div>
          <footer>
            {order.status === "ACCEPTED" && (
              <>
                <button
                  onClick={() =>
                    send("PATCH", {
                      action: "order",
                      orderCode: order.orderCode,
                      status: "CONFIRMED",
                    })
                  }
                >
                  Accept order
                </button>
                <button
                  className="reject"
                  onClick={() =>
                    send("PATCH", {
                      action: "order",
                      orderCode: order.orderCode,
                      status: "CANCELLED",
                    })
                  }
                >
                  Reject
                </button>
              </>
            )}
            {order.status === "CONFIRMED" && (
              <button
                onClick={() =>
                  send("PATCH", {
                    action: "order",
                    orderCode: order.orderCode,
                    status: retail ? "PACKING" : "PREPARING",
                  })
                }
              >
                {retail ? "Start packing" : "Start preparing"}
              </button>
            )}
            {["PREPARING", "PACKING"].includes(order.status) && (
              <button
                onClick={() =>
                  send("PATCH", {
                    action: "order",
                    orderCode: order.orderCode,
                    status: "READY_FOR_PICKUP",
                  })
                }
              >
                Ready for pickup
              </button>
            )}
            {["READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(order.status) && (
              <strong>Rider pickup workflow active</strong>
            )}
          </footer>
        </article>
      ))}
      {!active.length && <Empty text="Abhi koi active order nahi hai" />}
    </section>
  );
}

function Catalog({
  items,
  send,
  grocery,
}: {
  items: Item[];
  send: (method: "POST" | "PATCH", body: Record<string, unknown>) => Promise<void>;
  grocery: boolean;
}) {
  const [image, setImage] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = event.currentTarget;
    const form = new FormData(target);
    void send("POST", {
      action: "item",
      name: form.get("name"),
      category: form.get("category"),
      foodType: form.get("foodType"),
      label: form.get("label"),
      unit: form.get("unit"),
      price: Number(form.get("price")),
      discountPrice: Number(form.get("discountPrice") || form.get("price") || 0),
      stockQuantity: Number(form.get("stock")),
      image,
    }).then(() => {
      target.reset();
      setImage("");
    });
  }
  return (
    <>
      <form className="partner-add" onSubmit={submit}>
        <h2>Add {grocery ? "product" : "dish"}</h2>
        <input name="name" required placeholder={grocery ? "Product name" : "Dish name"} />
        <input name="category" required placeholder="Category" />
        <select name="foodType">
          <option>VEG</option>
          <option>NON_VEG</option>
          <option>EGG</option>
        </select>
        <input name="label" required placeholder={grocery ? "500 g / 1 kg" : "Half / Full"} />
        <select name="unit">
          <option>PIECE</option>
          <option>PACK</option>
          <option>PLATE</option>
          <option>GM</option>
          <option>KG</option>
          <option>ML</option>
          <option>LITRE</option>
        </select>
        <input name="price" type="number" required placeholder="Price" />
        <input name="discountPrice" type="number" min="0" required placeholder="Offer price" />
        <input name="stock" type="number" required placeholder="Stock" />
        <ImagePicker
          value={image}
          onChange={setImage}
          label={grocery ? "Select product photo" : "Select food photo"}
        />
        <button>Add {grocery ? "product" : "dish"}</button>
      </form>
      <section className="partner-catalog">
        {items.map((item) => (
          <article key={item.variantId}>
            <img src={item.image || "/images/hero-food.png"} alt="" />
            <p>
              <b>{item.name}</b>
              <small>
                {item.category} · {item.label}
              </small>
            </p>
            <label>
              Price
              <input id={`pp-${item.variantId}`} type="number" defaultValue={item.price} />
            </label>
            <label>
              Offer price
              <input
                id={`po-${item.variantId}`}
                type="number"
                min="0"
                defaultValue={item.discountPrice || item.price}
              />
            </label>
            <label>
              Discount %
              <input value={item.discountPercent || 0} readOnly />
            </label>
            <label>
              Stock
              <input
                id={`ps-${item.variantId}`}
                type="number"
                defaultValue={item.stockQuantity}
              />
            </label>
            <label className="partner-stock">
              <input
                id={`pa-${item.variantId}`}
                type="checkbox"
                defaultChecked={!!item.isActive}
              />
              Available
            </label>
            <button
              onClick={() =>
                send("PATCH", {
                  action: "item",
                  variantId: item.variantId,
                  price: Number(
                    (document.getElementById(`pp-${item.variantId}`) as HTMLInputElement)
                      .value,
                  ),
                  discountPrice: Number(
                    (document.getElementById(`po-${item.variantId}`) as HTMLInputElement)
                      .value,
                  ),
                  stockQuantity: Number(
                    (document.getElementById(`ps-${item.variantId}`) as HTMLInputElement)
                      .value,
                  ),
                  isActive: (
                    document.getElementById(`pa-${item.variantId}`) as HTMLInputElement
                  ).checked,
                })
              }
            >
              Quick save
            </button>
            <FullItemEditor
              item={item}
              onSave={(values) => send("PATCH", { action: "item", ...values })}
            />
          </article>
        ))}
        {!items.length && <Empty text={`Pehla ${grocery ? "product" : "dish"} add karo`} />}
      </section>
    </>
  );
}

function Insights({ data }: { data: Data }) {
  return (
    <>
      <section className="partner-metrics">
        <article>
          <small>Total sales</small>
          <strong>{money(data.insights.totalSales)}</strong>
        </article>
        <article>
          <small>Today orders</small>
          <strong>{data.insights.todayOrders}</strong>
        </article>
        <article>
          <small>Active orders</small>
          <strong>{data.insights.activeOrders}</strong>
        </article>
        <article>
          <small>Rating</small>
          <strong>★ {data.store.rating}</strong>
        </article>
      </section>
      <section className="insight-note">
        <h2>Business pulse</h2>
        <p>
          Orders accept karke status update karte raho. Customer tracking
          automatically update hoti rahegi.
        </p>
      </section>
    </>
  );
}

function Profile({ data }: { data: Data }) {
  return (
    <section className="partner-profile">
      <img src={data.store.image || "/images/hero-food-collage.png"} alt="" />
      <div>
        <small>{data.store.vertical}</small>
        <h2>{data.store.name}</h2>
        <p>{data.store.description}</p>
        <b>{data.store.address}</b>
        <span>{data.store.commissionRate}% platform commission</span>
      </div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="partner-empty">
      <span>✓</span>
      <h2>{text}</h2>
      <p>New activity aate hi yahan dikhegi.</p>
    </div>
  );
}
