import { ensureControlTables } from "./control-store";

type MarketDatabase = Awaited<ReturnType<typeof ensureControlTables>>;

type CouponRow = {
  code: string;
  title: string;
  discountType: string;
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

export type CouponValidation =
  | {
      ok: true;
      coupon: CouponRow;
      discount: number;
    }
  | {
      ok: false;
      error: string;
      status: number;
      reason:
        | "INVALID"
        | "INACTIVE"
        | "EXPIRED"
        | "RESTRICTED"
        | "MINIMUM_ORDER"
        | "USAGE_LIMIT"
        | "ALREADY_USED"
        | "FIRST_ORDER_ONLY";
    };

export const normalizeCouponCode = (value: unknown) =>
  String(value || "").trim().toUpperCase();

const expiredInIndia = (expiresAt: string | null) => {
  if (!expiresAt) return false;
  const endOfDay = Date.parse(`${expiresAt}T23:59:59.999+05:30`);
  return Number.isFinite(endOfDay) && Date.now() > endOfDay;
};

export async function validateCoupon({
  db,
  rawCode,
  mobile,
  storeId,
  subtotal,
}: {
  db: MarketDatabase;
  rawCode: unknown;
  mobile: string;
  storeId: number;
  subtotal: number;
}): Promise<CouponValidation> {
  const code = normalizeCouponCode(rawCode);
  if (!/^[A-Z0-9]{4,20}$/.test(code)) {
    return { ok: false, error: "Invalid coupon", status: 400, reason: "INVALID" };
  }

  const coupon = await db
    .prepare(
      `SELECT p.code,p.title,p.discount_type discountType,
              p.discount_value discountValue,p.min_order minOrder,
              p.is_active isActive,p.uses,
              coalesce(r.max_discount,0) maxDiscount,
              r.expires_at expiresAt,r.user_mobile userMobile,
              r.store_id storeId,coalesce(r.first_order_only,0) firstOrderOnly,
              coalesce(r.auto_pause_after_use,0) autoPauseAfterUse,
              coalesce(r.usage_limit,0) usageLimit
       FROM market_promotions p
       LEFT JOIN market_promotion_rules r ON r.code=p.code
       WHERE upper(p.code)=?`,
    )
    .bind(code)
    .first<CouponRow>();

  if (!coupon) {
    return { ok: false, error: "Invalid coupon", status: 400, reason: "INVALID" };
  }
  if (!coupon.isActive) {
    return {
      ok: false,
      error: "Coupon is inactive",
      status: 409,
      reason: "INACTIVE",
    };
  }
  if (expiredInIndia(coupon.expiresAt)) {
    return {
      ok: false,
      error: "Coupon has expired",
      status: 409,
      reason: "EXPIRED",
    };
  }
  if (
    (coupon.userMobile && coupon.userMobile !== mobile) ||
    (coupon.storeId && coupon.storeId !== storeId)
  ) {
    return {
      ok: false,
      error: "Coupon is order ke liye valid nahi hai",
      status: 409,
      reason: "RESTRICTED",
    };
  }
  if (subtotal < coupon.minOrder) {
    return {
      ok: false,
      error: `Coupon ke liye minimum order ₹${coupon.minOrder} hai`,
      status: 400,
      reason: "MINIMUM_ORDER",
    };
  }
  if (coupon.usageLimit > 0 && coupon.uses >= coupon.usageLimit) {
    return {
      ok: false,
      error: "Coupon usage limit reached",
      status: 409,
      reason: "USAGE_LIMIT",
    };
  }

  const claimed = await db
    .prepare(
      "SELECT id FROM market_coupon_claims WHERE mobile=? AND upper(coupon_code)=?",
    )
    .bind(mobile, code)
    .first();
  if (claimed) {
    return {
      ok: false,
      error: "Ye coupon is mobile number par pehle use ho chuka hai",
      status: 409,
      reason: "ALREADY_USED",
    };
  }

  if (coupon.firstOrderOnly) {
    const oldOrder = await db
      .prepare(
        "SELECT order_code FROM market_orders WHERE mobile=? AND status!='CANCELLED' LIMIT 1",
      )
      .bind(mobile)
      .first();
    if (oldOrder) {
      return {
        ok: false,
        error: "Ye offer sirf first order ke liye hai",
        status: 409,
        reason: "FIRST_ORDER_ONLY",
      };
    }
  }

  let discount =
    coupon.discountType === "PERCENT"
      ? Math.floor((subtotal * coupon.discountValue) / 100)
      : coupon.discountValue;
  if (coupon.maxDiscount > 0) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  discount = Math.max(0, Math.min(subtotal, discount));

  return { ok: true, coupon, discount };
}
