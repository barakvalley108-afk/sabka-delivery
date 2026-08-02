import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();
const target = path.join(root, "app", "page.tsx");
let source = fs.readFileSync(target, "utf8");

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

fs.writeFileSync(target, source);
console.log("Fresh-catalog loading patch applied.");
