"use client";

import { useEffect, useState } from "react";

function romanHindi(name: string, description: string, category: string) {
  const clean = description.trim();
  if (clean && !/^[.\s]*$/g.test(clean)) {
    return `${name} ek tasty aur fresh option hai. ${clean} Lala Bazar mein jaldi delivery ke liye available hai.`;
  }
  const cat = category.toLowerCase();
  if (cat.includes("grocery") || cat.includes("staple") || cat.includes("vegetable")) {
    return `${name} daily use ke liye ek accha grocery item hai. Fresh stock ke saath Lala Bazar mein fast delivery milti hai.`;
  }
  return `${name} ek popular food choice hai, fresh taste aur quality ke saath. Lala Bazar mein fast delivery ke liye available hai.`;
}

export default function ProductQuickView() {
  const [open, setOpen] = useState(false);
  const [angle, setAngle] = useState(0);
  const [data, setData] = useState({ name: "", description: "", image: "", price: "", category: "", addSelector: "" });

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const card = target?.closest("article.product-card") as HTMLElement | null;
      if (!card || target?.closest("button,select,a,input,textarea")) return;
      const title = card.querySelector("h3")?.textContent?.trim() || "Product";
      const description = card.querySelector("p")?.textContent?.trim() || "";
      const price = card.querySelector(".price-row b")?.textContent?.trim() || "";
      const category = card.querySelector(".variant-label")?.textContent?.trim() || "food";
      const visual = card.querySelector(".product-visual") as HTMLElement | null;
      const image = visual?.style.backgroundImage?.replace(/^url\([\"']?/, "").replace(/[\"']?\)$/, "") || "";
      setData({ name: title, description, image, price, category, addSelector: "article.product-card" });
      setAngle(0);
      setOpen(true);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => setAngle((value) => (value + 1) % 3), 1800);
    return () => window.clearInterval(timer);
  }, [open]);

  function addToCart(andOpenCart = false) {
    const cards = Array.from(document.querySelectorAll("article.product-card"));
    const match = cards.find((card) => card.querySelector("h3")?.textContent?.trim() === data.name);
    const add = match?.querySelector<HTMLButtonElement>(".price-row button:not(:disabled)");
    add?.click();
    setOpen(false);
    if (andOpenCart) {
      window.setTimeout(() => {
        const cartButton = document.querySelector<HTMLButtonElement>("button[aria-label^='Cart mein']") ||
          (Array.from(document.querySelectorAll("button")).find((button) => button.textContent?.trim().toLowerCase().startsWith("cart")) as HTMLButtonElement | undefined);
        cartButton?.click();
      }, 180);
    }
  }

  if (!open) return null;
  const text = romanHindi(data.name, data.description, data.category);
  const angleLabels = ["Front", "Left angle", "Right angle"];
  return (
    <div className="product-quick-view-overlay" onClick={() => setOpen(false)}>
      <article className="product-quick-view" onClick={(e) => e.stopPropagation()}>
        <button className="product-quick-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
        <div className="product-quick-gallery">
          <div className="product-quick-gallery-row" role="tablist" aria-label="Product angles">
            {[0, 1, 2].map((index) => (
              <button
                key={index}
                type="button"
                className={`product-angle-card angle-${index} ${angle === index ? "active" : ""}`}
                onClick={() => setAngle(index)}
                aria-selected={angle === index}
                role="tab"
              >
                <span className="product-angle-image" style={data.image ? { backgroundImage: `url(${data.image})` } : undefined} />
                <small>{angleLabels[index]}</small>
              </button>
            ))}
          </div>
          <div className="product-quick-dots" role="tablist" aria-label="Product image angle dots">
            {[0, 1, 2].map((index) => (
              <button
                key={index}
                type="button"
                className={angle === index ? "active" : ""}
                aria-label={`Show ${angleLabels[index]}`}
                onClick={() => setAngle(index)}
              />
            ))}
          </div>
        </div>
        <div className="product-quick-content">
          <small>SABKA DELIVERY · PREMIUM PICK</small>
          <h2 key={`${data.name}-${angle}`} className="product-quick-title-animate">{data.name}</h2>
          <div key={`${data.price}-${angle}`} className="product-quick-price product-quick-price-animate">{data.price}</div>
          <p key={`${data.description}-${angle}`} className="product-quick-description-animate">{text}</p>
          <div className="product-quick-actions">
            <button className="product-quick-add" onClick={() => addToCart(true)}>BUY NOW</button>
            <button className="product-quick-cart" onClick={() => addToCart(false)}>ADD TO CART</button>
          </div>
        </div>
      </article>
    </div>
  );
}
