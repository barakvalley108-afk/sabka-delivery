"use client";

import { useState, type FormEvent } from "react";

export type AdminRewardOffer = {
  id: number;
  title: string;
  description: string;
  qualifyingOrders: number;
  windowDays: number;
  rewardType: "FREE_DELIVERY";
  rewardValue: number;
  minOrder: number;
  isActive: number;
  uses: number;
};

type Draft = {
  title: string;
  description: string;
  qualifyingOrders: string;
  windowDays: string;
  minOrder: string;
};

const emptyDraft: Draft = {
  title: "5th order par free delivery",
  description:
    "30 din mein 4 delivered orders complete karo; agle order ki delivery free.",
  qualifyingOrders: "4",
  windowDays: "30",
  minOrder: "100",
};

export default function RewardOfferManager({
  offers,
  send,
  busy,
}: {
  offers: AdminRewardOffer[];
  send: (
    method: "POST" | "PATCH" | "DELETE",
    body: Record<string, unknown>,
  ) => Promise<boolean>;
  busy: boolean;
}) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);

  function update(key: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function reset() {
    setDraft(emptyDraft);
    setEditingId(null);
  }

  function edit(offer: AdminRewardOffer) {
    setEditingId(offer.id);
    setDraft({
      title: offer.title,
      description: offer.description,
      qualifyingOrders: String(offer.qualifyingOrders),
      windowDays: String(offer.windowDays),
      minOrder: String(offer.minOrder),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      action: "rewardOffer",
      ...(editingId ? { id: editingId } : {}),
      title: draft.title,
      description: draft.description,
      qualifyingOrders: Number(draft.qualifyingOrders),
      windowDays: Number(draft.windowDays),
      rewardType: "FREE_DELIVERY",
      rewardValue: 0,
      minOrder: Number(draft.minOrder),
    };
    const ok = await send(editingId ? "PATCH" : "POST", payload);
    if (ok) reset();
  }

  return (
    <section className="reward-manager">
      <div className="offer-manager-intro">
        <div>
          <small>AUTOMATIC LOYALTY REWARDS</small>
          <h1>Offers</h1>
          <p>
            Offer automatic apply hoga. Customer ko coupon code enter nahi karna
            padega.
          </p>
        </div>
        <span>Offers aur coupon codes alag systems hain</span>
      </div>

      <form className="coupon-create reward-create" onSubmit={submit}>
        <div>
          <small>{editingId ? "EDIT REWARD" : "NEW REWARD"}</small>
          <h2>{editingId ? "Offer update karo" : "Automatic offer banao"}</h2>
          <p>Example: 30 din mein 4 orders, 5th order delivery free.</p>
        </div>
        <label>
          Offer title
          <input
            value={draft.title}
            onChange={(event) => update("title", event.target.value)}
            minLength={3}
            required
          />
        </label>
        <label className="reward-description">
          Customer message
          <input
            value={draft.description}
            onChange={(event) => update("description", event.target.value)}
            required
          />
        </label>
        <label>
          Required delivered orders
          <input
            value={draft.qualifyingOrders}
            onChange={(event) => update("qualifyingOrders", event.target.value)}
            type="number"
            min="1"
            max="50"
            required
          />
        </label>
        <label>
          Time window (days)
          <input
            value={draft.windowDays}
            onChange={(event) => update("windowDays", event.target.value)}
            type="number"
            min="1"
            max="365"
            required
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
          Reward
          <select value="FREE_DELIVERY" disabled>
            <option value="FREE_DELIVERY">Free delivery</option>
          </select>
        </label>
        <div className="coupon-form-actions">
          {editingId && (
            <button type="button" onClick={reset} disabled={busy}>
              Cancel
            </button>
          )}
          <button className="create-coupon" disabled={busy}>
            {editingId ? "Save offer" : "Create automatic offer"}
          </button>
        </div>
      </form>

      <div className="coupon-list reward-list">
        {offers.map((offer) => (
          <article key={offer.id} className={offer.isActive ? "" : "paused"}>
            <header>
              <code>AUTO REWARD</code>
              <span>{offer.isActive ? "● ACTIVE" : "○ PAUSED"}</span>
            </header>
            <h2>{offer.title}</h2>
            <p>{offer.description}</p>
            <small>
              {offer.qualifyingOrders} DELIVERED ORDERS / {offer.windowDays} DAYS
              · MINIMUM ₹{offer.minOrder}
            </small>
            <footer>
              <b>{offer.uses} rewards used</b>
              <div className="coupon-card-actions">
                <button
                  disabled={busy}
                  onClick={() =>
                    send("PATCH", {
                      action: "rewardOffer",
                      id: offer.id,
                      isActive: !offer.isActive,
                    })
                  }
                >
                  {offer.isActive ? "Pause" : "Resume"}
                </button>
                <button disabled={busy} onClick={() => edit(offer)}>
                  Edit
                </button>
                <button
                  className="delete-offer"
                  disabled={busy}
                  onClick={() =>
                    confirm(`${offer.title} permanently delete karein?`) &&
                    send("DELETE", { action: "rewardOffer", id: offer.id })
                  }
                >
                  Delete
                </button>
              </div>
            </footer>
          </article>
        ))}
        {!offers.length && (
          <div className="coupon-empty">
            Abhi automatic offer nahi hai—pehla loyalty offer create karo.
          </div>
        )}
      </div>
    </section>
  );
}
