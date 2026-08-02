import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();

function patchFile(relativePath, transform) {
  const target = path.join(root, relativePath);
  const source = fs.readFileSync(target, "utf8");
  const next = transform(source);
  if (next === source) {
    throw new Error(`Runtime DB patch did not change ${relativePath}`);
  }
  fs.writeFileSync(target, next);
}

patchFile("db/market-store.ts", (source) => {
  const pattern = /async function initializeMarketTables\(\) \{[\s\S]*?\n\}\n\nlet marketDatabasePromise:[\s\S]*?\nexport async function ensureMarketTables\(\) \{[\s\S]*?\n\}/;
  const replacement = `async function getMarketDatabase() {
  const { env } = await import("cloudflare:workers");
  const db = env.DB;
  if (!db) throw new Error("Market database is unavailable");
  return db;
}

let marketDatabasePromise: ReturnType<typeof getMarketDatabase> | null = null;

export async function ensureMarketTables() {
  marketDatabasePromise ??= getMarketDatabase();
  try {
    return await marketDatabasePromise;
  } catch (error) {
    marketDatabasePromise = null;
    throw error;
  }
}`;

  if (!pattern.test(source)) {
    throw new Error("initializeMarketTables runtime block not found");
  }
  return source.replace(pattern, replacement);
});

patchFile("db/control-store.ts", (source) => {
  const pattern = /async function initializeControlTables\(\) \{[\s\S]*?\n\}\n\nlet controlDatabasePromise:[\s\S]*?\nexport async function ensureControlTables\(\) \{[\s\S]*?\n\}/;
  const replacement = `async function getControlDatabase() {
  return ensureMarketTables();
}

let controlDatabasePromise: ReturnType<typeof getControlDatabase> | null = null;

export async function ensureControlTables() {
  controlDatabasePromise ??= getControlDatabase();
  try {
    return await controlDatabasePromise;
  } catch (error) {
    controlDatabasePromise = null;
    throw error;
  }
}`;

  if (!pattern.test(source)) {
    throw new Error("initializeControlTables runtime block not found");
  }
  return source.replace(pattern, replacement);
});

console.log("Runtime schema initialization removed from normal Worker requests.");
