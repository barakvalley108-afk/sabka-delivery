import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();

function update(relativePath, transform) {
  const target = path.join(root, relativePath);
  const source = fs.readFileSync(target, "utf8");
  const next = transform(source);
  if (next !== source) fs.writeFileSync(target, next);
}

update("app/api/market/route.ts", (source) => {
  const sectionFirst = `              coalesce(\n                (\n                  SELECT cast(value as integer)\n                  FROM market_settings\n                  WHERE key='delivery_charge_'||market_sections.key\n                ),\n                (\n                  SELECT cast(value as integer)\n                  FROM market_settings\n                  WHERE key='delivery_charge'\n                ),\n                20\n              ) deliveryCharge`;
  const globalFirst = `              coalesce(\n                (\n                  SELECT cast(value as integer)\n                  FROM market_settings\n                  WHERE key='delivery_charge'\n                ),\n                (\n                  SELECT cast(value as integer)\n                  FROM market_settings\n                  WHERE key='delivery_charge_'||market_sections.key\n                ),\n                20\n              ) deliveryCharge`;
  return source.includes(sectionFirst) ? source.replace(sectionFirst, globalFirst) : source;
});

update("app/api/market-orders/route.ts", (source) =>
  source.replace(
    "config[`delivery_charge_${store.vertical}`] ?? config.delivery_charge",
    "config.delivery_charge ?? config[`delivery_charge_${store.vertical}`]",
  ),
);

console.log("Global delivery charge now overrides old section-specific fallback values.");
