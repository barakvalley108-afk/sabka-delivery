import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();
const target = path.join(root, "app", "page.tsx");
let source = fs.readFileSync(target, "utf8");

const replacement = `  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (couponNeedsFix) {
      setMessage(
        selectedCoupon
          ? \`Coupon ke liye ₹\${selectedCoupon.minOrder - subtotal} aur add karo\`
          : "Invalid coupon code",
      );
      window.setTimeout(() => setMessage(""), 2200);
      return;
    }

    primeSuccessSound();
    setOrderFailure("");
    setPlacing(true);
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      const storeGroups = new Map<number, Record<number, number>>();

      for (const [variantIdText, quantity] of Object.entries(cart)) {
        const variantId = Number(variantIdText);
        const variant = variants.find((entry) => entry.id === variantId);
        const item = variant
          ? items.find((entry) => entry.id === variant.item_id)
          : null;

        if (!variant || !item || quantity <= 0) continue;

        const group = storeGroups.get(item.store_id) || {};
        group[variantId] = quantity;
        storeGroups.set(item.store_id, group);
      }

      if (!storeGroups.size) {
        throw new Error("Cart items load nahi hue. Dobara try karo.");
      }

      const groupedOrders = Array.from(storeGroups.entries());
      const placedOrders: Array<{ orderCode: string; total: number; rewardOffer?: { title?: string } | null }> = [];

      for (let index = 0; index < groupedOrders.length; index += 1) {
        const [storeId, groupedItems] = groupedOrders[index];
        const response = await fetch("/api/market-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobile: form.get("mobile"),
            customerName: form.get("name"),
            storeId,
            address: form.get("address"),
            paymentMethod: form.get("payment"),
            couponCode: index === 0 ? activeCoupon : "",
            rewardOfferId: index === 0 ? eligibleReward?.id || null : null,
            items: groupedItems,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          const partialMessage = placedOrders.length
            ? \`\${placedOrders.length} store ka order place ho gaya, lekin ek order fail hua: \${data.error || "Order place nahi hua"}\`
            : data.error || "Order place nahi hua";
          throw new Error(partialMessage);
        }

        placedOrders.push(data.order);
      }

      const orderCodes = placedOrders.map((order) => order.orderCode);
      setOrderCode(orderCodes.join(", "));
      setRewardApplied(
        placedOrders.find((order) => order.rewardOffer?.title)?.rewardOffer?.title || "",
      );
      setHistoryMobile(String(form.get("mobile") || ""));
      setSuccessEta("25-45 min");
      setCart({});
      setCartStore(null);
      setCouponCode("");
      setCheckout("success");
      void playSuccessSound();
    } catch (error) {
      const failureMessage =
        error instanceof Error ? error.message : "Order place nahi hua";

      setOrderFailure(failureMessage);
      setCheckout("failed");
      setMessage("");
      void playFailedSound();
    } finally {
      setPlacing(false);
    }
  }

`;

const pattern = /  async function placeOrder\(event: FormEvent<HTMLFormElement>\) \{[\s\S]*?\n  async function sendOtp\(\) \{/;

if (!pattern.test(source)) {
  throw new Error("placeOrder function block not found for multi-store patch.");
}

source = source.replace(pattern, `${replacement}  async function sendOtp() {`);
fs.writeFileSync(target, source);
console.log("Multi-store checkout patch applied.");
