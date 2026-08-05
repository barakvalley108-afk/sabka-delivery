import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();
const target = path.join(root, "app", "super-admin", "admin-console.tsx");
let source = fs.readFileSync(target, "utf8");

if (!source.includes("const bootstrapped=useRef(false);")) {
  source = source.replace(
    ' const payloadSignature=useRef("");',
    ' const payloadSignature=useRef("");\n const bootstrapped=useRef(false);',
  );
}

source = source.replace(
  'fetch(`/api/admin/control?refresh=${Date.now()}`,{cache:"no-store",headers:{"Cache-Control":"no-cache"},signal:controller.signal})',
  'fetch(bootstrapped.current?`/api/admin/control?refresh=${Date.now()}`:`/api/admin/bootstrap?refresh=${Date.now()}`,{cache:"no-store",headers:{"Cache-Control":"no-cache"},signal:controller.signal})',
);

source = source.replace(
  'if(!response.ok){setError(result.error||"Panel load failed");return}const signature=JSON.stringify(result);',
  'if(!response.ok){setError(result.error||"Panel load failed");return}bootstrapped.current=true;const signature=JSON.stringify(result);',
);

if (!source.includes('/api/admin/bootstrap?refresh=')) {
  throw new Error("Admin bootstrap patch could not connect the lightweight endpoint.");
}

fs.writeFileSync(target, source);
console.log("Super Admin now opens from a lightweight bootstrap payload.");
