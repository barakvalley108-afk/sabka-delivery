import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);
const {
  BufferedLog,
  ConsoleLog,
  TwaGenerator,
  TwaManifest,
  fetchUtils,
} = require("@bubblewrap/core");

const root = path.resolve(import.meta.dirname, "..");
const iconPath = path.join(root, "public/images/sabka-delivery-logo.png");
const webManifestPath = path.join(root, "public/manifest.webmanifest");

const responseFromFile = async (filePath, contentType) => {
  const data = await readFile(filePath);
  return {
    status: 200,
    headers: { get: (name) => name.toLowerCase() === "content-type" ? contentType : null },
    arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
    text: async () => data.toString("utf8"),
  };
};

const originalFetch = fetchUtils.fetch.bind(fetchUtils);
fetchUtils.fetch = async (input) => {
  const url = input.toString();
  if (url.endsWith("/images/sabka-delivery-logo.png")) {
    return responseFromFile(iconPath, "image/png");
  }
  if (url.endsWith("/manifest.webmanifest")) {
    return responseFromFile(webManifestPath, "application/manifest+json");
  }
  return originalFetch(input);
};

for (const appName of ["customer", "partner"]) {
  const target = path.join(root, "mobile", appName);
  const manifestPath = path.join(target, "twa-manifest.json");
  const manifest = await TwaManifest.fromFile(manifestPath);
  const generator = new TwaGenerator();
  const log = new BufferedLog(new ConsoleLog(`mobile:${appName}`));

  await generator.removeTwaProject(target);
  await generator.createTwaProject(target, manifest, log);
  log.flush();
  process.stdout.write(`Generated mobile/${appName}\n`);
}
