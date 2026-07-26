"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type PointerEvent,
} from "react";

export type AdminCoupon = {
  code: string;
  title: string;
  discountType: string;
  discountValue: number;
  minOrder: number;
  maxDiscount: number;
  expiresAt: string | null;
  autoPauseAfterUse: number;
  showOnWebsite: number;
  isActive: number;
  uses: number;
  usageLimit: number;
  sortOrder: number;
};

type Send = (
  method: "POST" | "PATCH" | "DELETE",
  body: Record<string, unknown>,
) => Promise<boolean>;

type OfferDraft = {
  code: string;
  title: string;
  discountType: "FLAT" | "PERCENT";
  discountValue: string;
  minOrder: string;
  maxDiscount: string;
  usageLimit: string;
  expiresAt: string;
  autoPauseAfterUse: boolean;
  showOnWebsite: boolean;
};

const emptyDraft: OfferDraft = {
  code: "",
  title: "",
  discountType: "FLAT",
  discountValue: "",
  minOrder: "350",
  maxDiscount: "50",
  usageLimit: "0",
  expiresAt: "",
  autoPauseAfterUse: false,
  showOnWebsite: true,
};

export default function CouponManager({
  coupons,
  send,
  busy,
}: {
  coupons: AdminCoupon[];
  send: Send;
  busy: boolean;
}) {
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [draft, setDraft] = useState<OfferDraft>(emptyDraft);
  const [orderCodes, setOrderCodes] = useState<string[] | null>(null);
  const [draggingCode, setDraggingCode] = useState<string | null>(null);
  const orderedRef = useRef(coupons);
  const pointerCode = useRef<string | null>(null);

  const orderedCoupons = useMemo(() => {
    if (!orderCodes) return coupons;
    const byCode = new Map(coupons.map((coupon) => [coupon.code, coupon]));
    return [
      ...orderCodes
        .map((code) => byCode.get(code))
        .filter((coupon): coupon is AdminCoupon => !!coupon),
      ...coupons.filter((coupon) => !orderCodes.includes(coupon.code)),
    ];
  }, [coupons, orderCodes]);

  useEffect(() => {
    orderedRef.current = orderedCoupons;
  }, [orderedCoupons]);

  function update<K extends keyof OfferDraft>(key: K, value: OfferDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setEditingCode(null);
    setDraft(emptyDraft);
  }

  function generateCode() {
    update("code", `SABKA${Math.floor(1000 + Math.random() * 9000)}`);
  }

  function editOffer(coupon: AdminCoupon) {
    setEditingCode(coupon.code);
    setDraft({
      code: coupon.code,
      title: coupon.title,
      discountType:
        coupon.discountType === "PERCENT" ? "PERCENT" : "FLAT",
      discountValue: String(coupon.discountValue),
      minOrder: String(coupon.minOrder),
      maxDiscount: String(coupon.maxDiscount || 0),
      usageLimit: String(coupon.usageLimit || 0),
      expiresAt: coupon.expiresAt || "",
      autoPauseAfterUse: !!coupon.autoPauseAfterUse,
      showOnWebsite: coupon.showOnWebsite !== 0,
    });
    document
      .querySelector(".coupon-create")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = {
      action: "coupon",
      code: draft.code,
      title: draft.title,
      discountType: draft.discountType,
      discountValue: Number(draft.discountValue),
      minOrder: Number(draft.minOrder),
      maxDiscount: Number(draft.maxDiscount),
      usageLimit: Number(draft.usageLimit),
      expiresAt: draft.expiresAt,
      autoPauseAfterUse: draft.autoPauseAfterUse,
      showOnWebsite: draft.showOnWebsite,
    };
    const saved = await send(editingCode ? "PATCH" : "POST", body);
    if (saved) resetForm();
  }

  function reorder(code: string, targetCode: string) {
    if (code === targetCode) return;
    const next = [...orderedRef.current];
    const from = next.findIndex((coupon) => coupon.code === code);
    const to = next.findIndex((coupon) => coupon.code === targetCode);
    if (from < 0 || to < 0) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const normalized = next.map((coupon, sortOrder) => ({
      ...coupon,
      sortOrder,
    }));
    orderedRef.current = normalized;
    setOrderCodes(normalized.map((coupon) => coupon.code));
  }

  async function persistOrder(next = orderedRef.current) {
    await send("PATCH", {
      action: "couponOrder",
      codes: next.map((coupon) => coupon.code),
    });
  }

  function dropCoupon(event: DragEvent<HTMLElement>, targetCode: string) {
    event.preventDefault();
    if (!draggingCode) return;
    reorder(draggingCode, targetCode);
    setDraggingCode(null);
    void persistOrder();
  }

  function moveCoupon(code: string, direction: -1 | 1) {
    const current = orderedRef.current;
    const index = current.findIndex((coupon) => coupon.code === code);
    const target = current[index + direction];
    if (index < 0 || !target) return;
    reorder(code, target.code);
    void persistOrder();
  }

  function startPointerReorder(
    event: PointerEvent<HTMLButtonElement>,
    code: string,
  ) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerCode.current = code;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingCode(code);
  }

  function continuePointerReorder(event: PointerEvent<HTMLButtonElement>) {
    const code = pointerCode.current;
    if (!code) return;
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-coupon-code]");
    const targetCode = target?.dataset.couponCode;
    if (targetCode) reorder(code, targetCode);
  }

  function finishPointerReorder(event: PointerEvent<HTMLButtonElement>) {
    if (!pointerCode.current) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    pointerCode.current = null;
    setDraggingCode(null);
    void persistOrder();
  }

  return (
    <section className="coupon-manager">
      <form className="coupon-create" onSubmit={submit}>
        <div>
          <small>COUPON CONTROL</small>
          <h2>{editingCode ? `Edit ${editingCode}` : "Create new coupon"}</h2>
          <p>
            Flat/percentage discount, minimum order, expiry aur one-person rule
            control karo.
          </p>
        </div>
        <label className="coupon-code-field">
          Coupon code
          <span>
            <input
              value={draft.code}
              disabled={!!editingCode}
              onChange={(event) =>
                update(
                  "code",
                  event.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 20),
                )
              }
              required
              placeholder="SABKA2026"
            />
            {!editingCode && (
              <button type="button" onClick={generateCode}>
                Auto generate
              </button>
            )}
          </span>
        </label>
        <label>
          Coupon title
          <input
            value={draft.title}
            onChange={(event) => update("title", event.target.value)}
            required
            placeholder="Flat ₹50 OFF"
          />
        </label>
        <label>
          Discount type
          <select
            value={draft.discountType}
            onChange={(event) =>
              update(
                "discountType",
                event.target.value as "FLAT" | "PERCENT",
              )
            }
          >
            <option value="FLAT">Flat amount</option>
            <option value="PERCENT">Percentage</option>
          </select>
        </label>
        <label>
          Discount value
          <input
            value={draft.discountValue}
            onChange={(event) => update("discountValue", event.target.value)}
            type="number"
            min="1"
            required
            placeholder="50"
          />
        </label>
        <label>
          Minimum order
          <input
            value={draft.minOrder}
            onChange={(event) => update("minOrder", event.target.value)}
            type="number"
            min="0"
            required
          />
        </label>
        <label>
          Maximum discount
          <input
            value={draft.maxDiscount}
            onChange={(event) => update("maxDiscount", event.target.value)}
            type="number"
            min="0"
            required
          />
        </label>
        <label>
          Total usage limit
          <input
            value={draft.usageLimit}
            onChange={(event) => update("usageLimit", event.target.value)}
            type="number"
            min="0"
            required
          />
          <small>0 = unlimited</small>
        </label>
        <label>
          Expiry date
          <input
            value={draft.expiresAt}
            onChange={(event) => update("expiresAt", event.target.value)}
            type="date"
          />
        </label>
        <label className="one-person-coupon">
          <input
            checked={draft.autoPauseAfterUse}
            onChange={(event) =>
              update("autoPauseAfterUse", event.target.checked)
            }
            type="checkbox"
          />
          <span>
            <b>One-person offer</b>
            <small>Ek redemption ke baad automatic pause</small>
          </span>
        </label>
        <label className="one-person-coupon public-coupon-toggle">
          <input
            checked={draft.showOnWebsite}
            onChange={(event) =>
              update("showOnWebsite", event.target.checked)
            }
            type="checkbox"
          />
          <span>
            <b>Show on customer web</b>
            <small>Untick par private rahega, manual code phir bhi chalega</small>
          </span>
        </label>
        <div className="coupon-form-actions">
          {editingCode && (
            <button type="button" onClick={resetForm} disabled={busy}>
              Cancel
            </button>
          )}
          <button className="create-coupon" disabled={busy}>
            {editingCode ? "Save changes" : "Create coupon"}
          </button>
        </div>
      </form>

      <p className="coupon-order-help">
        Drag handle se mouse ya touch par reorder karo. Keyboard ke liye up/down
        buttons bhi diye gaye hain.
      </p>
      <div className="coupon-list">
        {orderedCoupons.map((coupon, index) => (
          <article
            key={coupon.code}
            data-coupon-code={coupon.code}
            className={`${coupon.isActive ? "" : "paused"} ${
              draggingCode === coupon.code ? "dragging" : ""
            }`}
            draggable={!busy}
            onDragStart={(event) => {
              setDraggingCode(coupon.code);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", coupon.code);
            }}
            onDragEnd={() => setDraggingCode(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => dropCoupon(event, coupon.code)}
          >
            <header>
              <span className="coupon-order-tools">
                <button
                  type="button"
                  className="coupon-drag-handle"
                  aria-label={`Reorder ${coupon.code}`}
                  title="Drag to reorder"
                  disabled={busy}
                  onPointerDown={(event) =>
                    startPointerReorder(event, coupon.code)
                  }
                  onPointerMove={continuePointerReorder}
                  onPointerUp={finishPointerReorder}
                  onPointerCancel={finishPointerReorder}
                >
                  ⋮⋮
                </button>
                <code>{coupon.code}</code>
              </span>
              <span>{coupon.isActive ? "● ACTIVE" : "○ PAUSED"}</span>
            </header>
            <h2>{coupon.title}</h2>
            <p>
              {coupon.discountType === "PERCENT"
                ? `${coupon.discountValue}% OFF`
                : `₹${coupon.discountValue} OFF`}{" "}
              · Minimum ₹{coupon.minOrder}
            </p>
            <small>
              {coupon.autoPauseAfterUse
                ? "ONE-PERSON · AUTO PAUSE"
                : "REUSABLE · ONE USE PER MOBILE"}{" "}
              · {coupon.showOnWebsite !== 0 ? "PUBLIC" : "PRIVATE CODE"}
            </small>
            <footer>
              <b>
                {coupon.uses}
                {coupon.usageLimit > 0 ? ` / ${coupon.usageLimit}` : ""} redeemed
              </b>
              <div className="coupon-card-actions">
                <button
                  type="button"
                  aria-label={`Move ${coupon.code} up`}
                  disabled={busy || index === 0}
                  onClick={() => moveCoupon(coupon.code, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={`Move ${coupon.code} down`}
                  disabled={busy || index === orderedCoupons.length - 1}
                  onClick={() => moveCoupon(coupon.code, 1)}
                >
                  ↓
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    send("PATCH", {
                      action: "coupon",
                      code: coupon.code,
                      isActive: !coupon.isActive,
                    })
                  }
                >
                  {coupon.isActive ? "Pause" : "Resume"}
                </button>
                <button disabled={busy} onClick={() => editOffer(coupon)}>
                  Edit
                </button>
                <button
                  className="delete-offer"
                  disabled={busy}
                  onClick={() =>
                    confirm(`${coupon.code} coupon permanently delete karein?`) &&
                    send("DELETE", { action: "coupon", code: coupon.code })
                  }
                >
                  Delete
                </button>
              </div>
            </footer>
          </article>
        ))}
        {!orderedCoupons.length && (
          <div className="coupon-empty">Abhi koi coupon nahi hai—pehla coupon create karo.</div>
        )}
      </div>
    </section>
  );
}
