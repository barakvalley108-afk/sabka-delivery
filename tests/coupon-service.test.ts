import assert from "node:assert/strict";
import test from "node:test";

import { normalizeCouponCode, validateCoupon } from "../db/coupon-service";

type CouponFixture = {
  code: string;
  title: string;
  discountType: "FLAT" | "PERCENT";
  discountValue: number;
  minOrder: number;
  isActive: number;
  uses: number;
  maxDiscount: number;
  expiresAt: string | null;
  userMobile: string | null;
  storeId: number | null;
  firstOrderOnly: number;
  autoPauseAfterUse: number;
  usageLimit: number;
};

const activeCoupon: CouponFixture = {
  code: "PUBLIC50",
  title: "₹50 off",
  discountType: "FLAT",
  discountValue: 50,
  minOrder: 100,
  isActive: 1,
  uses: 0,
  maxDiscount: 50,
  expiresAt: null,
  userMobile: null,
  storeId: null,
  firstOrderOnly: 0,
  autoPauseAfterUse: 0,
  usageLimit: 0,
};

function couponDatabase(coupons: CouponFixture[]) {
  return {
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          return {
            async first() {
              if (sql.includes("FROM market_promotions p")) {
                const code = String(values[0]);
                return (
                  coupons.find(
                    (coupon) => coupon.code.toUpperCase() === code.toUpperCase(),
                  ) || null
                );
              }
              return null;
            },
          };
        },
      };
    },
  };
}

async function check(
  rawCode: string,
  coupons: CouponFixture[],
  subtotal = 500,
) {
  return validateCoupon({
    db: couponDatabase(coupons) as never,
    rawCode,
    mobile: "8011767897",
    storeId: 1,
    subtotal,
  });
}

test("coupon codes are trimmed and compared case-insensitively", () => {
  assert.equal(normalizeCouponCode("  public50 "), "PUBLIC50");
});

test("SABKE90 is rejected when it does not exist", async () => {
  assert.deepEqual(await check("SABKE90", []), {
    ok: false,
    error: "Invalid coupon",
    status: 400,
    reason: "INVALID",
  });
});

test("random coupon is rejected", async () => {
  const result = await check("TEST999", []);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "Invalid coupon");
});

test("active public coupon applies with backend-calculated discount", async () => {
  const result = await check(" public50 ", [activeCoupon], 500);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.discount, 50);
});

test("active hidden coupon also applies when it exists in the database", async () => {
  const hidden = { ...activeCoupon, code: "HIDDEN25", discountValue: 25 };
  const result = await check("hidden25", [hidden], 500);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.discount, 25);
});

test("inactive coupon is rejected", async () => {
  const result = await check("PUBLIC50", [
    { ...activeCoupon, isActive: 0 },
  ]);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "Coupon is inactive");
});

test("expired coupon is rejected", async () => {
  const result = await check("PUBLIC50", [
    { ...activeCoupon, expiresAt: "2020-01-01" },
  ]);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "Coupon has expired");
});

test("minimum-order failure is enforced by the backend", async () => {
  const result = await check("PUBLIC50", [activeCoupon], 50);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "MINIMUM_ORDER");
});
