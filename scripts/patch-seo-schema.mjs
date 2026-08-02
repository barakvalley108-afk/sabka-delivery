import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();
const target = path.join(root, "app", "layout.tsx");
let source = fs.readFileSync(target, "utf8");

if (!source.includes('import SeoStructuredData from "./seo-structured-data";')) {
  source = source.replace(
    'import SilentStoreSwitch from "./silent-store-switch";',
    'import SilentStoreSwitch from "./silent-store-switch";\nimport SeoStructuredData from "./seo-structured-data";',
  );
}

if (!source.includes("<SeoStructuredData />")) {
  source = source.replace(
    '<script\n          type="application/ld+json"',
    '<SeoStructuredData />\n        <script\n          type="application/ld+json"',
  );
}

if (!source.includes("<SeoStructuredData />")) {
  throw new Error("SEO schema patch could not insert structured data component.");
}

fs.writeFileSync(target, source);
console.log("Site-name and sitelink schema patch applied.");
