import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();

function patch(file, replacements) {
  const target = path.join(root, file);
  let source = fs.readFileSync(target, "utf8");
  for (const [from, to] of replacements) {
    if (source.includes(to)) continue;
    if (!source.includes(from)) throw new Error(`Commission slab panel patch anchor missing in ${file}`);
    source = source.replace(from, to);
  }
  fs.writeFileSync(target, source);
}

patch("app/super-admin/admin-console.tsx", [
  ['"Coupons"|"Website Editor"|"Panel Users"', '"Coupons"|"Commission Slabs"|"Website Editor"|"Panel Users"'],
  ['item==="Coupons"?"%":item==="Website Editor"?"✎":', 'item==="Coupons"?"%":item==="Commission Slabs"?"₹":item==="Website Editor"?"✎":'],
  ['{tab==="Coupons"&&<CouponManager coupons={data.promotions} send={send} busy={busy}/>} ', '{tab==="Coupons"&&<CouponManager coupons={data.promotions} send={send} busy={busy}/>}\n   {tab==="Commission Slabs"&&<iframe title="Commission Slab Editor" src="/super-admin/commission-slabs" style={{width:"100%",minHeight:"760px",border:0,borderRadius:16,background:"#fff"}}/>} '],
]);

patch("app/owner-panel/owner-console.tsx", [
  ['"HQ"|"SECURITY"|"OPERATIONS"', '"HQ"|"SECURITY"|"OPERATIONS"|"COMMISSION_SLABS"'],
  ['<button className={tab === "OPERATIONS" ? "active" : ""} onClick={() => setTab("OPERATIONS")}>⚡ Operations</button>', '<button className={tab === "OPERATIONS" ? "active" : ""} onClick={() => setTab("OPERATIONS")}>⚡ Operations</button>\n          <button className={tab === "COMMISSION_SLABS" ? "active" : ""} onClick={() => setTab("COMMISSION_SLABS")}>₹ Commission Slabs</button>'],
  ['{tab === "SECURITY" && (', '{tab === "COMMISSION_SLABS" && <iframe title="Commission Slab Editor" src="/owner-panel/commission-slabs" style={{width:"100%",minHeight:"760px",border:0,borderRadius:16,background:"#fff"}} />}\n\n        {tab === "SECURITY" && ('],
]);

console.log("Commission Slabs sections added to Super Admin and Owner panels.");
