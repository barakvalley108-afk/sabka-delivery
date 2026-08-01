"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { retailMartSeedCatalog, type RetailMartSeedItem } from "./retail-mart-seed";

type ParsedItem = RetailMartSeedItem;

const ignored = ["RETAIL MART", "STOCK VALUATION", "S.NO.", "CONTINUED", "PAGE NO", "TOTAL"];

function quantityFromName(name: string) {
  const pack = name.match(/(\d+(?:\.\d+)?\s*(?:KG|GM|G|ML|LTR|LITRE|L))\b/i);
  if (pack) return pack[1].replace(/\s+/g, "").toUpperCase();
  const carton = name.match(/\((1\s*[x*]\s*\d+)\)/i);
  if (carton) return carton[1].replace(/\s+/g, "").toUpperCase();
  const diaper = name.match(/\b(?:NB|S|M|L|XL|XXL)\d+\b/i);
  if (diaper) return diaper[0].toUpperCase();
  return "1 pack";
}

function parseStock(text: string) {
  const rows = text.replace(/\r/g, "").split("\n");
  const result: ParsedItem[] = [];
  let category = "Pickles & Chutney";
  const productPattern = /^\s*\d+\s+(.+?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(?:(\w{3}\.,\d{4})\s+)?(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*$/;

  for (const raw of rows) {
    const line = raw.trim();
    if (!line || /^-{10,}$/.test(line)) continue;
    const upper = line.toUpperCase();
    const isIgnored = ignored.some((entry) => upper.includes(entry));
    if (/^[A-Z0-9/& $.-]{2,40}$/.test(line) && !/^\d/.test(line) && !isIgnored) {
      category = line
        .replace("BABY DYPER", "Baby Diapers")
        .replace("BATRRY", "Battery")
        .replace("BESEN", "Besan")
        .replace("B/SALT", "Salt");
      continue;
    }
    const match = line.match(productPattern);
    if (!match) continue;
    const name = match[1].trim();
    const mrp = Math.round(Number(match[3]));
    const expiry = match[4] || "";
    const stock = Math.floor(Number(match[5]));
    if (!name || mrp <= 0 || stock <= 0) continue;
    result.push({ category, name, quantity: quantityFromName(name), mrp, stock, expiry });
  }
  return result;
}

export default function RetailMartImporter() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [items, setItems] = useState<ParsedItem[]>(retailMartSeedCatalog);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(`${retailMartSeedCatalog.length} provided products ready`);
  const categoryCount = useMemo(() => new Set(items.map((item) => item.category)).size, [items]);

  useEffect(() => {
    function sync() {
      const heading = document.querySelector(".admin-top h1");
      const work = document.querySelector(".admin-work");
      const existing = document.getElementById("retail-mart-import-slot");
      if (heading?.textContent?.trim() !== "Catalog" || !work) {
        existing?.remove();
        setTarget(null);
        return;
      }
      let slot = existing;
      if (!slot) {
        slot = document.createElement("div");
        slot.id = "retail-mart-import-slot";
        work.querySelector(".admin-top")?.insertAdjacentElement("afterend", slot);
      }
      setTarget(slot as HTMLElement);
    }
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => {
      observer.disconnect();
      document.getElementById("retail-mart-import-slot")?.remove();
    };
  }, []);

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setMessage("");
    try {
      const parsed = parseStock(await file.text());
      setFileName(file.name);
      setItems(parsed);
      setMessage(parsed.length ? `${parsed.length} positive-stock products ready` : "Products parse nahi hue");
    } catch {
      setMessage("TXT file read nahi hui");
    }
  }

  function useProvidedCatalog() {
    setFileName("Provided Retail Mart stock list");
    setItems(retailMartSeedCatalog);
    setMessage(`${retailMartSeedCatalog.length} provided products ready`);
  }

  async function importCatalog() {
    if (!items.length || busy) return;
    if (!window.confirm(`${items.length} products Retail Mart me actual add karna hai?`)) return;
    setBusy(true);
    setMessage("Products database me add ho rahe hain…");
    try {
      const response = await fetch("/api/admin/retail-mart-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Import failed");
      setMessage(`✓ ${data.added} products actual catalog me added · ${data.skipped} duplicate/invalid skipped`);
      window.setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  if (!target) return null;
  return createPortal(
    <section className="retail-import-card">
      <div>
        <small>RETAIL MART ACTUAL CATALOG</small>
        <h2>Provided stock list website me add karo</h2>
        <p>Button dabate hi products Retail Mart database me add honge. Grocery page par category, item, quantity, MRP, ₹1 kam offer aur ADD button dikhega.</p>
      </div>
      <div className="retail-import-actions">
        <button type="button" className="provided" onClick={useProvidedCatalog}>Use provided catalog</button>
        <label>
          <input type="file" accept=".txt,text/plain" onChange={chooseFile} />
          {fileName ? `✓ ${fileName}` : "Or choose another TXT"}
        </label>
      </div>
      <div className="retail-import-stats">
        <b>{items.length}</b><span>products</span><b>{categoryCount}</b><span>categories</span>
      </div>
      <button type="button" disabled={!items.length || busy} onClick={() => void importCatalog()}>
        {busy ? "Adding products…" : "ADD TO RETAIL MART NOW"}
      </button>
      {message && <strong>{message}</strong>}
      <style jsx global>{`
        .retail-import-card{margin:16px 22px 0;padding:18px;border:1px solid #b9dfc2;border-radius:16px;background:linear-gradient(135deg,#f7fff8,#eaffee);display:grid;grid-template-columns:minmax(260px,1fr) minmax(230px,.8fr) auto;align-items:center;gap:14px;box-shadow:0 8px 28px #17432110}.retail-import-card small{font-size:9px;font-weight:950;letter-spacing:1.4px;color:#16833b}.retail-import-card h2{margin:4px 0;font-size:20px}.retail-import-card p{margin:0;color:#657068;font-size:12px}.retail-import-actions{display:grid;gap:8px}.retail-import-actions button,.retail-import-actions label{min-height:44px;border:1px solid #b9d7c0;border-radius:11px;background:#fff;padding:10px 12px;display:grid;place-items:center;text-align:center;font-weight:900;cursor:pointer}.retail-import-actions .provided{background:#e8f8ec;color:#126f32}.retail-import-actions label input{position:absolute;width:1px;height:1px;opacity:0}.retail-import-stats{display:grid;grid-template-columns:auto auto;gap:2px 7px;align-items:center}.retail-import-stats b{font-size:20px;color:#16833b}.retail-import-stats span{font-size:10px;color:#68736c}.retail-import-card>button{grid-column:3;min-height:48px;border:0;border-radius:11px;background:#16833b;color:#fff;padding:0 18px;font-weight:950;cursor:pointer}.retail-import-card>button:disabled{opacity:.5;cursor:not-allowed}.retail-import-card>strong{grid-column:1/-1;font-size:12px;color:#245c35}@media(max-width:800px){.retail-import-card{margin:12px;grid-template-columns:1fr}.retail-import-card>button{grid-column:1}.retail-import-card>strong{grid-column:1}}
      `}</style>
    </section>,
    target,
  );
}
