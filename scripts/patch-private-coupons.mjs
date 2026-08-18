import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();
const target = path.join(root, "app", "page.tsx");
let source = fs.readFileSync(target, "utf8");

source = source.replace('  const activeCoupon = couponEligible ? selectedCoupon.code : "";', '  const activeCoupon = couponEligible ? selectedCoupon.code : couponLooksValid ? couponCode : "";');
source = source.replace('  const couponNeedsFix = couponCode.length > 0 && !couponEligible;', '  const couponNeedsFix = couponCode.length > 0 && (!couponLooksValid || (!!selectedCoupon && !couponEligible));');
source = source.replace('      setMessage("Private coupon checkout par verify hoga");', '      setMessage("Invalid coupon code");');
source = source.replaceAll('          : "Private coupon checkout par verify hoga",', '          : "Invalid coupon code",');
source = source.replaceAll('className="coupon-warning">Private coupon checkout par verify hoga</p>', 'className="coupon-invalid">Invalid coupon code</p>');
source = source.replaceAll('className="coupon-warning">\n                      Private coupon checkout par verify hoga', 'className="coupon-invalid">\n                      Invalid coupon code');

if (!source.includes('const activeCoupon = couponEligible ? selectedCoupon.code : couponLooksValid ? couponCode : "";')) {
  throw new Error("Private coupon checkout pass-through patch could not be applied safely.");
}
fs.writeFileSync(target, source);
console.log("Private coupon UI now shows Invalid coupon code; secure checkout validation remains enabled.");
