import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();

function update(relativePath, transform) {
  const target = path.join(root, relativePath);
  const source = fs.readFileSync(target, "utf8");
  const next = transform(source);
  if (next !== source) fs.writeFileSync(target, next);
}

// Section-specific delivery charges (for example Grocery ₹40) must take
// precedence over the global fallback. The previous build patch accidentally
// reversed this order, so the global ₹20 value could overwrite Grocery.
update("app/api/market/route.ts", (source) => {
  const globalFirst = `              coalesce(
                (
                  SELECT cast(value as integer)
                  FROM market_settings
                  WHERE key='delivery_charge'
                ),
                (
                  SELECT cast(value as integer)
                  FROM market_settings
                  WHERE key='delivery_charge_'||market_sections.key
                ),
                20
              ) deliveryCharge`;
  const sectionFirst = `              coalesce(
                (
                  SELECT cast(value as integer)
                  FROM market_settings
                  WHERE key='delivery_charge_'||market_sections.key
                ),
                (
                  SELECT cast(value as integer)
                  FROM market_settings
                  WHERE key='delivery_charge'
                ),
                20
              ) deliveryCharge`;
  return source.includes(globalFirst) ? source.replace(globalFirst, sectionFirst) : source;
});

update("app/api/market-orders/route.ts", (source) =>
  source.replace(
    "config.delivery_charge ?? config[`delivery_charge_${store.vertical}`]",
    "config[`delivery_charge_${store.vertical}`] ?? config.delivery_charge",
  ),
);

// Invalidate the old client catalog cache after this fix so a previously
// cached ₹20 section value cannot survive the deployment.
update("app/page.tsx", (source) =>
  source.replace(
    'const CATALOG_CACHE_KEY = "sabka-delivery-market-catalog-v1";',
    'const CATALOG_CACHE_KEY = "sabka-delivery-market-catalog-v2";',
  ),
);

// Keep the mobile UI exactly as-is, but make the delivery fee/minimum-order
// state update when the same catalog is reused after switching Food/Grocery.
update("app/page.tsx", (source) => {
  const staleBlock = `      const signature = JSON.stringify(data);
      if (signature === marketSignature.current) return;
      marketSignature.current = signature;
      setStores(data.stores || []);`;
  const fixedBlock = `      const signature = JSON.stringify(data);
      const activeSection = (data.sections || []).find(
        (section: { key: string; deliveryCharge?: number; minOrder?: number }) =>
          section.key === mode,
      );
      if (signature === marketSignature.current) {
        setDeliveryFee(Number(activeSection?.deliveryCharge ?? data.deliveryFee ?? 20));
        setMinimumOrder(Number(activeSection?.minOrder || 0));
        return;
      }
      marketSignature.current = signature;
      setStores(data.stores || []);`;
  if (!source.includes(staleBlock)) return source;
  return source.replace(staleBlock, fixedBlock);
});

console.log("Section-specific delivery charges now override the global fallback, and stale client fee data is invalidated safely.");
