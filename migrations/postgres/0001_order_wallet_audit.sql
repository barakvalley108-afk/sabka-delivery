-- PostgreSQL companion migration for SABKA DELIVERY audit tables.
-- The current runtime uses Cloudflare D1; apply this only in a PostgreSQL port.

CREATE TABLE IF NOT EXISTS market_order_status_history (
  id BIGSERIAL PRIMARY KEY,
  order_code TEXT NOT NULL,
  status TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS market_order_status_history_order_idx
  ON market_order_status_history (order_code, created_at);

CREATE TABLE IF NOT EXISTS market_wallet_transactions (
  id BIGSERIAL PRIMARY KEY,
  rider_id BIGINT NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  order_code TEXT,
  payout_id BIGINT,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS market_wallet_transactions_rider_idx
  ON market_wallet_transactions (rider_id, created_at);
