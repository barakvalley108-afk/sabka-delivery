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

  function show() {
    setImage(item.image || "");
    setError("");
    setOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
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
        price: Number(form.get("price") || 0),
        discountPrice: Number(form.get("discountPrice") || form.get("price") || 0),
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
              <button type="button" onClick={() => setOpen(false)} aria-label="Close editor">
                ×
              </button>
            </header>

            <ImagePicker value={image} onChange={setImage} label="Change item photo" />

            <section>
              {stores && (
                <label>
                  Shop
                  <select name="storeId" defaultValue={item.storeId} required>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
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
                Category
                <input name="category" defaultValue={item.category} required />
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
                Size / pack label
                <input name="label" defaultValue={item.label} required />
              </label>
              <label>
                Unit
                <select name="unit" defaultValue={item.unit}>
                  {[
                    "PIECE",
                    "PACK",
                    "PLATE",
                    "GM",
                    "KG",
                    "ML",
                    "LITRE",
                  ].map((unit) => <option key={unit}>{unit}</option>)}
                </select>
              </label>
              <label>
                Unit value
                <input name="unitValue" type="number" min="0.01" step="0.01" defaultValue={item.unitValue || 1} required />
              </label>
              <label>
                Regular price
                <input name="price" type="number" min="0" defaultValue={item.price} required />
              </label>
              <label>
                Offer price
                <input name="discountPrice" type="number" min="0" defaultValue={item.discountPrice || item.price} required />
                <small>Customer ko dikhne wala final price. Discount percent automatically calculate hoga.</small>
              </label>
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
