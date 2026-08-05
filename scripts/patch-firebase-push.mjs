import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();
const file = path.join(root, "app/api/market-orders/route.ts");
let source = fs.readFileSync(file, "utf8");

const importLine = 'import { sendPanelPush } from "../../firebase-push-server";\n';
if (!source.includes("sendPanelPush")) {
  source = importLine + source;
}

const marker = "    await db.batch(statements);\n";
const addition = `${marker}    await sendPanelPush(\n      {\n        title: "Sabka Delivery pe order aaya",\n        body: \`${'${customerName}'} ne ₹${'${total}'} ka ${'${payment}'} order place kiya\`,\n        url: "/super-admin",\n        tag: \`new-order-${'${orderCode}'}\`,\n      },\n      { storeId, includeRiders: true },\n    );\n`;
if (!source.includes('tag: `new-order-${orderCode}`')) {
  if (!source.includes(marker)) throw new Error("market-orders batch marker not found");
  source = source.replace(marker, addition);
}

fs.writeFileSync(file, source);
console.log("Firebase new-order push hook ready");
