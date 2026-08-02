import fs from "node:fs";

const file = "app/page.tsx";
const source = fs.readFileSync(file, "utf8");

const oldBlock = `    if (cartStore && cartStore !== item.store_id && cartCount) {
      if (
        !window.confirm(
          "Dusre store ka cart start karne par current cart clear ho jayega. Continue?",
        )
      )
        return;
      setCart({});
    }
    setCartStore(item.store_id);`;

const newBlock = `    // Mixed-store cart: keep existing items and never show a reset confirmation.
    // Keep the first store as the checkout owner so the existing order flow remains stable.
    if (!cartStore) setCartStore(item.store_id);`;

if (source.includes(newBlock)) {
  console.log("Mixed cart patch already applied.");
  process.exit(0);
}

if (!source.includes(oldBlock)) {
  throw new Error("Mixed cart source block not found; refusing an unsafe patch.");
}

fs.writeFileSync(file, source.replace(oldBlock, newBlock));
console.log("Mixed cart reset removed.");
