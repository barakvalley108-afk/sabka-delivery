import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();
const target = path.join(root, "app", "layout.tsx");
let source = fs.readFileSync(target, "utf8");

// Newer layouts already include JSON-LD directly. In that case there is
// nothing to patch and the build must continue safely.
if (
  source.includes('type="application/ld+json"') ||
  source.includes("localBusinessJsonLd") ||
  source.includes("<SeoStructuredData />")
) {
  console.log("SEO structured data already present; patch skipped safely.");
  process.exit(0);
}

const importAnchor = 'import SilentStoreSwitch from "./silent-store-switch";';
if (
  source.includes(importAnchor) &&
  !source.includes('import SeoStructuredData from "./seo-structured-data";')
) {
  source = source.replace(
    importAnchor,
    `${importAnchor}\nimport SeoStructuredData from "./seo-structured-data";`,
  );
}

const headAnchor = "<head>";
if (source.includes(headAnchor) && !source.includes("<SeoStructuredData />")) {
  source = source.replace(headAnchor, `${headAnchor}\n        <SeoStructuredData />`);
}

// Do not break production builds if the layout shape changes again.
if (!source.includes("<SeoStructuredData />")) {
  console.warn("SEO schema patch skipped: compatible insertion point not found.");
  process.exit(0);
}

fs.writeFileSync(target, source);
console.log("Site-name and sitelink schema patch applied.");
