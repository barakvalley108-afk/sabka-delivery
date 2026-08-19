import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();

function ensure(file, needles) {
  const target = path.join(root, file);
  const source = fs.readFileSync(target, "utf8");
  for (const needle of needles) {
    if (!source.includes(needle)) throw new Error(`Commission Slabs UI missing in ${file}: ${needle}`);
  }
}

// Commission Slabs are implemented as dedicated routes. The build step must
// verify those routes instead of requiring navigation text to be embedded in
// the large dashboard console components.
ensure("app/super-admin/commission-slabs/page.tsx", [
  "CommissionSlabsPage",
  "mode=\"super-admin\"",
]);

ensure("app/owner-panel/commission-slabs/page.tsx", [
  "CommissionSlabsPage",
  "../../super-admin/commission-slabs/page",
]);

console.log("Commission Slabs routes verified; no source patch required.");
