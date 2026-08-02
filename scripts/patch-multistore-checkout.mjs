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
        throw new Error("Cart items load nahi hue. Cart band karke dobara kholo.");
      }

      const groupedOrders = Array.from(storeGroups.entries());
      const isMultiStore = groupedOrders.length > 1;

      const results = await Promise.all(
        groupedOrders.map(async ([storeId, groupedItems], index) => {
          const storeName =
            stores.find((store) => store.id === storeId)?.name ||
            \`Store \${storeId}\`;

          try {
            const response = await fetch("/api/market-orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                mobile: form.get("mobile"),
                customerName: form.get("name"),
                storeId,
                address: form.get("address"),
                paymentMethod: form.get("payment"),
                couponCode: !isMultiStore && index === 0 ? activeCoupon : "",
                rewardOfferId:
                  !isMultiStore && index === 0
                    ? eligibleReward?.id || null
                    : null,
                items: groupedItems,
              }),
            });

            const rawBody = await response.text();
            let data: {
              error?: string;
              order?: {
                orderCode: string;
                total: number;
                rewardOffer?: { title?: string } | null;
              };
            } = {};

            try {
              data = rawBody ? JSON.parse(rawBody) : {};
            } catch {
              data = {};
            }

            if (!response.ok || !data.order) {
              const exactReason =
                data.error ||
                (response.status === 409
                  ? \`\${storeName} abhi order accept nahi kar raha\`
                  : response.status >= 500
                    ? \`\${storeName} server error. Dobara try karo\`
                    : rawBody.trim().slice(0, 160) ||
                      \`\${storeName} ka order place nahi hua\`);

              return { ok: false as const, storeName, error: exactReason };
            }

            return { ok: true as const, storeName, order: data.order };
          } catch (error) {
            return {
              ok: false as const,
              storeName,
              error:
                error instanceof Error && error.message.trim()
                  ? error.message
                  : \`\${storeName} ka order place nahi hua\`,
            };
          }
        }),
      );

      const successful = results.filter(
        (result): result is Extract<(typeof results)[number], { ok: true }> =>
          result.ok,
      );
      const failed = results.filter(
        (result): result is Extract<(typeof results)[number], { ok: false }> =>
          !result.ok,
      );

      if (!successful.length) {
        throw new Error(
          failed.map((result) => \`\${result.storeName}: \${result.error}\`).join(" | ") ||
            "Kisi bhi store ka order place nahi hua.",
        );
      }

      const orderCodes = successful.map((result) => result.order.orderCode);
      setOrderCode(orderCodes.join(", "));
      setRewardApplied(
        successful.find((result) => result.order.rewardOffer?.title)?.order
          .rewardOffer?.title || "",
      );
      setHistoryMobile(String(form.get("mobile") || ""));
      setSuccessEta("25-45 min");

      if (failed.length) {
        const failedStoreIds = new Set(
          groupedOrders
            .filter(([storeId]) =>
              failed.some(
                (result) =>
                  result.storeName ===
                  (stores.find((store) => store.id === storeId)?.name ||
                    \`Store \${storeId}\`),
              ),
            )
            .map(([storeId]) => storeId),
        );

        setCart((current) => {
          const next: Record<number, number> = {};
          for (const [variantIdText, quantity] of Object.entries(current)) {
            const variant = variants.find(
              (entry) => entry.id === Number(variantIdText),
            );
            const item = variant
              ? items.find((entry) => entry.id === variant.item_id)
              : null;
            if (item && failedStoreIds.has(item.store_id)) {
              next[Number(variantIdText)] = quantity;
            }
          }
          return next;
        });
        setCartStore(null);
        setOrderFailure(
          \`\${successful.length} store ke order place ho gaye. Fail: \${failed
            .map((result) => \`\${result.storeName} - \${result.error}\`)
            .join(" | ")}\`,
        );
        setCheckout("failed");
        void playFailedSound();
        return;
      }

      setCart({});
      setCartStore(null);
      setCouponCode("");
      setCheckout("success");
      void playSuccessSound();
    } catch (error) {
      const failureMessage =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Order place nahi hua. Dobara try karo.";

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
console.log("All-store checkout patch applied.");
