import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();

function update(relativePath, transform) {
  const target = path.join(root, relativePath);
  const source = fs.readFileSync(target, "utf8");
  const next = transform(source);
  if (next !== source) fs.writeFileSync(target, next);
}

// Section-specific delivery charges (for example Grocery ₹40) must take
// precedence over the global fallback. The previous build patch accidentally
// reversed this order, so the global ₹20 value could overwrite Grocery.
update("app/api/market/route.ts", (source) => {
  const globalFirst = `              coalesce(
                (
                  SELECT cast(value as integer)
                  FROM market_settings
                  WHERE key='delivery_charge'
                ),
                (
                  SELECT cast(value as integer)
                  FROM market_settings
                  WHERE key='delivery_charge_'||market_sections.key
                ),
                20
              ) deliveryCharge`;
  const sectionFirst = `              coalesce(
                (
                  SELECT cast(value as integer)
                  FROM market_settings
                  WHERE key='delivery_charge_'||market_sections.key
                ),
                (
                  SELECT cast(value as integer)
                  FROM market_settings
                  WHERE key='delivery_charge'
                ),
                20
              ) deliveryCharge`;
  return source.includes(globalFirst) ? source.replace(globalFirst, sectionFirst) : source;
});

update("app/api/market-orders/route.ts", (source) =>
  source.replace(
    "config.delivery_charge ?? config[`delivery_charge_${store.vertical}`]",
    "config[`delivery_charge_${store.vertical}`] ?? config.delivery_charge",
  ),
);

// Keep the Super Admin's rider earnings in sync with the delivery fee stored
// on each delivered assignment instead of the old hard-coded ₹20 amount.
update("app/api/admin/control/route.ts", (source) => {
  let next = source.replace(
    "coalesce((SELECT sum(20+coalesce(a.tip,0))",
    "coalesce((SELECT sum(coalesce(a.delivery_fee,20)+coalesce(a.tip,0))",
  );

  const oldAssign = `    await db
      .prepare(
        \`INSERT INTO market_delivery_assignments (order_code,rider_id,status,delivery_fee,delivery_otp)
         VALUES (?,?,'ASSIGNED',20,?)
         ON CONFLICT(order_code) DO UPDATE SET rider_id=excluded.rider_id,status='ASSIGNED',delivery_fee=20,delivery_otp=excluded.delivery_otp\`,
      )
      .bind(orderCode, Number(body.riderId), otp)
      .run();`;
  const newAssign = `    const order = await db
      .prepare("SELECT delivery_fee deliveryFee,status FROM market_orders WHERE order_code=?")
      .bind(orderCode)
      .first<{ deliveryFee: number; status: string }>();
    if (!order)
      return Response.json({ error: "Order nahi mila" }, { status: 404 });
    if (!["CONFIRMED","PREPARING","PACKING","READY_FOR_PICKUP"].includes(order.status))
      return Response.json({ error: "Order rider assignment ke liye ready nahi hai" }, { status: 409 });
    const deliveryFee = Number.isFinite(Number(order.deliveryFee)) && Number(order.deliveryFee) >= 0
      ? Number(order.deliveryFee)
      : 20;
    await db
      .prepare(
        \`INSERT INTO market_delivery_assignments (order_code,rider_id,status,delivery_fee,delivery_otp)
         VALUES (?,?,'ASSIGNED',?,?)
         ON CONFLICT(order_code) DO UPDATE SET rider_id=excluded.rider_id,status='ASSIGNED',delivery_fee=excluded.delivery_fee,delivery_otp=excluded.delivery_otp\`,
      )
      .bind(orderCode, Number(body.riderId), deliveryFee, otp)
      .run();`;
  if (next.includes(oldAssign)) next = next.replace(oldAssign, newAssign);
  return next;
});

// Invalidate the old client catalog cache after this fix so a previously
// cached ₹20 section value cannot survive the deployment.
update("app/page.tsx", (source) =>
  source.replace(
    'const CATALOG_CACHE_KEY = "sabka-delivery-market-catalog-v1";',
    'const CATALOG_CACHE_KEY = "sabka-delivery-market-catalog-v2";',
  ),
);

// Keep the mobile UI exactly as-is, but make the delivery fee/minimum-order
// state update when the same catalog is reused after switching Food/Grocery.
// Use a unique local name so this build-time patch cannot collide with the
// page's existing activeSection declaration.
update("app/page.tsx", (source) => {
  const staleBlock = `      const signature = JSON.stringify(data);
      if (signature === marketSignature.current) return;
      marketSignature.current = signature;
      setStores(data.stores || []);`;
  const fixedBlock = `      const signature = JSON.stringify(data);
      const sectionConfig = (data.sections || []).find(
        (section: { key: string; deliveryCharge?: number; minOrder?: number }) =>
          section.key === mode,
      );
      if (signature === marketSignature.current) {
        setDeliveryFee(Number(sectionConfig?.deliveryCharge ?? data.deliveryFee ?? 20));
        setMinimumOrder(Number(sectionConfig?.minOrder || 0));
        return;
      }
      marketSignature.current = signature;
      setStores(data.stores || []);`;
  if (!source.includes(staleBlock)) return source;
  return source.replace(staleBlock, fixedBlock);
});

console.log("Section-specific delivery charges now override the global fallback, stale client fee data is invalidated, and admin rider fees use the configured order fee.");
