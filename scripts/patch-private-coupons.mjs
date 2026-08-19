import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();
const target = path.join(root, "app", "page.tsx");
let source = fs.readFileSync(target, "utf8");

// Manual/private coupon codes must reach the server at checkout, but entering
// a code must never make the homepage show it as already applied. Public
// coupons can still drive the client-side preview total.
source = source.replace(
  /const\s+activeCoupon\s*=\s*couponLooksValid\s*\?\s*couponCode\s*:\s*[\"']{2}\s*;/,
  'const activeCoupon = selectedCoupon ? selectedCoupon.code : "";',
);

// Older builds may still contain the original public-list gate. Keep this
// patch safe and idempotent: only change the expression when it is present.
source = source.replace(
  /const\s+couponNeedsFix\s*=\s*couponCode\.length\s*>\s*0\s*&&\s*!couponEligible\s*;/,
  'const couponNeedsFix = couponCode.length > 0 && !couponLooksValid;',
);

// A private/hidden code is intentionally absent from the public coupon list.
// Do not display a fake "applied ₹0" message. The real coupon is validated by
// /api/market-orders when the customer places the order.
source = source.replace(
  /if\s*\(!offer\)\s*\{\s*setMessage\(\s*`\$\{code\} checkout par verify hoga`\s*\);\s*window\.setTimeout\(\(\)\s*=>\s*setMessage\(\"\"\),\s*2200\);\s*return;\s*\}/,
  'if (!offer) {\n      setMessage(`${code} checkout par verify hoga`);\n      window.setTimeout(() => setMessage(""), 2200);\n      return;\n    }',
);

if (!/const\s+activeCoupon\s*=\s*selectedCoupon\s*\?\s*selectedCoupon\.code\s*:\s*[\"']{2}\s*;/.test(source)) {
  throw new Error("Private coupon patch could not safely disable auto-apply preview.");
}
if (!/const\s+couponNeedsFix\s*=\s*couponCode\.length\s*>\s*0\s*&&\s*!couponLooksValid\s*;/.test(source)) {
  throw new Error("Private coupon patch could not safely restore coupon validation state.");
}

fs.writeFileSync(target, source);
console.log("Private coupon patch applied safely and idempotently; coupon Apply remains explicit.");
