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
  next = next.replace(
    '<button onClick={()=>void load()}>↻ Retry</button>',
    '<button onClick={()=>{setError("");payloadSignature.current="";loading.current=false;void load()}}>↻ Retry</button>',
  );
  next = next.replace(
    'if(!data)return <main className="panel-loading"><img src="/images/sabka-delivery-logo.png" alt=""/><h1>Control room load ho raha hai…</h1><p>{error}</p></main>;',
    'if(!data)return <main className="panel-loading"><img src="/images/sabka-delivery-logo.png" alt=""/><h1>Control room load ho raha hai…</h1><p>{error}</p>{error?<button onClick={()=>{setError("");payloadSignature.current="";loading.current=false;void load()}}>Retry now</button>:null}</main>;',
  );
  return next;
});

console.log("Admin API payload reduced and Retry repaired.");
