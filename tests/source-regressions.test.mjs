import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

const sqlFilesUnder = (directory) =>
  readdirSync(directory, { recursive: true })
    .map(String)
    .filter((path) => path.endsWith(".sql"))
    .map((path) => `${directory}/${path}`);

test("homepage rendering performs no D1 work and client loads the snapshot", () => {
  const page = read("app/page.tsx");
  const home = read("app/market-home.tsx");
  assert.doesNotMatch(page, /force-dynamic|getInitialMarketCatalog/);
  assert.match(page, /const initialMarket/);
  assert.match(home, /fetch\("\/api\/market"/);
  assert.match(home, /useLiveRefresh\(refreshMarket/);
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

test("database initialization and migrations never seed demo coupons", () => {
  const seedSources = [
    "db/control-store.ts",
    ...sqlFilesUnder("drizzle"),
    ...sqlFilesUnder("migrations"),
  ]
    .map(read)
    .join("\n");
  const retiredCodes = [
    ["WELCOME", "20"].join(""),
    ["SABKA", "50"].join(""),
  ];

  assert.doesNotMatch(
    seedSources,
    /INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+[`"]?market_promotions[`"]?/i,
  );
  for (const code of retiredCodes) {
    assert.equal(seedSources.toUpperCase().includes(code), false);
  }
});

test("normal runtime database helpers contain no schema or seed work", () => {
  const runtimeStores = [
    "db/market-store.ts",
    "db/control-store.ts",
    "db/catalog-store.ts",
    "db/orders-store.ts",
  ]
    .map(read)
    .join("\n");
  assert.doesNotMatch(
    runtimeStores,
    /\b(?:CREATE\s+(?:TABLE|TRIGGER|INDEX)|ALTER\s+TABLE|INSERT\s+OR\s+IGNORE)\b/i,
  );
  assert.match(runtimeStores, /env\.DB|getMarketDatabase/);
});

test("catalog customer read uses one snapshot select and never writes", () => {
  const catalog = read("db/market-catalog.ts");
  const readSection = catalog.slice(
    catalog.indexOf("export async function getMarketCatalog"),
    catalog.indexOf("export async function refreshMarketCatalogSnapshot"),
  );
  assert.match(catalog, /CATALOG_READ_TIMEOUT_MS/);
  assert.match(readSection, /getPersistedCatalog/);
  assert.doesNotMatch(readSection, /queryMarketCatalog/);
  assert.doesNotMatch(readSection, /db\.batch\(\[/);
  assert.doesNotMatch(readSection, /\.run\(\)/);
  assert.doesNotMatch(readSection, /INSERT INTO market_catalog_snapshots/);
  assert.match(catalog, /INSERT INTO market_catalog_snapshots/);
});

test("deployment migration owns schema and revision triggers without coupons", () => {
  const migration = read("migrations/runtime/0001_schema.sql");
  const triggerCount = (
    migration.match(/CREATE TRIGGER IF NOT EXISTS catalog_revision_/g) || []
  ).length;
  assert.match(migration, /CREATE TABLE IF NOT EXISTS market_stores/);
  assert.equal(triggerCount, 45);
  assert.doesNotMatch(
    migration,
    /INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+market_promotions/i,
  );
});

test("catalog snapshots refresh only after admin or partner catalog mutations", () => {
  const admin = read("app/api/admin/control/route.ts");
  const partner = read("app/api/partner/control/route.ts");
  assert.match(admin, /refreshMarketCatalogSnapshot/);
  assert.match(partner, /refreshMarketCatalogSnapshot/);
  assert.match(admin, /refreshCatalogFallback/);
  assert.match(partner, /refreshCatalogFallback/);
});

test("online payment cannot enter success until backend confirmation", () => {
  const orderApi = read("app/api/market-orders/route.ts");
  const paymentApi = read("app/api/market-payment-status/route.ts");
  const paymentService = read("db/payment-orders.ts");
  const home = read("app/market-home.tsx");
  const partner = read("app/api/partner/control/route.ts");
  assert.match(orderApi, /payment === "UPI"\s*\?\s*"PAYMENT_PENDING"/);
  assert.match(orderApi, /confirmed: payment === "COD"/);
  assert.match(paymentService, /SET status='PLACED'/);
  assert.match(paymentService, /SET status='PAID'/);
  assert.match(paymentApi, /confirmed: order\.confirmed/);
  assert.match(home, /if \(data\.order\?\.confirmed\)/);
  assert.match(home, /checkout !== "payment-pending"/);
  assert.match(partner, /o\.status!='PAYMENT_PENDING'/);
});

test("success lottie is exact, lazy, one-shot and reduced-motion safe", () => {
  const home = read("app/market-home.tsx");
  const success = read("app/order-success.tsx");
  const animation = "public/animations/success.lottie";
  assert.equal(existsSync(animation), true);
  assert.equal(readFileSync(animation).byteLength, 2870);
  assert.match(home, /dynamic\(\(\) => import\("\.\/order-success"\)/);
  assert.match(success, /src="\/animations\/success\.lottie"/);
  assert.match(success, /loop=\{false\}/);
  assert.match(success, /prefers-reduced-motion: reduce/);
  assert.match(success, /success-static-icon/);
  assert.match(success, /Order Placed Successfully/);
  assert.match(success, /Estimated delivery/);
  assert.match(success, /Track Order/);
  assert.match(success, /Continue Shopping/);
});

test("expired online payments are cancelled by a bounded scheduled sweep", () => {
  const worker = read("worker/index.ts");
  const payment = read("db/payment-orders.ts");
  const wrangler = read("wrangler.runtime.jsonc");
  assert.match(worker, /scheduled\(/);
  assert.match(worker, /expirePendingPayments/);
  assert.match(payment, /DEFAULT_SWEEP_LIMIT = 25/);
  assert.match(payment, /SET status='CANCELLED'/);
  assert.match(payment, /stock_quantity=stock_quantity\+\?/);
  assert.match(wrangler, /"crons": \["\*\/5 \* \* \* \*"\]/);
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
