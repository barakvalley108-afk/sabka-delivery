"use client";

import { useEffect, useState } from "react";

function romanHindi(name: string, description: string, category: string, storeName: string) {
  const clean = description.trim();
  const base = clean && !/^[.\s]*$/g.test(clean)
    ? `${name} ek tasty aur fresh option hai. ${clean}`
    : category.toLowerCase().includes("grocery") || category.toLowerCase().includes("staple") || category.toLowerCase().includes("vegetable")
      ? `${name} daily use ke liye ek accha grocery item hai. Fresh stock ke saath Lala Bazar mein fast delivery milti hai.`
      : `${name} ek popular food choice hai, fresh taste aur quality ke saath.`;
  return `${base} Ye ${storeName || "selected store"} se available hai. Lala Bazar mein fast delivery ke liye.`;
}

function detectNonVeg(name: string, description: string, category: string) {
  return /\b(egg|eggs|anda|andaa|chicken|mutton|fish|prawn|prawns|seafood|meat|keema|bacon|ham|sausage|salami|tuna|pork|beef)\b/i.test(`${name} ${description} ${category}`);
}

export default function ProductQuickView() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ name: "", description: "", image: "", price: "", category: "", storeName: "", isVeg: false, isNonVeg: false });

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const card = target?.closest("article.product-card") as HTMLElement | null;
      if (!card || target?.closest("button,select,a,input,textarea")) return;

      const name = card.querySelector("h3")?.textContent?.trim() || "Product";
      const description = card.querySelector("p")?.textContent?.trim() || "";
      const price = card.querySelector(".price-row b")?.textContent?.trim() || "";
      const category = card.querySelector(".variant-label")?.textContent?.trim() || "food";
      const storeName = card.querySelector(".product-info > small")?.textContent?.trim() || "";
      const visual = card.querySelector(".product-visual") as HTMLElement | null;
      const image = visual?.style.backgroundImage?.replace(/^url\([\"']?/, "").replace(/[\"']?\)$/, "") || "";
      const detectedNonVeg = detectNonVeg(name, description, category);
      const markedVeg = !!card.querySelector(".product-visual .veg");
      const markedNonVeg = !!card.querySelector(".product-visual .nonveg, .product-visual .non-veg") || detectedNonVeg;

      setData({ name, description, image, price, category, storeName, isVeg: markedVeg && !markedNonVeg, isNonVeg: markedNonVeg });
      setOpen(true);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

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

  const text = romanHindi(data.name, data.description, data.category, data.storeName);
  const categoryLower = data.category.toLowerCase();
  const isGrocery = categoryLower.includes("grocery") || categoryLower.includes("staple") || categoryLower.includes("vegetable");
  const isDrink = /drink|beverage|juice|soda|fizz|shake|lassi|cold|water/i.test(`${data.name} ${data.category} ${data.description}`);
  const foodType = data.isNonVeg ? "NON-VEG" : data.isVeg ? "VEG" : "FOOD";
  const warningText = isGrocery
    ? "Grocery item hai. Product details aur ingredients pack par check kar lena. Preference ya quality issue ho to order se pehle store se confirm kar lena."
    : isDrink
      ? "Drink preparation mein ingredients, syrup, sugar ya flavouring use ho sakti hai. Allergy ya special preference ho to order se pehle restaurant se confirm kar lena."
      : data.isNonVeg
        ? "Ye non-veg item hai. Isme egg, chicken, fish, meat ya other non-veg ingredients ho sakte hain. Allergy ya special preference ho to order se pehle restaurant se confirm kar lena."
        : data.isVeg
          ? "Ye veg item hai. Preparation mein onion, garlic, sauce ya seasoning use ho sakta hai. Agar aap strict vegetarian hain to order se pehle restaurant se confirm kar lena."
          : "Ingredients aur preparation restaurant se confirm kar lena, khaaskar agar allergy ya special dietary preference ho.";

  return (
    <div className="product-quick-view-overlay" onClick={() => setOpen(false)}>
      <article className="product-quick-view single-product-view" onClick={(e) => e.stopPropagation()}>
        <button className="product-quick-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
        <div className="single-product-image-wrap">
          <div
            className="single-product-image"
            style={data.image ? { backgroundImage: `url(${data.image})` } : undefined}
            aria-label={`${data.name} product image`}
          />
        </div>
        <div className="product-quick-content">
          <small>SABKA DELIVERY · PREMIUM PICK</small>
          <div className={`product-food-type product-food-type-${data.isNonVeg ? "nonveg" : data.isVeg ? "veg" : "food"}`}>
            {foodType}
          </div>
          <h2 className="product-quick-title-animate">{data.name}</h2>
          <div className="product-quick-price product-quick-price-animate">{data.price}</div>
          <div className="product-quick-store">
            <span>{isGrocery ? "Grocery store" : "Restaurant"}</span>
            <strong>{data.storeName || "Store name unavailable"}</strong>
          </div>
          <p className="product-quick-description-animate">{text}</p>
          <div className={`product-quick-warning product-quick-warning-${data.isNonVeg ? "nonveg" : data.isVeg ? "veg" : "general"}`}>
            <strong>⚠️ {data.isNonVeg ? "NON-VEG WARNING" : data.isVeg ? "VEG WARNING" : "WARNING"}</strong>
            <span>{warningText}</span>
          </div>
          <div className="product-quick-actions">
            <button className="product-quick-add" onClick={() => addToCart(true)}>BUY NOW</button>
            <button className="product-quick-cart" onClick={() => addToCart(false)}>ADD TO CART</button>
          </div>
        </div>
      </article>
    </div>
  );
}
