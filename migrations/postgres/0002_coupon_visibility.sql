-- PostgreSQL companion migration for SABKA DELIVERY coupon visibility.
-- The current runtime uses Cloudflare D1; apply this only in a PostgreSQL port.

ALTER TABLE market_promotion_rules
ADD COLUMN show_on_website INTEGER NOT NULL DEFAULT 1;
