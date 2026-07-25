# Sabka Delivery

Full-stack food and grocery delivery platform for Lala Bazar, Hailakandi,
Assam. The repository contains the live customer website, private operational
panels and two Android Trusted Web Activity projects.

## Included apps

| App | Package ID | Entry point | Distribution |
| --- | --- | --- | --- |
| Sabka Delivery | `com.sabkadelivery.app` | Customer storefront | Google Play |
| Sabka Delivery Partner | `com.sabkadelivery.partner` | Secure panel login | Private/managed distribution |

The partner app uses the existing role-based login. Restaurant, grocery, rider
and super-admin credentials are never compiled into either Android app.

## Web and panel routes

- Customer: `/`
- Panel login: `/panel-login`
- Super admin: `/super-admin`
- Restaurant partner: `/restaurant-panel`
- Grocery partner: `/grocery-panel`
- Rider: `/rider-panel`
- Privacy policy: `/privacy`
- Terms: `/terms`

## Android behavior

- Full-screen Trusted Web Activity instead of a basic WebView wrapper.
- Customer and partner apps use separate package IDs and launcher entries.
- Android notification and foreground-location delegation are enabled.
- Food, Grocery and Order History launcher shortcuts are included.
- The customer app intercepts `sabka-upi://pay` and always opens Android's
  chooser containing installed UPI-capable apps. It does not redirect to the
  Play Store when no UPI app is installed.
- The website includes an installable manifest, service worker, offline screen,
  Android deep-link endpoint, privacy policy and terms.

## Build the customer AAB in Android Studio

1. Install the current stable Android Studio with Android SDK 36.
2. Open `mobile/customer` as a project and allow Gradle sync to finish.
3. Choose **Build → Generate Signed Bundle / APK → Android App Bundle**.
4. Create an upload keystore in a safe location outside this repository.
5. Build the `release` bundle. The output is normally under
   `mobile/customer/app/build/outputs/bundle/release/`.
6. Upload the `.aab` to the Play Console closed-testing track.

Repeat with `mobile/partner` only if a separately distributed partner app is
needed. Do not publish the super-admin panel as a public Play Store destination.

## Digital Asset Links

A Trusted Web Activity becomes full-screen only after Android verifies that the
website and signed app belong together.

1. In Play Console, open **Setup → App integrity → App signing key certificate**.
2. Copy the SHA-256 fingerprint for each distributed app.
3. Replace the placeholders in `mobile/assetlinks.template.json`.
4. Save the resulting JSON as the `ANDROID_ASSETLINKS_JSON` production
   environment value and deploy the website again.
5. Confirm that `/.well-known/assetlinks.json` returns the final JSON.

Never commit an upload keystore, its password, Play service-account JSON or any
panel password.

## Web development

Prerequisites: Node.js `>=22.13.0`, Linux with `flock`, `curl` and GNU
`timeout`.

```bash
npm run install:ci
npm run dev
npm run build
npm test
```

Important locations:

- `app/` — customer UI, panel UI and API routes
- `db/` — D1 data access
- `worker/` — production Worker entry and Asset Links response
- `public/` — PWA assets, service worker and offline page
- `mobile/customer/` — Play Store customer Android project
- `mobile/partner/` — private partner Android project

The Android projects were generated with Bubblewrap. `scripts/generate-mobile.mjs`
is a maintainer utility and requires `@bubblewrap/cli` to be available locally.
Regenerating replaces generated Android files, so preserve the customer native
UPI chooser activity and manifest changes when upgrading Bubblewrap.

## Production configuration

Use `.env.example` as the safe checklist for runtime values. Keep real OTP,
SMS, Play signing, UPI and panel credentials in the hosting provider secret
store or local `.dev.vars`; never commit them to git.

The production database binding is Cloudflare D1 under the binding name `DB`.
This repo already maps that binding in `.openai/hosting.json`. Apply every SQL
file in `drizzle/` in order before deployment, including
`drizzle/0007_order_wallet_audit.sql` for order status history and rider wallet
audit records.

The current runtime remains D1/SQLite-compatible. A PostgreSQL companion
migration for the new audit tables lives in
`migrations/postgres/0001_order_wallet_audit.sql`. If you move fully to
PostgreSQL, port the remaining Drizzle schema and the SQL in `drizzle/` first,
then switch the data access layer from `drizzle-orm/d1` to the PostgreSQL driver
in one controlled migration. Do not run a destructive reseed on a live database;
startup now only creates or upgrades missing tables and default settings.

## Operational flow

Customer order statuses now follow these panel flows:

- Food: `ACCEPTED -> CONFIRMED -> PREPARING -> READY_FOR_PICKUP -> OUT_FOR_DELIVERY -> DELIVERED`
- Grocery/Electronics: `ACCEPTED -> CONFIRMED -> PACKING -> READY_FOR_PICKUP -> OUT_FOR_DELIVERY -> DELIVERED`

Panel accounts can be created first and assigned to a shop or rider later from
Super Admin. Unassigned partner or rider accounts receive a clear setup error
instead of a broken panel. Rider delivery earnings and withdrawal requests are
recorded in `market_wallet_transactions`; every order status change is recorded
in `market_order_status_history`.

Support WhatsApp defaults to `+91 80117 67897`. Food minimum order defaults to
`0`; delivery charge can be set globally and per section from Super Admin.

## Verification

Run the app checks before shipping:

```bash
node node_modules/typescript/bin/tsc --noEmit
npm run build
npm test
```

If you are running from Codex on Windows, use the bundled Node executable shown
by the workspace dependency helper and call `node_modules/typescript/bin/tsc`
directly to avoid package-manager network retries during type-checking.
