import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { Miniflare } from "miniflare";

import {
  confirmOnlinePayment,
  readPaymentOrderState,
} from "../db/payment-orders";

let runtime: Miniflare;
let db: D1Database;

async function seedPendingOrder(
  orderCode: string,
  mobile: string,
  createdAt?: string,
) {
  const timestamp =
    createdAt || new Date().toISOString().replace("T", " ").slice(0, 19);
  await db.batch([
    db
      .prepare(
        `INSERT INTO market_orders
         (order_code,mobile,customer_name,store_id,address,area,payment_method,
          subtotal,delivery_fee,total,status,created_at)
         VALUES (?,?,?,9001,'Test address, Lala Bazar','Lala Bazar','UPI',
                 150,20,170,'PAYMENT_PENDING',?)`,
      )
      .bind(orderCode, mobile, "Payment Test", timestamp),
    db
      .prepare(
        `INSERT INTO market_order_items
         (order_code,variant_id,item_name,variant_label,unit_price,quantity)
         VALUES (?,9001,'Runtime Test Meal','1 plate',150,1)`,
      )
      .bind(orderCode),
    db
      .prepare(
        `INSERT INTO market_transactions
         (order_code,type,method,amount,status,reference)
         VALUES (?,'PAYMENT','UPI',170,'PENDING','')`,
      )
      .bind(orderCode),
  ]);
}

before(async () => {
  runtime = new Miniflare({
    modules: true,
    script: "export default { fetch() { return new Response('ok') } }",
    d1Databases: { DB: "payment-orders-test" },
  });
  db = await runtime.getD1Database("DB");
  const migration = readFileSync(
    "migrations/runtime/0001_schema.sql",
    "utf8",
  ).replace(/^--.*$/gm, "");
  const statements = migration
    .split(/\n\s*\n/)
    .map((statement) => statement.trim())
    .filter(Boolean);
  await db.batch(statements.map((statement) => db.prepare(statement)));
  await db.batch([
    db.prepare(
      `INSERT INTO market_stores
       (id,name,type,description,address,latitude,longitude,eta,rating,image,is_open)
       VALUES (9001,'Runtime Test Kitchen','FOOD','','Lala Bazar',24.553,92.6,
               '25-35 min',4.5,'',1)`,
    ),
    db.prepare(
      `INSERT INTO market_items
       (id,store_id,name,description,category,subcategory,image,emoji,food_type,is_active)
       VALUES (9001,9001,'Runtime Test Meal','','Main Course','','','','VEG',1)`,
    ),
    db.prepare(
      `INSERT INTO market_variants
       (id,item_id,label,unit,unit_value,price,discount_price,discount_percent,
        stock_quantity,is_active)
       VALUES (9001,9001,'1 plate','PIECE',1,150,150,0,9,1)`,
    ),
  ]);
});

after(async () => {
  await runtime.dispose();
});

test("incomplete online payment stays pending and cannot show success", async () => {
  await seedPendingOrder("PAY-PENDING-1", "8011767801");
  const state = await readPaymentOrderState(
    db,
    "PAY-PENDING-1",
    "8011767801",
  );
  assert.equal(state?.status, "PAYMENT_PENDING");
  assert.equal(state?.paymentStatus, "PENDING");
  assert.equal(state?.confirmed, false);
});

test("verified online payment becomes PAID and PLACED", async () => {
  await seedPendingOrder("PAY-PAID-1", "8011767802");
  const state = await confirmOnlinePayment(
    db,
    "PAY-PAID-1",
    "TEST VERIFIED",
  );
  assert.equal(state?.status, "PLACED");
  assert.equal(state?.paymentStatus, "PAID");
  assert.equal(state?.confirmed, true);
  const notification = await db
    .prepare(
      "SELECT count(*) count FROM market_admin_notifications WHERE order_code=? AND type='ORDER'",
    )
    .bind("PAY-PAID-1")
    .first<{ count: number }>();
  assert.equal(notification?.count, 1);
});

test("expired payment is cancelled and reserved stock is restored", async () => {
  await seedPendingOrder("PAY-EXPIRED-1", "8011767803", "2000-01-01 00:00:00");
  await db.batch([
    db
      .prepare(
        `INSERT INTO market_promotions
         (code,title,discount_type,discount_value,min_order,is_active,uses,sort_order)
         VALUES ('EXPIRE10','Test','FLAT',10,0,1,1,0)`,
      ),
    db
      .prepare(
        "INSERT INTO market_coupon_claims (mobile,coupon_code,order_code,discount) VALUES ('8011767803','EXPIRE10','PAY-EXPIRED-1',10)",
      ),
  ]);

  const state = await readPaymentOrderState(
    db,
    "PAY-EXPIRED-1",
    "8011767803",
  );
  assert.equal(state?.status, "CANCELLED");
  assert.equal(state?.paymentStatus, "CANCELLED");
  assert.equal(state?.confirmed, false);
  const [variant, promotion, claim] = await db.batch([
    db.prepare("SELECT stock_quantity stock FROM market_variants WHERE id=9001"),
    db.prepare("SELECT uses FROM market_promotions WHERE code='EXPIRE10'"),
    db.prepare(
      "SELECT count(*) count FROM market_coupon_claims WHERE order_code='PAY-EXPIRED-1'",
    ),
  ]);
  assert.equal((variant.results[0] as { stock: number }).stock, 10);
  assert.equal((promotion.results[0] as { uses: number }).uses, 0);
  assert.equal((claim.results[0] as { count: number }).count, 0);
});
