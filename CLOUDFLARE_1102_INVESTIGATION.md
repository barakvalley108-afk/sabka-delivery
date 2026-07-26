# Sabka Delivery — Cloudflare Error 1102 Investigation

## Verification status

The code change, production build, automated tests, and repeated local
Cloudflare Worker requests passed. Production was not deployed or tested,
exactly as requested by the owner. This package must therefore be treated as
**locally corrected, not production verified**.

## Complete `GET /` execution trace

```text
worker/index.ts default.fetch
  -> vinext/server/app-router-entry handler.fetch
     -> app/layout.tsx
     -> app/page.tsx Page()
        -> db/market-catalog.ts getInitialMarketCatalog()
           -> getMarketCatalog({ section: "FOOD", offset: 0 })
              -> normalizeCatalogOptions()
              -> db/control-store.ts ensureControlTables()
                 -> db/market-store.ts getMarketDatabase()
                    -> dynamic import("cloudflare:workers")
                    -> env.DB
              -> queryMarketCatalog()
                 -> withTimeout()
                 -> one db.batch() with 11 bounded SELECT statements
              -> in-memory last-valid catalog assignment
        -> app/market-home.tsx MarketHome server render
```

The vinext App Router performs an RSC pass and an SSR pass, so the page loader
is invoked twice for a normal HTML request. Each invocation is now limited to
one bounded batch: one section, at most 120 items, and at most 360 variants.

The error fallback is also bounded. It performs one snapshot SELECT for the
first page only, parses a snapshot only after the live read fails, then falls
back to the last valid in-memory page. It does not retry the live query.

## Exact CPU root cause

Temporary `performance.now()` timing and response-size instrumentation was
added around the Worker handler, `Page`, `getInitialMarketCatalog`,
`getMarketCatalog`, `queryMarketCatalog`, its D1 batch, and `MarketHome`.

With a stress D1 containing 3,400 items and 10,200 variants, the previous code
did this on both RSC and SSR passes:

- `db/market-catalog.ts::queryMarketCatalog()` returned all 3,400 active items
  and all 10,200 active variants, including catalog rows from closed stores
  that could never be displayed.
- `app/market-home.tsx::MarketHome()` rendered 600 visible item cards and, for
  every item, scanned the complete variants array with
  `variants.filter(...)`. That was an O(items × variants) render.
- The server then serialized a multi-megabyte client-component prop twice for
  the RSC/SSR work.

Instrumented pre-fix observations:

```text
D1 batch per render pass:       38–55 ms wall time
MarketHome render per pass:     90–110 ms
GET / handler:                  766–944 ms
GET / streamed response:        3,148,157 bytes
GET /api/market response:       2,453,282 bytes
```

This over-fetch, quadratic server render, and oversized RSC/HTML serialization
was the remaining request-path CPU problem. Runtime schema bootstrapping had
already been removed, but that alone was not sufficient.

## Corrections

- Catalog data is section-scoped and page-scoped.
- Items exclude inactive items, closed stores, unapproved/blocked stores,
  inactive sections, and stores outside their configured opening time.
- A page returns at most 120 items. Variant reads are joined to that exact item
  page and return at most 360 rows.
- All 11 catalog reads remain in one `db.batch()`; there are no per-store,
  per-category, per-item, per-variant, or per-addon request loops.
- Store, area, promotion, reward, content, category, section, setting, and
  revision reads have explicit limits.
- The homepage first response receives the server catalog. The client no
  longer replaces the entire catalog on mount.
- Additional sections/pages are requested only when selected or when the user
  asks for more products.
- `MarketHome` builds `Map` indexes for stores, items, variants, and
  variants-by-item instead of repeatedly scanning arrays.
- Initial SSR renders only 24 product cards; more cards are progressively
  revealed and subsequent catalog pages are fetched only when needed.
- Full-catalog `JSON.stringify` signatures were removed from the customer
  catalog component.
- Deployment migration `0002_catalog_read_indexes.sql` adds the indexes used
  by customer catalog reads.
- A lightweight `Server-Timing: worker-handler;dur=...` header remains on `/`,
  `/api/market`, and `/api/market-version`. Verbose temporary console timing
  logs were removed after measurement so production logging does not add CPU.

## Proof: no maintenance work in `GET /`

Repository and import-path audits found:

```text
Runtime CREATE TABLE matches:                 0
Runtime CREATE TRIGGER matches:               0
Runtime ALTER TABLE matches:                  0
GET / migration or seed calls:                0
GET / INSERT/UPDATE/DELETE statements:        0
GET / internal /api/market fetches:           0
GET / public-domain recursive fetches:        0
GET / unbounded while/retry loops:             0
```

`ensureControlTables()` and `ensureMarketTables()` now only resolve `env.DB`.
All DDL and triggers are confined to SQL migration files.

