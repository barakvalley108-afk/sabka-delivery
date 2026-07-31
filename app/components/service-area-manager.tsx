"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type ServiceArea = {
  id: number;
  name: string;
  pincode: string;
  deliveryCharge: number;
  minOrder: number;
  freeDeliveryAbove: number;
  isActive: number;
};

type AreaForm = {
  name: string;
  pincode: string;
  deliveryCharge: string;
  minOrder: string;
  freeDeliveryAbove: string;
  isActive: boolean;
};

const emptyForm: AreaForm = {
  name: "",
  pincode: "",
  deliveryCharge: "20",
  minOrder: "100",
  freeDeliveryAbove: "9999",
  isActive: true,
};

const money = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function ServiceAreaManager() {
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [form, setForm] = useState<AreaForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/service-areas", {
        cache: "no-store",
      });

      if (response.status === 401) {
        window.location.href = "/panel-login";
        return;
      }

      const result = (await response.json()) as {
        areas?: ServiceArea[];
        error?: string;
      };

      if (!response.ok) {
        setError(result.error || "Delivery areas load nahi hue");
        return;
      }

      setAreas(Array.isArray(result.areas) ? result.areas : []);
    } catch {
      setError("Network problem—delivery areas load nahi hue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function updateForm<Key extends keyof AreaForm>(
    key: Key,
    value: AreaForm[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function beginEdit(area: ServiceArea) {
    setEditingId(area.id);
    setForm({
      name: area.name,
      pincode: area.pincode,
      deliveryCharge: String(area.deliveryCharge),
      minOrder: String(area.minOrder),
      freeDeliveryAbove: String(area.freeDeliveryAbove),
      isActive: Boolean(area.isActive),
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/service-areas", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({
          id: editingId,
          name: form.name,
          pincode: form.pincode,
          deliveryCharge: Number(form.deliveryCharge),
          minOrder: Number(form.minOrder),
          freeDeliveryAbove: Number(form.freeDeliveryAbove),
          isActive: form.isActive,
        }),
      });

      if (response.status === 401) {
        window.location.href = "/panel-login";
        return;
      }

      const result = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setError(result.error || "Delivery area save nahi hua");
        return;
      }

      setSuccess(
        editingId
          ? "Delivery area update ho gaya"
          : "New delivery area add ho gaya",
      );
      resetForm();
      await load();
    } catch {
      setError("Network problem—dobara try karo");
    } finally {
      setBusy(false);
    }
  }

  async function toggleArea(area: ServiceArea) {
    if (busy) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/service-areas", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({
          ...area,
          isActive: !area.isActive,
        }),
      });

      if (response.status === 401) {
        window.location.href = "/panel-login";
        return;
      }

      const result = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setError(result.error || "Area status change nahi hua");
        return;
      }

      setSuccess(
        area.isActive
          ? `${area.pincode} delivery temporarily inactive ho gayi`
          : `${area.pincode} delivery active ho gayi`,
      );
      await load();
    } catch {
      setError("Network problem—dobara try karo");
    } finally {
      setBusy(false);
    }
  }

  async function removeArea(area: ServiceArea) {
    if (busy) return;

    const confirmed = window.confirm(
      `${area.name} (${area.pincode}) ko permanently delete karna hai?`,
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/service-areas?id=${encodeURIComponent(area.id)}`,
        {
          method: "DELETE",
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );

      if (response.status === 401) {
        window.location.href = "/panel-login";
        return;
      }

      const result = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setError(result.error || "Delivery area delete nahi hua");
        return;
      }

      if (editingId === area.id) resetForm();
      setSuccess("Delivery area delete ho gaya");
      await load();
    } catch {
      setError("Network problem—dobara try karo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="service-area-manager">
      <form className="create-strip service-area-form" onSubmit={save}>
        <div>
          <small>DELIVERY COVERAGE</small>
          <h2>{editingId ? "Edit delivery area" : "Add delivery area"}</h2>
          <p>
            Sirf active pincode ke customers signup aur order kar sakte hain.
          </p>
        </div>

        <input
          required
          minLength={2}
          maxLength={80}
          placeholder="Area name"
          value={form.name}
          onChange={(event) => updateForm("name", event.target.value)}
        />

        <input
          required
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="6-digit pincode"
          value={form.pincode}
          onChange={(event) =>
            updateForm(
              "pincode",
              event.target.value.replace(/\D/g, "").slice(0, 6),
            )
          }
        />

        <label>
          <span>Delivery charge</span>
          <input
            required
            type="number"
            min={0}
            step={1}
            value={form.deliveryCharge}
            onChange={(event) =>
              updateForm("deliveryCharge", event.target.value)
            }
          />
        </label>

        <label>
          <span>Minimum order</span>
          <input
            required
            type="number"
            min={0}
            step={1}
            value={form.minOrder}
            onChange={(event) => updateForm("minOrder", event.target.value)}
          />
        </label>

        <label>
          <span>Free delivery above</span>
          <input
            required
            type="number"
            min={0}
            step={1}
            value={form.freeDeliveryAbove}
            onChange={(event) =>
              updateForm("freeDeliveryAbove", event.target.value)
            }
          />
        </label>

        <label className="service-area-active">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) =>
              updateForm("isActive", event.target.checked)
            }
          />
          <span>Active</span>
        </label>

        <button type="submit" disabled={busy}>
          {busy
            ? "Saving..."
            : editingId
              ? "Save changes"
              : "Add pincode"}
        </button>

        {editingId ? (
          <button type="button" disabled={busy} onClick={resetForm}>
            Cancel edit
          </button>
        ) : null}
      </form>

      {error ? <div className="panel-error">{error}</div> : null}
      {success ? <div className="panel-success">✓ {success}</div> : null}

      <div className="section-head service-area-heading">
        <div>
          <small>ACTIVE PINCODES</small>
          <h2>Delivery areas</h2>
        </div>
        <b>{areas.filter((area) => area.isActive).length}</b>
      </div>

      {loading ? (
        <div className="panel-loading">
          <p>Delivery areas load ho rahe hain…</p>
        </div>
      ) : (
        <section className="service-area-grid">
          {areas.map((area) => (
            <article
              key={area.id}
              className={`service-area-card ${
                area.isActive ? "active" : "inactive"
              }`}
            >
              <header>
                <div>
                  <span
                    className={`status ${
                      area.isActive ? "confirmed" : "cancelled"
                    }`}
                  >
                    {area.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                  <h3>{area.name}</h3>
                  <strong>{area.pincode}</strong>
                </div>
                <b>{money(area.deliveryCharge)}</b>
              </header>

              <div className="service-area-details">
                <p>
                  <small>MINIMUM ORDER</small>
                  <strong>{money(area.minOrder)}</strong>
                </p>
                <p>
                  <small>FREE DELIVERY ABOVE</small>
                  <strong>{money(area.freeDeliveryAbove)}</strong>
                </p>
              </div>

              <footer>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => beginEdit(area)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void toggleArea(area)}
                >
                  {area.isActive ? "Make inactive" : "Make active"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void removeArea(area)}
                >
                  Delete
                </button>
              </footer>
            </article>
          ))}

          {!areas.length ? (
            <article className="service-area-empty">
              <h3>Koi delivery pincode add nahi hai</h3>
              <p>Upar form se pehla pincode add karo.</p>
            </article>
          ) : null}
        </section>
      )}
    </section>
  );
}
