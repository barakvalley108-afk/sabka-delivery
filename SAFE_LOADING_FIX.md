# Safe loading-screen fix

- Homepage keeps the CPU-safe client-loaded catalog flow.
- GET / does not call D1, migrations, schema setup, or getInitialMarketCatalog().
- Added a short CSS-only loading cover (minimum 450 ms, safety release at 1800 ms) to prevent the empty catalog/default UI from flashing.
- The loading cover does not load Lottie or add server/Worker CPU work.
- `public/animations/success.lottie` remains lazy-loaded only inside the order-success component after a confirmed successful order.
- `/api/market` remains a lightweight persisted-snapshot read.

Live Cloudflare HTTP 200/Error 1102 verification must still be performed after deployment.
