"use client";

import { FormEvent, useEffect, useState } from "react";

type Customer = {
  id: number;
  name: string | null;
  mobile: string;
  pincode: string;
  updatedAt: string;
};

export default function CustomerPinManager() {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadCustomers(query = "") {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/admin/customer-pins${query ? `?search=${encodeURIComponent(query)}` : ""}`,
        { cache: "no-store" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Customers load nahi hue");
      setCustomers(data.customers || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Customers load nahi hue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const nav = document.querySelector<HTMLElement>(".admin-side nav");
    if (!nav) return;

    const oldButton = nav.querySelector<HTMLButtonElement>("[data-customer-pin-menu]");
    oldButton?.remove();

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.customerPinMenu = "true";
    button.innerHTML = "<i>🔐</i>Customer PIN";
    button.addEventListener("click", () => setOpen(true));

    const settingsButton = Array.from(nav.querySelectorAll<HTMLButtonElement>("button")).find(
      (item) => item.textContent?.trim().endsWith("Settings"),
    );
    nav.insertBefore(button, settingsButton || null);

    return () => button.remove();
  }, []);

  useEffect(() => {
    if (open) void loadCustomers();
  }, [open]);

  async function resetPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    if (!/^\d{4}$/.test(pin)) {
      setMessage("Naya PIN exactly 4 digit ka hona chahiye");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/customer-pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: selected.mobile, pin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "PIN reset nahi hua");
      setMessage(data.message || "PIN reset ho gaya");
      setPin("");
      setSelected(null);
      await loadCustomers(search);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PIN reset nahi hua");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="customer-pin-overlay" onClick={() => setOpen(false)}>
      <section className="customer-pin-panel" onClick={(event) => event.stopPropagation()}>
        <header>
          <div>
            <small>SUPER ADMIN</small>
            <h2>Customer PIN Management</h2>
            <p>PIN dekhna possible nahi hai. Sirf secure reset kiya ja sakta hai.</p>
          </div>
          <button type="button" onClick={() => setOpen(false)}>×</button>
        </header>

        <form
          className="customer-pin-search"
          onSubmit={(event) => {
            event.preventDefault();
            void loadCustomers(search);
          }}
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="Customer mobile search"
            inputMode="numeric"
          />
          <button disabled={loading}>{loading ? "..." : "Search"}</button>
        </form>

        {message && <p className="customer-pin-message">{message}</p>}

        <div className="customer-pin-list">
          {customers.map((customer) => (
            <article key={customer.id}>
              <div>
                <b>{customer.name || "Customer"}</b>
                <span>{customer.mobile}</span>
                <small>Pincode: {customer.pincode}</small>
              </div>
              <button type="button" onClick={() => {
                setSelected(customer);
                setPin("");
                setMessage("");
              }}>
                Reset PIN
              </button>
            </article>
          ))}
          {!loading && customers.length === 0 && <p>Koi customer nahi mila.</p>}
        </div>

        {selected && (
          <form className="customer-pin-reset" onSubmit={resetPin}>
            <h3>Reset PIN</h3>
            <p>{selected.name || "Customer"} · {selected.mobile}</p>
            <label>
              New 4-digit PIN
              <input
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
                type="password"
                inputMode="numeric"
                placeholder="••••"
                required
              />
            </label>
            <div>
              <button type="button" onClick={() => setSelected(null)}>Cancel</button>
              <button className="danger" disabled={loading}>Reset & Logout User</button>
            </div>
          </form>
        )}
      </section>

      <style jsx>{`
        .customer-pin-overlay { position: fixed; z-index: 10000; inset: 0; display: grid; place-items: center; padding: 18px; background: rgba(25,14,11,.62); backdrop-filter: blur(5px); }
        .customer-pin-panel { width: min(100%, 720px); max-height: 90vh; overflow: auto; border-radius: 24px; padding: 22px; background: #fffdf9; color: #2b1c18; box-shadow: 0 30px 90px rgba(0,0,0,.3); }
        header { display: flex; justify-content: space-between; gap: 16px; }
        header small { color: #c7181b; font-weight: 900; letter-spacing: .12em; }
        header h2 { margin: 5px 0; }
        header p { margin: 0; color: #725b53; font-size: 13px; }
        header > button { width: 38px; height: 38px; border: 0; border-radius: 50%; background: #f3e9e4; font-size: 24px; }
        .customer-pin-search { display: grid; grid-template-columns: 1fr auto; gap: 10px; margin: 20px 0; }
        input { border: 1px solid #ddcec6; border-radius: 12px; padding: 12px; font: inherit; }
        button { cursor: pointer; }
        .customer-pin-search button, article button { border: 0; border-radius: 12px; padding: 10px 14px; background: #c7181b; color: white; font-weight: 900; }
        .customer-pin-message { padding: 11px; border-radius: 11px; background: #fff0ed; color: #a01619; font-weight: 700; }
        .customer-pin-list { display: grid; gap: 10px; }
        article { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 14px; border: 1px solid #eadfd8; border-radius: 15px; background: white; }
        article div { display: grid; gap: 3px; }
        article span { font-weight: 800; }
        article small { color: #796159; }
        .customer-pin-reset { margin-top: 18px; padding: 18px; border-radius: 16px; background: #f8f1ec; }
        .customer-pin-reset h3 { margin: 0 0 5px; }
        .customer-pin-reset p { margin: 0 0 14px; color: #705850; }
        .customer-pin-reset label { display: grid; gap: 7px; font-weight: 800; }
        .customer-pin-reset div { display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px; }
        .customer-pin-reset button { border: 0; border-radius: 11px; padding: 11px 14px; font-weight: 900; }
        .customer-pin-reset .danger { background: #c7181b; color: white; }
        @media (max-width: 680px) { .customer-pin-panel { padding: 17px; } article { align-items: flex-start; } }
      `}</style>
    </div>
  );
}
