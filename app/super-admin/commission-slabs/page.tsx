"use client";

import { useEffect, useMemo, useState } from "react";

type Store = {
  id: number;
  name: string;
  vertical: string;
  commissionRate: number;
};

type Slab = {
  id?: number;
  storeId: number;
  minAmount: number;
  maxAmount: number | null;
  commission: number;
  commissionType: "FIXED" | "PERCENT";
  isActive?: number;
};

const money = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function CommissionSlabsPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState(0);
  const [slabs, setSlabs] = useState<Slab[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedStore = useMemo(() => stores.find((store) => store.id === storeId) || null, [stores, storeId]);

  async function loadStores() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/control", { cache: "no-store" });
      if (response.status === 401) {
        window.location.href = "/panel-login";
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Panel load failed");
      const nextStores = (data.stores || []) as Store[];
      setStores(nextStores);
      if (!storeId && nextStores[0]) setStoreId(nextStores[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Panel load failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadSlabs(id: number) {
    if (!id) {
      setSlabs([]);
      return;
    }
    setError("");
    try {
      const response = await fetch(`/api/admin/commission-slabs?storeId=${id}`, { cache: "no-store" });
      if (response.status === 401) {
        window.location.href = "/panel-login";
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Slabs load nahi hue");
      setSlabs((data.slabs || []).map((slab: Slab) => ({ ...slab, storeId: id })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Slabs load nahi hue");
    }
  }

  useEffect(() => {
    void loadStores();
  }, []);

  useEffect(() => {
    void loadSlabs(storeId);
  }, [storeId]);

  function addSlab() {
    const previous = slabs[slabs.length - 1];
    setSlabs((current) => [
      ...current,
      {
        storeId,
        minAmount: previous ? Number(previous.maxAmount || previous.minAmount + 500) : 0,
        maxAmount: null,
        commission: selectedStore?.commissionRate || 0,
        commissionType: "PERCENT",
        isActive: 1,
      },
    ]);
  }

  function updateSlab(index: number, patch: Partial<Slab>) {
    setSlabs((current) => current.map((slab, i) => (i === index ? { ...slab, ...patch } : slab)));
  }

  function removeSlab(index: number) {
    setSlabs((current) => current.filter((_, i) => i !== index));
  }

  async function save() {
    if (!storeId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const normalized = slabs.map((slab) => ({
        minAmount: Number(slab.minAmount),
        maxAmount: slab.maxAmount === null || slab.maxAmount === undefined || slab.maxAmount === "" ? null : Number(slab.maxAmount),
        commission: Number(slab.commission),
        commissionType: slab.commissionType,
      }));
      for (let i = 0; i < normalized.length; i += 1) {
        const slab = normalized[i];
        if (!Number.isFinite(slab.minAmount) || slab.minAmount < 0 || !Number.isFinite(slab.commission) || slab.commission < 0) {
          throw new Error(`Slab ${i + 1}: amount aur commission valid rakho`);
        }
        if (slab.maxAmount !== null && (!Number.isFinite(slab.maxAmount) || slab.maxAmount <= slab.minAmount)) {
          throw new Error(`Slab ${i + 1}: Max amount, Min amount se bada hona chahiye`);
        }
        if (i > 0 && slab.minAmount < normalized[i - 1].minAmount) {
          throw new Error("Slabs ko amount ke ascending order mein rakho");
        }
      }
      const response = await fetch("/api/admin/commission-slabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "replace", storeId, slabs: normalized }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Save nahi hua");
      await loadSlabs(storeId);
      setMessage("Commission slabs saved successfully");
      window.setTimeout(() => setMessage(""), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save nahi hua");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f5f7fb", color: "#172033", padding: 28, fontFamily: "Inter,system-ui,sans-serif" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "center", marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: "#e53935" }}>SABKA DELIVERY · SUPER ADMIN</div>
            <h1 style={{ margin: "6px 0 4px", fontSize: 30 }}>Commission Slab Editor</h1>
            <p style={{ margin: 0, color: "#667085" }}>Har shop ke order amount ke hisaab se commission directly set karo.</p>
          </div>
          <a href="/super-admin" style={{ textDecoration: "none", border: "1px solid #d8dee9", background: "#fff", color: "#172033", padding: "11px 16px", borderRadius: 10, fontWeight: 700 }}>← Control Room</a>
        </header>

        {error && <div style={{ background: "#fff1f0", color: "#b42318", border: "1px solid #ffc7c2", padding: 13, borderRadius: 10, marginBottom: 16 }}>{error}</div>}
        {message && <div style={{ background: "#ecfdf3", color: "#067647", border: "1px solid #abefc6", padding: 13, borderRadius: 10, marginBottom: 16 }}>{message}</div>}

        <section style={{ background: "#fff", border: "1px solid #e5e9f0", borderRadius: 16, padding: 20, boxShadow: "0 8px 28px rgba(16,24,40,.05)", marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#667085", marginBottom: 8 }}>SELECT SHOP</label>
          <select value={storeId || ""} onChange={(event) => setStoreId(Number(event.target.value))} disabled={loading} style={{ width: "100%", maxWidth: 520, padding: "13px 14px", borderRadius: 10, border: "1px solid #cfd6e4", background: "#fff", fontSize: 15 }}>
            <option value="">{loading ? "Loading shops…" : "Select a shop"}</option>
            {stores.map((store) => <option value={store.id} key={store.id}>{store.name} · {store.vertical}</option>)}
          </select>
          {selectedStore && <div style={{ marginTop: 10, fontSize: 13, color: "#667085" }}>Current fallback commission: <b>{selectedStore.commissionRate}%</b></div>}
        </section>

        <section style={{ background: "#fff", border: "1px solid #e5e9f0", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 28px rgba(16,24,40,.05)" }}>
          <div style={{ padding: 20, borderBottom: "1px solid #edf0f5", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 15 }}>
            <div><h2 style={{ margin: 0, fontSize: 20 }}>Order-value slabs</h2><p style={{ margin: "5px 0 0", color: "#667085", fontSize: 13 }}>Example: ₹0–₹499 → 10%, ₹500–₹999 → 8%, ₹1000+ → 6%</p></div>
            <button onClick={addSlab} disabled={!storeId} style={{ border: 0, background: "#172033", color: "#fff", padding: "11px 16px", borderRadius: 10, fontWeight: 800, cursor: "pointer" }}>+ Add slab</button>
          </div>

          <div style={{ padding: 20 }}>
            {slabs.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", border: "1px dashed #cfd6e4", borderRadius: 12, color: "#667085" }}>
                <b style={{ display: "block", color: "#172033", marginBottom: 6 }}>No slabs configured</b>
                Add your first slab. Without slabs, your existing fallback commission can continue to apply.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {slabs.map((slab, index) => (
                  <div key={slab.id || `new-${index}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 150px 46px", gap: 10, alignItems: "end", padding: 14, background: "#f8fafc", border: "1px solid #e5e9f0", borderRadius: 12 }}>
                    <Field label="Min order"><input type="number" min="0" value={slab.minAmount} onChange={(e) => updateSlab(index, { minAmount: Number(e.target.value) })} /></Field>
                    <Field label="Max order (blank = no limit)"><input type="number" min="0" value={slab.maxAmount ?? ""} onChange={(e) => updateSlab(index, { maxAmount: e.target.value === "" ? null : Number(e.target.value) })} placeholder="No limit" /></Field>
                    <Field label="Commission"><input type="number" min="0" step="0.01" value={slab.commission} onChange={(e) => updateSlab(index, { commission: Number(e.target.value) })} /></Field>
                    <Field label="Type"><select value={slab.commissionType} onChange={(e) => updateSlab(index, { commissionType: e.target.value as Slab["commissionType"] })}><option value="PERCENT">Percent %</option><option value="FIXED">Fixed ₹</option></select></Field>
                    <button onClick={() => removeSlab(index)} title="Remove slab" style={{ width: 46, height: 42, borderRadius: 9, border: "1px solid #f0b7b2", background: "#fff5f4", color: "#b42318", fontWeight: 900, cursor: "pointer" }}>×</button>
                  </div>
                ))}
              </div>
            )}

            {slabs.length > 0 && <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: "#f5f7fb", color: "#667085", fontSize: 13 }}>
              <b style={{ color: "#172033" }}>Preview:</b>{" "}
              {slabs.map((slab, index) => <span key={index}>{index ? " · " : ""}{money(slab.minAmount)}{slab.maxAmount !== null ? `–${money(slab.maxAmount)}` : "+"} → {slab.commission}{slab.commissionType === "PERCENT" ? "%" : " fixed"}</span>)}
            </div>}

            <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => void loadSlabs(storeId)} disabled={!storeId || saving} style={{ border: "1px solid #d8dee9", background: "#fff", color: "#172033", padding: "12px 18px", borderRadius: 10, fontWeight: 800 }}>Reset</button>
              <button onClick={() => void save()} disabled={!storeId || saving} style={{ border: 0, background: "#e53935", color: "#fff", padding: "12px 22px", borderRadius: 10, fontWeight: 900, minWidth: 150 }}>{saving ? "Saving…" : "Save slabs"}</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: "grid", gap: 6, fontSize: 11, fontWeight: 800, color: "#667085" }}>{label}<span style={{ display: "block" }}>{children}</span><style jsx>{`input,select{box-sizing:border-box;width:100%;height:42px;padding:0 11px;border:1px solid #cfd6e4;border-radius:9px;background:#fff;color:#172033;font:inherit;font-size:14px;outline:none}input:focus,select:focus{border-color:#e53935;box-shadow:0 0 0 3px rgba(229,57,53,.1)}`}</style></label>;
}
