import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();
const pageTarget = path.join(root, "app", "page.tsx");
const layoutTarget = path.join(root, "app", "layout.tsx");
let source = fs.readFileSync(pageTarget, "utf8");

source = source.replace(
  'const [showCatalogLoader, setShowCatalogLoader] = useState(false);',
  'const [showCatalogLoader] = useState(true);',
);

const oldEffect = `  useEffect(() => {
    const showLoaderTimer = window.setTimeout(
      () => setShowCatalogLoader(true),
      120,
    );

    const fallbackTimer = window.setTimeout(
      () => setCatalogReady(true),
      1800,
    );

    try {
      window.localStorage.removeItem(CATALOG_CACHE_KEY);
    } catch {
      // Ignore browsers where storage is unavailable.
    }

    return () => {
      window.clearTimeout(showLoaderTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, []);`;

const newEffect = `  useEffect(() => {
    try {
      window.localStorage.removeItem(CATALOG_CACHE_KEY);
    } catch {
      // Storage unavailable: fresh API loading still continues.
    }
  }, []);`;

if (source.includes(oldEffect)) {
  source = source.replace(oldEffect, newEffect);
} else {
  source = source.replace(
    /  useEffect\(\(\) => \{\n    const showLoaderTimer[\s\S]*?window\.clearTimeout\(fallbackTimer\);\n    \};\n  \}, \[\]\);/,
    newEffect,
  );
}

if (source.includes("setShowCatalogLoader(")) {
  throw new Error("Loading patch incomplete: delayed loader setter still exists.");
}
if (source.includes("fallbackTimer")) {
  throw new Error("Loading patch incomplete: stale catalog fallback still exists.");
}

fs.writeFileSync(pageTarget, source);

let layout = fs.readFileSync(layoutTarget, "utf8");
if (!layout.includes('import "./loading-performance.css";')) {
  layout = layout.replace(
    'import "./grocery-product-smooth.css";',
    'import "./grocery-product-smooth.css";\nimport "./loading-performance.css";',
  );
}
fs.writeFileSync(layoutTarget, layout);
console.log("Fresh-catalog loading patch applied.");
