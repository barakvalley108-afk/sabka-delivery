-- Apply during deployment after 0001_schema.sql.
-- These indexes support the bounded customer catalog SELECT batch.

CREATE INDEX IF NOT EXISTS market_stores_customer_catalog_idx
ON market_stores (is_open,id);

CREATE INDEX IF NOT EXISTS market_store_controls_customer_catalog_idx
ON market_store_controls (approved,blocked,store_id);

CREATE INDEX IF NOT EXISTS market_store_operations_store_idx
ON market_store_operations (store_id);

CREATE INDEX IF NOT EXISTS market_store_profiles_vertical_idx
ON market_store_profiles (vertical,store_id);

CREATE INDEX IF NOT EXISTS market_sections_customer_catalog_idx
ON market_sections (is_active,key,sort_order);

CREATE INDEX IF NOT EXISTS market_items_customer_catalog_idx
ON market_items (store_id,is_active,id);

CREATE INDEX IF NOT EXISTS market_variants_customer_catalog_idx
ON market_variants (item_id,is_active,id);

CREATE INDEX IF NOT EXISTS market_service_areas_active_idx
ON market_service_areas (is_active,name,id);

CREATE INDEX IF NOT EXISTS market_promotions_visible_idx
ON market_promotions (is_active,sort_order,created_at,code);

CREATE INDEX IF NOT EXISTS market_promotion_rules_code_idx
ON market_promotion_rules (code);

CREATE INDEX IF NOT EXISTS market_categories_vertical_order_idx
ON market_categories (vertical,sort_order,name,id);

