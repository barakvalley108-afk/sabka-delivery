import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();
const target = path.join(root, "app", "page.tsx");
let source = fs.readFileSync(target, "utf8");

source = source.replace(
  '  const activeCoupon = couponEligible ? selectedCoupon.code : "";',
  '  const activeCoupon = couponEligible ? selectedCoupon.code : couponLooksValid ? couponCode : "";',
);

source = source.replace(
  '  const couponNeedsFix = couponCode.length > 0 && !couponEligible;',
  '  const couponNeedsFix = couponCode.length > 0 && (!couponLooksValid || (!!selectedCoupon && !couponEligible));',
);

source = source.replace(
  '    if (!offer) {\n      setMessage("Invalid coupon code");\n      window.setTimeout(() => setMessage(""), 2200);\n      return;\n    }',
  '    if (!offer) {\n      setMessage("Private coupon checkout par verify hoga");\n      window.setTimeout(() => setMessage(""), 2200);\n      return;\n    }',
);

source = source.replace(
  '          : "Invalid coupon code",',
  '          : "Private coupon checkout par verify hoga",',
);

source = source.replaceAll(
  '{couponCode && couponLooksValid && !selectedCoupon && (\n                    <p className="coupon-invalid">Invalid coupon code</p>\n                  )}',
  '{couponCode && couponLooksValid && !selectedCoupon && (\n                    <p className="coupon-warning">Private coupon checkout par verify hoga</p>\n                  )}',
);

source = source.replaceAll(
  '{couponCode && couponLooksValid && !selectedCoupon && (\n                    <small className="coupon-invalid">\n                      Invalid coupon code\n                    </small>\n                  )}',
  '{couponCode && couponLooksValid && !selectedCoupon && (\n                    <small className="coupon-warning">\n                      Private coupon checkout par verify hoga\n                    </small>\n                  )}',
);

if (!source.includes('const activeCoupon = couponEligible ? selectedCoupon.code : couponLooksValid ? couponCode : "";')) {
  throw new Error("Private coupon checkout pass-through patch could not be applied safely.");
}

fs.writeFileSync(target, source);
console.log("Private coupons now pass their entered code to secure checkout validation.");
