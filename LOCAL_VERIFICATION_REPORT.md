# Sabka Delivery v68 Runtime Fix

## Status

The source code and local functional verification are complete. Cloudflare
preview and production deployment were intentionally deferred at the owner's
request.

## Runtime database changes

- Customer homepage and API requests no longer create or alter tables.
- Customer request paths do not create triggers, execute migrations, or insert
  seed/demo coupons.
- `ensureControlTables()` and `ensureMarketTables()` only resolve the D1 `DB`
  binding.
- `getMarketCatalog()` performs one bounded `db.batch()` containing the
  required SELECT queries.
- Catalog reads do not write `market_catalog_snapshots`.
- A snapshot is refreshed only after successful Admin or Partner catalog
  mutations.
- The explicit deployment migration is:
  `migrations/runtime/0001_schema.sql`.
- The migration contains no `WELCOME20`, `SABKA50`, or other demo coupon.

## Order payment and success animation

- The exact supplied animation is stored at
  `public/animations/success.lottie`.
- The Lottie player is lazy-loaded in a separate client-only success component.
- COD success renders only after the order API confirms order creation.
- Online-payment success renders only after the backend confirms `PAID` and
  moves the order from `PAYMENT_PENDING` to `PLACED`.
- Pending, failed, cancelled, abandoned, and expired online payments never
  render the success animation.
- Expired pending payments are cancelled by a bounded scheduled sweep.
- Cancellation restores reserved stock and releases coupon/reward usage.
- Reduced-motion and player-load failures use a static success icon.

## Commands and results

```text
npm install @lottiefiles/dotlottie-react
PASS - dependencies installed and package lock updated

npm run db:migrate:runtime:local
PASS - 120 migration statements
PASS - second execution was idempotent
Database check: 45 triggers, 0 promotions/coupons, 0 catalog snapshots

npm run lint
PASS - 0 errors, 25 existing optimization warnings

npx tsc --noEmit
PASS - 0 TypeScript errors

npm run build
PASS
Client references: 189 modules
Server references: 77 modules
RSC environment: 195 modules
Client environment: 84 modules
SSR environment: 83 modules
ESM Worker artifact and hosting manifest validated

npm test
PASS - 13/13 render/source regression tests
PASS - 11/11 coupon/payment functional tests
```

## Local Cloudflare-compatible runtime verification

```text
GET /                    10/10 HTTP 200
GET /api/market          10/10 HTTP 200
GET /api/market-version  10/10 HTTP 200
Cache-Control: no-store, no-cache, must-revalidate
Build marker: v68-coupon-cache-fix
Cloudflare Error 1102 response: not observed
Catalog snapshot rows after repeated reads: 0
```

Coupon/order checks:

- Unknown `SABKE90`: HTTP 400,
  `{"error":"Invalid coupon","reason":"INVALID"}`.
- COD order: backend-confirmed and success page rendered.
- Incomplete UPI order: `PAYMENT_PENDING`, `confirmed:false`, no success
  animation.
- Verified UPI test: payment `PAID`, order `PLACED`.
- Expired UPI test: order cancelled and reserved stock restored.

The local Cloudflare-compatible Vite runtime passed these checks. The exact
`wrangler dev` command could not bind inside the verification container because
the host returned `uv_interface_addresses returned Unknown system error 1`.
Wrangler 4.92.0 and 4.114.0 produced the same host-level error.

## Cloudflare deployment handoff

1. Install dependencies with `npm ci`.
2. Replace the local validation database name/ID in `wrangler.runtime.jsonc`
   with the correct preview environment D1 database before remote use.
3. Apply `migrations/runtime/0001_schema.sql` to a preview D1 database. Take a
   D1 backup first.
4. Build with `npm run build`.
5. Deploy the preview Worker/Pages environment.
6. Configure the bounded payment-expiry scheduled trigger (`*/5 * * * *`) for
   the deployed Worker environment.
7. Repeat requests to `/`, `/api/market`, and `/api/market-version`.
8. Verify HTTP 200 responses and confirm no Error 1102.
9. Test COD, incomplete UPI, verified UPI, and expired UPI before production.

Do not apply the local validation D1 identifier to production without checking
the connected Cloudflare project and production database.

## Modified files

- `app/api/admin/control/route.ts`
- `app/api/market-cancel/route.ts`
- `app/api/market-orders/route.ts`
- `app/api/market-payment-status/route.ts`
- `app/api/market-version/route.ts`
- `app/api/partner/control/route.ts`
- `app/globals.css`
- `app/market-home.tsx`
- `app/order-success.tsx`
- `app/super-admin/admin-console.tsx`
- `db/catalog-store.ts`
- `db/control-store.ts`
- `db/market-catalog.ts`
- `db/market-store.ts`
- `db/orders-store.ts`
- `db/payment-orders.ts`
- `migrations/runtime/0001_schema.sql`
- `public/animations/success.lottie`
- `tests/payment-orders.test.ts`
- `tests/source-regressions.test.mjs`
- `worker/index.ts`
- `wrangler.runtime.jsonc`
- `package.json`
- `package-lock.json`

