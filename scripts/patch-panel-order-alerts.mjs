import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();

function patchFile(relativePath, kind) {
  const target = path.join(root, relativePath);
  let source = fs.readFileSync(target, "utf8");

  if (!source.includes('from "../panel-alert-sounds"')) {
    const importLine = 'import { NEW_ORDER_SOUND, ORDER_CANCELLED_SOUND, NEW_ORDER_FALLBACK_SOUND, ORDER_CANCELLED_FALLBACK_SOUND } from "../panel-alert-sounds";\n';
    source = source.replace('"use client";\n\n', `"use client";\n\n${importLine}`);
  }

  const knownRefNeedle = kind === "admin"
    ? ' const knownOrders=useRef<Set<string>|null>(null);'
    : '  const known = useRef<Set<string> | null>(null);';
  const knownRefReplacement = kind === "admin"
    ? ' const knownOrders=useRef<Set<string>|null>(null);\n const knownStatuses=useRef<Map<string,string>|null>(null);'
    : '  const known = useRef<Set<string> | null>(null);\n  const knownStatuses = useRef<Map<string, string> | null>(null);';
  source = source.replace(knownRefNeedle, knownRefReplacement);

  const beepPattern = kind === "admin"
    ? / const beep=useCallback\(\(\)=>\{try\{[\s\S]*?\},\[\]\);/
    : /  const beep = useCallback\(\(\) => \{[\s\S]*?\n  \}, \[\]\);/;
  const soundFunction = kind === "admin"
    ? ` const playPanelSound=useCallback((primary:string,fallback:string)=>{try{const audio=new Audio(primary);audio.volume=.9;audio.currentTime=0;const retry=()=>{const second=new Audio(fallback);second.volume=.8;void second.play().catch(()=>{});};audio.addEventListener("error",retry,{once:true});void audio.play().catch(retry);}catch{}},[]);`
    : `  const playPanelSound = useCallback((primary: string, fallback: string) => {\n    try {\n      const audio = new Audio(primary);\n      audio.volume = 0.9;\n      audio.currentTime = 0;\n      const retry = () => {\n        const second = new Audio(fallback);\n        second.volume = 0.8;\n        void second.play().catch(() => {});\n      };\n      audio.addEventListener("error", retry, { once: true });\n      void audio.play().catch(retry);\n    } catch {}\n  }, []);`;
  source = source.replace(beepPattern, soundFunction);

  if (kind === "admin") {
    const oldBlock = 'const incoming=(result.orders as Order[]).filter(order=>!knownOrders.current?.has(order.orderCode)&&order.status==="ACCEPTED");if(knownOrders.current&&incoming.length&&alerts){beep();void showBackgroundNotification({title:"SABKA DELIVERY · New order",body:`${incoming[0].storeName} · ${money(incoming[0].total)} · ${incoming[0].orderCode}`,url:"/super-admin",tag:`admin-order-${incoming[0].orderCode}`});}knownOrders.current=new Set((result.orders as Order[]).map(order=>order.orderCode));setData(result);';
    const newBlock = 'const orders=result.orders as Order[];const incoming=orders.filter(order=>!knownOrders.current?.has(order.orderCode)&&order.status==="ACCEPTED");const cancelled=orders.filter(order=>knownStatuses.current?.get(order.orderCode)!=="CANCELLED"&&order.status==="CANCELLED");const waitingForAction=orders.some(order=>order.status==="ACCEPTED");if(knownOrders.current&&alerts){if(incoming.length){void showBackgroundNotification({title:"SABKA DELIVERY · New order",body:`${incoming[0].storeName} · ${money(incoming[0].total)} · ${incoming[0].orderCode}`,url:"/super-admin",tag:`admin-order-${incoming[0].orderCode}`});}if(waitingForAction){playPanelSound(NEW_ORDER_SOUND,NEW_ORDER_FALLBACK_SOUND);}if(cancelled.length){playPanelSound(ORDER_CANCELLED_SOUND,ORDER_CANCELLED_FALLBACK_SOUND);void showBackgroundNotification({title:"SABKA DELIVERY · Order cancelled",body:`${cancelled[0].storeName} · ${cancelled[0].orderCode}`,url:"/super-admin",tag:`admin-cancel-${cancelled[0].orderCode}`});}}knownOrders.current=new Set(orders.map(order=>order.orderCode));knownStatuses.current=new Map(orders.map(order=>[order.orderCode,order.status]));setData(result);';
    source = source.replace(oldBlock, newBlock);
    source = source.replace('[alerts,beep])', '[alerts,playPanelSound])');
    source = source.replace('setAlerts(true);beep();', 'setAlerts(true);playPanelSound(NEW_ORDER_FALLBACK_SOUND,NEW_ORDER_FALLBACK_SOUND);');
  } else {
    const oldFresh = `    const fresh = (result.orders as Order[]).filter(\n      (order) => !known.current?.has(order.orderCode) && order.status === "ACCEPTED",\n    );\n    if (known.current && fresh.length && alerts) {\n      beep();\n      void showBackgroundNotification({\n        title: \`New \${panelName.toLowerCase()} order\`,\n        body: \`\${fresh[0].orderCode} · \${money(fresh[0].total)}\`,\n        url: "/partner-panel",\n        tag: \`partner-order-\${fresh[0].orderCode}\`,\n      });\n    }\n    known.current = new Set(\n      (result.orders as Order[]).map((order) => order.orderCode),\n    );`;
    const newFresh = `    const orders = result.orders as Order[];\n    const fresh = orders.filter(\n      (order) => !known.current?.has(order.orderCode) && order.status === "ACCEPTED",\n    );\n    const cancelled = orders.filter(\n      (order) =>\n        knownStatuses.current?.get(order.orderCode) !== "CANCELLED" &&\n        order.status === "CANCELLED",\n    );\n    const waitingForAction = orders.some((order) => order.status === "ACCEPTED");\n    if (known.current && alerts) {\n      if (fresh.length) {\n        void showBackgroundNotification({\n          title: \`New \${panelName.toLowerCase()} order\`,\n          body: \`\${fresh[0].orderCode} · \${money(fresh[0].total)}\`,\n          url: panelPath,\n          tag: \`partner-order-\${fresh[0].orderCode}\`,\n        });\n      }\n      if (waitingForAction) {\n        playPanelSound(NEW_ORDER_SOUND, NEW_ORDER_FALLBACK_SOUND);\n      }\n      if (cancelled.length) {\n        playPanelSound(ORDER_CANCELLED_SOUND, ORDER_CANCELLED_FALLBACK_SOUND);\n        void showBackgroundNotification({\n          title: \`\${panelName} order cancelled\`,\n          body: \`Customer cancelled \${cancelled[0].orderCode}\`,\n          url: panelPath,\n          tag: \`partner-cancel-\${cancelled[0].orderCode}\`,\n        });\n      }\n    }\n    known.current = new Set(orders.map((order) => order.orderCode));\n    knownStatuses.current = new Map(\n      orders.map((order) => [order.orderCode, order.status]),\n    );`;
    source = source.replace(oldFresh, newFresh);
    source = source.replace('[alerts, beep, panelName])', '[alerts, panelName, panelPath, playPanelSound])');
    source = source.replace('      beep();', '      playPanelSound(NEW_ORDER_FALLBACK_SOUND, NEW_ORDER_FALLBACK_SOUND);');
  }

  fs.writeFileSync(target, source);
}

patchFile("app/super-admin/admin-console.tsx", "admin");
patchFile("app/partner-panel/partner-console.tsx", "partner");
console.log("Panel order alarm repeats until the order is confirmed or cancelled.");
