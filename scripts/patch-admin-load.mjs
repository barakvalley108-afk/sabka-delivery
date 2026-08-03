import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();

function patch(relativePath, transform) {
  const target = path.join(root, relativePath);
  const source = fs.readFileSync(target, "utf8");
  const next = transform(source);
  if (next === source) throw new Error(`Admin load patch did not change ${relativePath}`);
  fs.writeFileSync(target, next);
}

patch("app/api/admin/control/route.ts", (source) => {
  let next = source;
  next = next.replace(
    "ORDER BY o.created_at DESC LIMIT 200`,",
    "ORDER BY o.created_at DESC LIMIT 80`,",
  );
  next = next.replace(
    '"SELECT order_code orderCode,item_name itemName,variant_label variantLabel,quantity,unit_price unitPrice FROM market_order_items",',
    '`SELECT oi.order_code orderCode,oi.item_name itemName,oi.variant_label variantLabel,oi.quantity,oi.unit_price unitPrice\n       FROM market_order_items oi\n       JOIN (SELECT order_code FROM market_orders ORDER BY created_at DESC LIMIT 80) recent\n         ON recent.order_code=oi.order_code`,',
  );
  next = next.replace(
    "JOIN market_variants v ON v.item_id=i.id ORDER BY i.id DESC`,",
    "JOIN market_variants v ON v.item_id=i.id ORDER BY i.id DESC LIMIT 600`,",
  );
  next = next.replace(
    "FROM market_payouts p JOIN market_riders r ON r.id=p.payee_id\n       WHERE p.payee_type='RIDER' ORDER BY p.created_at DESC LIMIT 200`,",
    "FROM market_payouts p JOIN market_riders r ON r.id=p.payee_id\n       WHERE p.payee_type='RIDER' ORDER BY p.created_at DESC LIMIT 60`,",
  );
  return next;
});

patch("app/super-admin/admin-console.tsx", (source) => {
  let next = source;

  // Force every manual retry to bypass browser/CDN caches.
  next = next.replace(
    'fetch("/api/admin/control",{cache:"no-store",signal:controller.signal})',
    'fetch(`/api/admin/control?refresh=${Date.now()}`,{cache:"no-store",headers:{"Cache-Control":"no-cache"},signal:controller.signal})',
  );

  // Add a visible retry state and a real retry handler.
  next = next.replace(
    'const [data,setData]=useState<Data|null>(null),[tab,setTab]=useState<Tab>("Dashboard"),[error,setError]=useState(""),[success,setSuccess]=useState(""),[busy,setBusy]=useState(false),[alerts,setAlerts]=useState(false);',
    'const [data,setData]=useState<Data|null>(null),[tab,setTab]=useState<Tab>("Dashboard"),[error,setError]=useState(""),[success,setSuccess]=useState(""),[busy,setBusy]=useState(false),[alerts,setAlerts]=useState(false),[retrying,setRetrying]=useState(false);',
  );

  const loadEnd = 'useLiveRefresh(load,5000,{runWhenHidden:alerts});';
  const retryFunction = 'async function retryNow(){if(retrying)return;setRetrying(true);setError("");payloadSignature.current="";mutating.current=false;loading.current=false;try{await load()}finally{setRetrying(false)}}\n ';
  if (!next.includes('async function retryNow()')) {
    next = next.replace(loadEnd, `${loadEnd}\n ${retryFunction}`);
  }

  // Replace any existing top Retry implementation, regardless of old patch shape.
  next = next.replace(
    /<button onClick=\{\(\)=>\{[^}]*payloadSignature\.current[^}]*\}\}>↻ Retry<\/button>|<button onClick=\{\(\)=>void load\(\)\}>↻ Retry<\/button>/,
    '<button disabled={retrying} onClick={()=>void retryNow()}>{retrying?"Refreshing…":"↻ Retry"}</button>',
  );

  // Make the empty/loading screen retry use the same handler.
  next = next.replace(
    /if\(!data\)return <main className="panel-loading">[\s\S]*?<\/main>;/,
    'if(!data)return <main className="panel-loading"><img src="/images/sabka-delivery-logo.png" alt=""/><h1>Control room load ho raha hai…</h1><p>{error}</p>{error?<button disabled={retrying} onClick={()=>void retryNow()}>{retrying?"Refreshing…":"Retry now"}</button>:null}</main>;',
  );

  return next;
});

console.log("Admin API payload reduced and Retry now forces a fresh request.");
