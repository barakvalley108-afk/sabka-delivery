"use client";

import { useEffect, useState } from "react";

const FALLBACKS = [
  "/images/hero-food-collage.png",
  "/images/hero-food.png",
  "/images/biryani-card.png",
  "/images/curry-card.png",
  "/images/grocery-daily-needs.png",
  "/images/grocery-vegetables.png",
  "/images/grocery-staples.png",
  "/images/electronics-hero.webp",
  "/images/sabka-delivery-logo.png",
  "/images/hero-food-collage.png",
];

async function compressImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Sirf image file select karo.");
  const bitmap = await createImageBitmap(file);
  const max = 1280;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image process nahi hui.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/webp", 0.72);
}

export default function BannerManager() {
  const [banners, setBanners] = useState<string[]>(FALLBACKS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetch("/api/banners", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data?.banners)) setBanners(data.banners.slice(0, 10));
      })
      .catch(() => undefined);
  }, []);

  async function choose(slot: number, file: File) {
    try {
      const value = await compressImage(file);
      setBanners((current) => current.map((item, index) => (index === slot ? value : item)));
      setMessage(`Banner ${slot + 1} ready — Save Banners dabao.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Image select nahi hui.");
    }
  }

  function useUrl(slot: number, value: string) {
    setBanners((current) => current.map((item, index) => (index === slot ? value : item)));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banners: banners.map((image, index) => ({ slot: index + 1, image })) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Banner save failed");
      setMessage("✓ 10 banners save ho gaye. Customer website automatically update hogi.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Banner save nahi hua.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="banner-manager">
      <div className="banner-manager-head">
        <div>
          <small>HERO BANNER MANAGER</small>
          <h2>10 rotating banners</h2>
          <p>Har slot mein image upload karo ya direct image URL do. Website par 1 → 2 → 3… → 10 automatically chalega.</p>
        </div>
        <button type="button" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Banners"}</button>
      </div>
      {message && <div className="banner-manager-message">{message}</div>}
      <div className="banner-manager-grid">
        {banners.map((image, index) => (
          <article className="banner-manager-card" key={index}>
            <div className="banner-number">Banner {index + 1}</div>
            <div className="banner-preview">
              <img src={image || FALLBACKS[index]} alt={`Banner ${index + 1}`} />
            </div>
            <label className="banner-upload">
              Upload image
              <input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void choose(index, file); }} />
            </label>
            <label>
              Image URL
              <input value={image} onChange={(event) => useUrl(index, event.target.value)} placeholder="https://... or /images/..." />
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}
