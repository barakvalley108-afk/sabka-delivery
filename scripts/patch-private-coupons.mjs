// Coupon UI is already implemented in app/page.tsx.
// Keep this build hook as a no-op so Cloudflare builds do not rewrite
// customer checkout code and introduce runtime Worker exceptions.
console.log("Skipping legacy private-coupon source mutation; using committed app/page.tsx.");
