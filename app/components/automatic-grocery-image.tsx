"use client";

import { useEffect } from "react";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapWords(value: string, max = 18) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function iconFor(name: string) {
  const text = name.toLowerCase();
  if (/rice|chawal|basmati/.test(text)) return "🍚";
  if (/atta|flour|maida|suji/.test(text)) return "🌾";
  if (/oil|ghee/.test(text)) return "🫗";
  if (/milk|dairy|curd|paneer|butter/.test(text)) return "🥛";
  if (/biscuit|cookie|hide|parle|oreo/.test(text)) return "🍪";
  if (/chips|namkeen|snack/.test(text)) return "🥨";
  if (/juice|drink|cola|soda|water/.test(text)) return "🥤";
  if (/tea|coffee/.test(text)) return "☕";
  if (/soap|shampoo|clean|detergent/.test(text)) return "🧴";
  if (/masala|spice|salt|sugar/.test(text)) return "🧂";
  if (/noodle|maggi|pasta/.test(text)) return "🍜";
  if (/chocolate|candy/.test(text)) return "🍫";
  return "🛍️";
}

function makeImage(name: string, quantity: string) {
  const lines = wrapWords(name || "Grocery Item");
  const title = lines
    .map((line, index) => `<text x="600" y="${300 + index * 72}" text-anchor="middle" font-size="58" font-weight="800" fill="#21150d">${escapeXml(line)}</text>`)
    .join("");
  const qty = quantity
    ? `<rect x="410" y="500" width="380" height="78" rx="39" fill="#c7181b"/><text x="600" y="552" text-anchor="middle" font-size="38" font-weight="800" fill="#fff">${escapeXml(quantity)}</text>`
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff8df"/>
        <stop offset="1" stop-color="#ffe3a3"/>
      </linearGradient>
      <filter id="shadow"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-opacity=".18"/></filter>
    </defs>
    <rect width="1200" height="800" rx="46" fill="url(#bg)"/>
    <circle cx="110" cy="105" r="150" fill="#ffc21c" opacity=".28"/>
    <circle cx="1090" cy="710" r="210" fill="#c7181b" opacity=".10"/>
    <rect x="250" y="90" width="700" height="620" rx="54" fill="#fff" filter="url(#shadow)"/>
    <text x="600" y="230" text-anchor="middle" font-size="112">${iconFor(name)}</text>
    ${title}
    ${qty}
    <text x="600" y="655" text-anchor="middle" font-size="28" font-weight="700" fill="#8a5a27">SABKA DELIVERY · RETAIL MART</text>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function applyImages() {
  document.querySelectorAll<HTMLElement>(".product-card").forEach((card) => {
    const visual = card.querySelector<HTMLElement>(".product-visual");
    if (!visual || visual.dataset.autoGroceryImage === "1") return;

    const current = visual.style.backgroundImage;
    if (current && current !== "none" && !current.includes("url(\"\")")) return;

    const name = card.querySelector("h3")?.textContent?.trim() || "Grocery Item";
    const select = card.querySelector<HTMLSelectElement>("select");
    const quantity =
      select?.selectedOptions?.[0]?.textContent?.trim() ||
      card.querySelector(".variant-label")?.textContent?.trim() ||
      "";

    visual.style.backgroundImage = `url("${makeImage(name, quantity)}")`;
    visual.style.backgroundSize = "cover";
    visual.style.backgroundPosition = "center";
    visual.dataset.autoGroceryImage = "1";
  });
}

export default function AutomaticGroceryImage() {
  useEffect(() => {
    applyImages();
    const observer = new MutationObserver(() => applyImages());
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("change", applyImages);
    return () => {
      observer.disconnect();
      document.removeEventListener("change", applyImages);
    };
  }, []);

  return null;
}
