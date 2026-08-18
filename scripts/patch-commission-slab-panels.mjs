import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();

function ensure(file, needles) {
  const target = path.join(root, file);
  const source = fs.readFileSync(target, "utf8");
  for (const needle of needles) {
    if (!source.includes(needle)) throw new Error(`Commission Slabs UI missing in ${file}`);
  }
}

// The panel sections are already committed in the source files. This build step
// must only verify them, not mutate source files or depend on formatting anchors.
ensure("app/super-admin/admin-console.tsx", [
  "Commission Slabs",
  "/super-admin/commission-slabs",
]);
ensure("app/owner-panel/owner-console.tsx", [
  "COMMISSION_SLABS",
  "/owner-panel/commission-slabs",
]);

console.log("Commission Slabs sections verified; no source patch required.");
