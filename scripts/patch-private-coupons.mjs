import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();
const target = path.join(root, "app", "page.tsx");
let source = fs.readFileSync(target, "utf8");

// Manual coupon codes may be private/hidden from the public promotion list.
// The server is the source of truth, so a syntactically valid code must reach
// /api/market-orders instead of being rejected by the homepage UI first.
source = source.replace(
  '  const activeCoupon = couponEligible ? selectedCoupon.code : "";',
  '  const activeCoupon = couponLooksValid ? couponCode : "";',
);
source = source.replace(
  '  const couponNeedsFix = couponCode.length > 0 && !couponEligible;',
  '  const couponNeedsFix = couponCode.length > 0 && !couponLooksValid;',
);

// Do not reject a syntactically valid manual code merely because it is not in
// the public coupon list. Private/targeted coupons are intentionally omitted
// from /api/market promotions but are validated securely by the checkout API.
source = source.replace(
  '    if (!offer) {\n      setMessage("Invalid coupon code");\n      window.setTimeout(() => setMessage(""), 2200);\n      return;\n    }',
  '    if (!offer) {\n      setMessage(`${code} checkout par verify hoga`);\n      window.setTimeout(() => setMessage(""), 2200);\n      return;\n    }',
);

if (!source.includes('const activeCoupon = couponLooksValid ? couponCode : "";')) {
  throw new Error("Private coupon validation patch could not be applied safely.");
}
if (!source.includes('const couponNeedsFix = couponCode.length > 0 && !couponLooksValid;')) {
  throw new Error("Coupon UI validation patch could not be applied safely.");
}

fs.writeFileSync(target, source);
console.log("Manual coupon codes now reach server-side validation, including private/hidden coupons.");
