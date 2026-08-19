import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();
const target = path.join(root, "app", "page.tsx");
let source = fs.readFileSync(target, "utf8");

// Manual/private coupon codes are validated by the server. The homepage may
// preview public coupons, but a private code must only become active after the
// customer explicitly clicks Apply. Never auto-apply a typed code.
if (!source.includes('const [appliedCouponCode, setAppliedCouponCode] = useState("");')) {
  const marker = '  const [couponCode, setCouponCode] = useState("");';
  if (source.includes(marker)) {
    source = source.replace(
      marker,
      marker + '\n  const [appliedCouponCode, setAppliedCouponCode] = useState("");',
    );
  }
}

source = source.replace(
  /const\s+activeCoupon\s*=\s*[^;]+;/,
  'const activeCoupon = appliedCouponCode;',
);

source = source.replace(
  /const\s+couponNeedsFix\s*=\s*[^;]+;/,
  'const couponNeedsFix = appliedCouponCode.length > 0 && !couponLooksValid;',
);

// Replace the Apply handler so public and private codes both require an
// explicit click. Public coupons get a local preview; private coupons are sent
// to the server for authoritative validation at order placement.
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
      // Hidden/private coupons are not exposed in the public offer list.
      // Keep the code inactive until this explicit Apply click, then let the
      // server decide whether it is genuinely valid and eligible.
      setAppliedCouponCode(code);
      setMessage("✓ ${code} entered — checkout par verify hoga");
      window.setTimeout(() => setMessage(""), 2200);
      return;
    }

    if (subtotal < offer.minOrder) {
      setAppliedCouponCode("");
      setMessage(
        \\`Coupon ke liye ₹\\${offer.minOrder - subtotal} aur add karo\\`,
      );
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

    setMessage(\\`✓ \\${code} applied — ₹\\${appliedDiscount} saved\\`);
    window.setTimeout(() => setMessage(""), 2200);
  }
`;
  source = source.slice(0, handlerStart) + handler + source.slice(handlerEnd + 1);
}

// Clear the explicit applied-code state after a successful order as well.
source = source.replace(
  '      setCouponCode("");\n      setCheckout("success");',
  '      setCouponCode("");\n      setAppliedCouponCode("");\n      setCheckout("success");',
);

// Build verification must never fail merely because an earlier patch already
// produced the desired state. Accept either the transformed or already-good
// source and only fail if the essential state could not be established.
if (!source.includes("const activeCoupon = appliedCouponCode;")) {
  throw new Error("Private coupon patch could not establish explicit coupon activation.");
}
if (!source.includes("const couponNeedsFix = appliedCouponCode.length > 0 && !couponLooksValid;")) {
  throw new Error("Private coupon patch could not establish safe coupon validation.");
}

fs.writeFileSync(target, source);
console.log("Private coupon patch applied: explicit Apply required; private coupons remain server-validated.");