`market_catalog_snapshots` is SELECTed only as a first-page error fallback.
`JSON.stringify(catalog)` and the snapshot UPSERT exist only inside
`refreshMarketCatalogSnapshot()`. That function is called only after successful
Admin or Partner mutation operations; homepage and catalog GET handlers never
call it.

Module-level audit:

- `app/page.tsx`, `app/layout.tsx`, `app/market-home.tsx`, and
  `db/market-catalog.ts` have no module-level database operation or fetch.
- `worker/index.ts` imports payment expiry helpers but runs the bounded expiry
  sweep only from the scheduled handler, never from `fetch`.
- No runtime module calls schema initialization at import time.

The automated regression test
`GET homepage import path has no DDL, writes, recursive fetch, or retries`
also passed.

## Local Cloudflare Worker verification

Wrangler 4.114.0 ran the built `dist/server/index.js` with a local D1 stress
fixture containing 3,400 items and 10,200 variants.

Exact command:

```text
npx wrangler dev --config wrangler.runtime.jsonc --local --ip 127.0.0.1 --port 8788
```

The verification container required a temporary host-network shim because its
`os.networkInterfaces()` implementation throws before Wrangler starts. The
shim is not part of this source package and does not change the Worker.

Repeated request results:

| Route | Requests | HTTP 200 | Min | Average | Max | Response size |
|---|---:|---:|---:|---:|---:|---:|
| `/` | 10 | 10 | 20.336 ms | 22.313 ms | 25.630 ms | 140,280 bytes |
| `/api/market` | 10 | 10 | 7.540 ms | 8.923 ms | 10.953 ms | 88,909 bytes |
| `/api/market-version` | 10 | 10 | 3.453 ms | 3.820 ms | 4.555 ms | 51 bytes |

The first additional cold homepage request exposed:

```text
Server-Timing: worker-handler;dur=66.00
```

Pagination/section assertions:

```json
{
  "firstPageItems": 120,
  "secondPageItems": 120,
  "firstPageVariants": 360,
  "pagesOverlap": false,
  "grocerySectionOnly": true
}
```

All repeated requests returned HTTP 200. No Error 1102 response appeared in
local Wrangler. These values are local end-to-end wall times, not Cloudflare
production CPU measurements, so they are not presented as production proof.

## Schema migration

Schema and trigger creation remains deployment-only:

- `migrations/runtime/0001_schema.sql` — schema and catalog revision triggers;
  no demo coupon rows.
- `migrations/runtime/0002_catalog_read_indexes.sql` — 11 customer-catalog
  indexes.

The local migration command applied both files successfully. It must be run
against the correct preview/production D1 binding during deployment; no
migration runs inside a request.

## Commands and results

```text
NPM_CONFIG_CACHE=<writable temporary cache> npm ci --no-audit --no-fund
PASS — 532 packages installed from the lockfile in 14 seconds

npm run lint
PASS — 0 errors, 25 existing next/image and unused-symbol warnings

npx tsc --noEmit
PASS — 0 TypeScript errors

npm run build
PASS — 189 client-reference, 77 server-reference, 195 RSC,
       84 client, and 83 SSR modules transformed
PASS — ESM Worker default.fetch and hosting manifest validated

npm test
PASS — 15/15 rendered/source regression tests
PASS — 11/11 coupon and online-payment functional tests

npx wrangler dev
PASS — actual local Worker started with D1 and static asset bindings
PASS — 30/30 repeated endpoint requests returned HTTP 200
```

## Modified files

- `app/api/admin/control/route.ts`
- `app/api/market/route.ts`
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
- `migrations/runtime/0002_catalog_read_indexes.sql`
- `package.json`
- `package-lock.json`
- `public/animations/success.lottie`
- `scripts/migrate-runtime-local.sh`
- `scripts/sites-env.sh`
- `tests/payment-orders.test.ts`
- `tests/source-regressions.test.mjs`
- `worker/index.ts`
- `wrangler.runtime.jsonc`
- `CLOUDFLARE_1102_INVESTIGATION.md`
- `VERIFICATION_COMMAND_LOG.txt`

## Deployment handoff

Production deployment was intentionally skipped. Before production:

1. Back up the target D1 database.
2. Confirm the preview Worker/Pages project and D1 binding.
3. Apply both runtime migrations to preview D1.
4. Deploy the exact clean ZIP source to preview first.
5. Repeat `/`, `/api/market`, and `/api/market-version` and inspect
   `Server-Timing`, HTTP status, and Cloudflare CPU metrics.
6. Confirm no Error 1102 in preview before promoting to production.

Environment note: a plain final `npm ci` retry could not write this managed
container's default `/root/.npm` cache and exited before dependency
verification. The same lockfile command was rerun from a clean
`node_modules` directory with a writable temporary npm cache and passed. This
is a container filesystem restriction, not a source or lockfile error.
