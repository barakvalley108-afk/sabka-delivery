import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("homepage is dynamic and initialized from server catalog data", () => {
  const page = read("app/page.tsx");
  const home = read("app/market-home.tsx");
  assert.match(page, /dynamic\s*=\s*"force-dynamic"/);
  assert.match(page, /revalidate\s*=\s*0/);
  assert.match(page, /getInitialMarketCatalog/);
  assert.match(home, /useState\(initialMarket\.promotions/);
  assert.doesNotMatch(home, /useEffect\(\(\)\s*=>\s*\{\s*void loadMarket/);
});

test("coupon validation has no unknown/private fallback", () => {
  const sources = [
    read("db/coupon-service.ts"),
    read("app/api/market-coupons/validate/route.ts"),
    read("app/market-home.tsx"),
  ].join("\n");
  assert.doesNotMatch(sources, /private\s+coupon/i);
  assert.doesNotMatch(sources, /unknown\s+coupon\s+accepted/i);
  assert.match(sources, /FROM market_promotions/);
  assert.match(sources, /error: "Invalid coupon"/);
  assert.match(sources, /reason: "INVALID"/);
});

test("service worker v68 never caches HTML, API, scripts or framework chunks", () => {
  const worker = read("public/sw.js");
  assert.match(worker, /sabka-delivery-app-v68/);
  assert.match(worker, /request\.mode === "navigate"/);
  assert.match(worker, /url\.pathname\.startsWith\("\/api\/"\)/);
  assert.match(worker, /url\.pathname\.startsWith\("\/_next\/"\)/);
  assert.match(worker, /request\.destination === "document"/);
  assert.match(worker, /request\.destination === "script"/);
});

test("brand metadata, manifest and favicon assets are complete", () => {
  const layout = read("app/layout.tsx");
  const manifest = JSON.parse(read("public/manifest.webmanifest"));
  const home = read("app/market-home.tsx");
  assert.match(layout, /Sabka Delivery \| Food, Grocery & Electronics/);
  assert.match(layout, /openGraph:[\s\S]*title: "Sabka Delivery"/);
  assert.equal(manifest.name, "Sabka Delivery");
  assert.equal(manifest.short_name, "Sabka Delivery");
  assert.match(home, />Sabka Delivery<\/b>/);
  for (const icon of [
    "app/favicon.ico",
    "app/icon.png",
    "app/apple-icon.png",
    "public/icon-192.png",
    "public/icon-512.png",
  ]) {
    assert.equal(existsSync(icon), true, `${icon} must exist`);
  }
});
