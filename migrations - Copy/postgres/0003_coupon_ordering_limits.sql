-- PostgreSQL companion migration. The production runtime currently uses Cloudflare D1.

ALTER TABLE market_promotions
ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE market_promotion_rules
ADD COLUMN usage_limit INTEGER NOT NULL DEFAULT 0;

WITH ranked AS (
  SELECT code, row_number() OVER (ORDER BY created_at DESC, code) - 1 AS position
  FROM market_promotions
)
UPDATE market_promotions
SET sort_order=ranked.position
FROM ranked
WHERE ranked.code=market_promotions.code;
