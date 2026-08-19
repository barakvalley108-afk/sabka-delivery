import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();
const target = path.join(root, "app", "page.tsx");
let source = fs.readFileSync(target, "utf8");

// Coupon validation must happen only after the customer presses Apply.
// Typing/editing a code must never show "Invalid coupon code".
source = source.replace(
  /const\s+couponNeedsFix\s*=\s*[^;]+;/,
  'const couponNeedsFix = false;',
);

// Keep explicit Apply behavior. A valid public coupon gets a preview;
// a hidden/private coupon becomes active only after Apply and is validated
// authoritatively by the order API.
if (!source.includes("const activeCoupon = appliedCouponCode;")) {
  source = source.replace(
    /const\s+activeCoupon\s*=\s*[^;]+;/,
    'const activeCoupon = appliedCouponCode;',
  );
}

const handlerStart = source.indexOf("  function applyManualCoupon() {");
const handlerEnd = source.indexOf("\n  function pickVariant(item: Item)", handlerStart);
if (handlerStart !== -1 && handlerEnd !== -1) {
  const handler = `  function applyManualCoupon() {
    const code = couponCode.trim().toUpperCase();
    setCouponCode(code);

    if (!/^[A-Z0-9]{4,20}$/.test(code)) {
      setAppliedCouponCode("");
      setMessage("Invalid coupon code");
      window.setTimeout(() => setMessage(""), 2200);
      return;
    }

    const offer = couponList.find((coupon) => coupon.code === code);

    if (!offer) {
      setAppliedCouponCode(code);
      setMessage(\`✓ \\${code} entered — checkout par verify hoga\`);
      window.setTimeout(() => setMessage(""), 2200);
      return;
    }

    if (subtotal < offer.minOrder) {
      setAppliedCouponCode("");
      setMessage(\`Coupon ke liye ₹\\${offer.minOrder - subtotal} aur add karo\`);
      window.setTimeout(() => setMessage(""), 2200);
      return;
    }

    setAppliedCouponCode(code);
    const rawDiscount =
      offer.discountType === "PERCENT"
        ? Math.floor((subtotal * offer.discountValue) / 100)
        : offer.discountValue;
    const appliedDiscount = offer.maxDiscount
      ? Math.min(rawDiscount, offer.maxDiscount)
      : rawDiscount;

    setMessage(\`✓ \\${code} applied — ₹\\${appliedDiscount} saved\`);
    window.setTimeout(() => setMessage(""), 2200);
  }
`;
  source = source.slice(0, handlerStart) + handler + source.slice(handlerEnd + 1);
}

if (!source.includes("const couponNeedsFix = false;")) {
  throw new Error("Private coupon patch could not disable validation while typing.");
}
if (!source.includes("const activeCoupon = appliedCouponCode;")) {
  throw new Error("Private coupon patch could not preserve explicit Apply state.");
}

fs.writeFileSync(target, source);
console.log("Coupon validation now runs on Apply only; typing a coupon does not show Invalid coupon code.");
