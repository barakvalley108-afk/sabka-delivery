import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();
const target = path.join(root, "app", "components", "use-live-refresh.ts");
let source = fs.readFileSync(target, "utf8");

source = source.replace(
  "  const effectiveInterval = intervalMs;",
  "  // Protect Cloudflare Worker/D1 from aggressive polling across many open tabs.\n  // Urgent updates still arrive quickly, while normal refreshes cannot run faster than 10s.\n  const effectiveInterval = Math.max(intervalMs, 10000);",
);

if (!source.includes("Math.max(intervalMs, 10000)")) {
  throw new Error("Worker load patch was not applied to use-live-refresh.ts");
}

fs.writeFileSync(target, source);
console.log("Worker polling load reduced.");
