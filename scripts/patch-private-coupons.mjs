import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();
const target = path.join(root, "app", "page.tsx");
let source = fs.readFileSync(target, "utf8");

// Manual/private coupon codes must still reach the server at checkout, but
// entering a code must NOT make the homepage show it as already applied.
// Only coupons present in the public offer list can affect the preview total.
source = source.replace(
  '  const activeCoupon = couponLooksValid ? couponCode : "";',
  '  const activeCoupon = selectedCoupon ? selectedCoupon.code : "";',
);
source = source.replace(
  '  const couponNeedsFix = couponCode.length > 0 && !couponLooksValid;',
  '  const couponNeedsFix = couponCode.length > 0 && !couponLooksValid;',
);

// A private/hidden code is intentionally absent from the public coupon list.
// Do not display a fake "applied ₹0" message. The real coupon is validated by
// /api/market-orders when the customer places the order.
source = source.replace(
  '    if (!offer) {\n      setMessage(`${code} checkout par verify hoga`);\n      window.setTimeout(() => setMessage(""), 2200);\n      return;\n    }',
  '    if (!offer) {\n      setMessage(`${code} checkout par verify hoga`);\n      window.setTimeout(() => setMessage(""), 2200);\n      return;\n    }',
);

if (!source.includes('const activeCoupon = selectedCoupon ? selectedCoupon.code : "";')) {
  throw new Error("Private coupon patch could not restore non-auto-applied coupon preview safely.");
}
if (!source.includes('const couponNeedsFix = couponCode.length > 0 && !couponLooksValid;')) {
  throw new Error("Coupon UI validation patch could not be applied safely.");
}

fs.writeFileSync(target, source);
console.log("Private coupon codes no longer auto-apply; valid codes remain available for server-side checkout validation.");