import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();
const file = path.join(root, "app/page.tsx");
let source = fs.readFileSync(file, "utf8");

if (!source.includes('import CustomerEnhancers from "./customer-enhancers";')) {
  source = source.replace(
    'import OrderFailed from "./order-failed";',
    'import OrderFailed from "./order-failed";\nimport CustomerEnhancers from "./customer-enhancers";',
  );
}

if (!source.includes("<CustomerEnhancers />")) {
  const start = source.lastIndexOf("return (\n    <main");
  if (start !== -1) {
    source = source.slice(0, start) + source.slice(start).replace(
      "return (\n    <main",
      "return (\n    <>\n      <CustomerEnhancers />\n      <main",
    );
    const end = source.lastIndexOf("</main>\n  );");
    if (end !== -1) {
      source = source.slice(0, end) + "</main>\n    </>\n  );" + source.slice(end + "</main>\n  );".length);
    }
  }
}

fs.writeFileSync(file, source);
console.log("Customer-only enhancers isolated to the homepage.");
