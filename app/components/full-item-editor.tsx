"use client";

import { useState, type FormEvent } from "react";
import ImagePicker from "./image-picker";

export type EditableCatalogItem = {
  id: number;
  variantId: number;
  storeId?: number;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  foodType: string;
  image: string;
  isActive: number;
  label: string;
  unit: string;
  unitValue?: number;
  price: number;
  discountPrice: number;
  discountPercent: number;
  stockQuantity: number;
};

type StoreOption = { id: number; name: string };
type OfferMode = "1" | "5" | "10" | "CUSTOM";

export default function FullItemEditor({
  item,
  stores,
  onSave,
}: {
  item: EditableCatalogItem;
  stores?: StoreOption[];
  onSave: (values: Record<string, unknown>) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState(item.image || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mrp, setMrp] = useState(Number(item.price || 0));
  const initialDifference = Math.max(0, Number(item.price || 0) - Number(item.discountPrice || item.price || 0));
  const [offerMode, setOfferMode] = useState<OfferMode>(
    initialDifference === 1 ? "1" : initialDifference === 5 ? "5" : initialDifference === 10 ? "10" : "CUSTOM",
  );
  const [customOffer, setCustomOffer] = useState(Number(item.discountPrice || item.price || 0));

  function calculatedOffer() {
    if (offerMode === "CUSTOM") return Math.max(0, Math.min(mrp, customOffer));
    return Math.max(0, mrp - Number(offerMode));
  }

  function show() {
    const nextMrp = Number(item.price || 0);
    const nextOffer = Number(item.discountPrice || item.price || 0);
    const difference = Math.max(0, nextMrp - nextOffer);
    setImage(item.image || "");
    setMrp(nextMrp);
    setCustomOffer(nextOffer);
    setOfferMode(difference === 1 ? "1" : difference === 5 ? "5" : difference === 10 ? "10" : "CUSTOM");
    setError("");
    setOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      const offerPrice = calculatedOffer();
      const saved = await onSave({
        variantId: item.variantId,
        itemId: item.id,
        storeId: stores ? Number(form.get("storeId")) : item.storeId,
        name: String(form.get("name") || "").trim(),
        description: String(form.get("description") || "").trim(),
        category: String(form.get("category") || "General").trim(),
        subcategory: String(form.get("subcategory") || "").trim(),
        foodType: String(form.get("foodType") || "VEG"),
        image,
        label: String(form.get("label") || "1 pack").trim(),
        unit: String(form.get("unit") || "PIECE"),
        unitValue: Number(form.get("unitValue") || 1),
        price: mrp,
        discountPrice: offerPrice,
        stockQuantity: Number(form.get("stockQuantity") || 0),
        isActive: form.get("isActive") === "on",
      });
      if (saved === false) {
        setError("Item save nahi hua. Details check karke dobara try karo.");
        return;
      }
      setOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Item save nahi hua");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button className="edit-all-button" type="button" onClick={show}>
        Edit all
      </button>
      {open && (
        <div className="item-editor-overlay" onClick={() => setOpen(false)}>
          <form className="item-editor" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <small>COMPLETE ITEM EDITOR</small>
                <h2>Edit {item.name}</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close editor">×</button>
            </header>

            <ImagePicker value={image} onChange={setImage} label="High-quality landscape product photo" />

            <section>
              {stores && (
                <label>
                  Shop
                  <select name="storeId" defaultValue={item.storeId} required>
                    {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
                  </select>
                </label>
              )}
              <label>
                Item name
                <input name="name" defaultValue={item.name} required />
              </label>
              <label className="wide">
                Description
                <textarea name="description" defaultValue={item.description || ""} rows={3} />
              </label>
              <label>
                Separate category
                <input name="category" defaultValue={item.category} placeholder="Biscuits, Atta, Baby Care..." required />
              </label>
              <label>
                Sub-category
                <input name="subcategory" defaultValue={item.subcategory || ""} />
              </label>
              <label>
                Food type
                <select name="foodType" defaultValue={item.foodType}>
                  <option value="VEG">Veg</option>
                  <option value="NON_VEG">Non-Veg</option>
                  <option value="EGG">Egg</option>
                </select>
              </label>
              <label>
                Quantity / pack
                <input name="label" defaultValue={item.label} placeholder="200 g, 500 ml, 1 pack" required />
              </label>
              <label>
                Unit
                <select name="unit" defaultValue={item.unit}>
                  {["PIECE", "PACK", "PLATE", "GM", "KG", "ML", "LITRE"].map((unit) => <option key={unit}>{unit}</option>)}
                </select>
              </label>
              <label>
                Unit value
                <input name="unitValue" type="number" min="0.01" step="0.01" defaultValue={item.unitValue || 1} required />
              </label>
              <label>
                Real MRP
                <input name="price" type="number" min="0" value={mrp} onChange={(event) => setMrp(Number(event.target.value || 0))} required />
              </label>
              <label>
                Offer rule
                <select value={offerMode} onChange={(event) => setOfferMode(event.target.value as OfferMode)}>
                  <option value="1">MRP se ₹1 kam</option>
                  <option value="5">MRP se ₹5 kam</option>
                  <option value="10">MRP se ₹10 kam</option>
                  <option value="CUSTOM">Custom offer price</option>
                </select>
                <small>Calculated offer price: ₹{calculatedOffer()}</small>
              </label>
              {offerMode === "CUSTOM" && (
                <label>
                  Custom offer price
                  <input type="number" min="0" max={mrp} value={customOffer} onChange={(event) => setCustomOffer(Number(event.target.value || 0))} required />
                </label>
              )}
              <label>
                Stock
                <input name="stockQuantity" type="number" min="0" defaultValue={item.stockQuantity} required />
              </label>
              <label className="available-check">
                <input name="isActive" type="checkbox" defaultChecked={!!item.isActive} />
                Available to customers
              </label>
            </section>

            {error && <p className="item-editor-error">{error}</p>}
            <footer>
              <button type="button" onClick={() => setOpen(false)}>Cancel</button>
              <button className="save" disabled={saving}>{saving ? "Saving…" : "Save all changes"}</button>
            </footer>
          </form>
        </div>
      )}
    </>
  );
}
