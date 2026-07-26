-- Sabka Delivery runtime schema
-- Apply explicitly during deployment; never import or execute from request handlers.
-- No demo/sample coupon rows are created by this migration.

CREATE TABLE IF NOT EXISTS market_stores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('FOOD','GROCERY')),
  description TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  eta TEXT NOT NULL DEFAULT '25-35 min',
  rating REAL NOT NULL DEFAULT 4.5,
  image TEXT NOT NULL DEFAULT '',
  is_open INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS market_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL REFERENCES market_stores(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '🛍️',
  food_type TEXT NOT NULL DEFAULT 'VEG',
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS market_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES market_items(id),
  label TEXT NOT NULL,
  unit TEXT NOT NULL,
  unit_value REAL NOT NULL DEFAULT 1,
  price INTEGER NOT NULL,
  discount_price INTEGER,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS market_orders (
  order_code TEXT PRIMARY KEY,
  mobile TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  store_id INTEGER NOT NULL,
  address TEXT NOT NULL,
  area TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  delivery_fee INTEGER NOT NULL DEFAULT 20,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACCEPTED',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code TEXT NOT NULL REFERENCES market_orders(order_code),
  variant_id INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  variant_label TEXT NOT NULL,
  unit_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS market_coupon_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mobile TEXT NOT NULL,
  coupon_code TEXT NOT NULL,
  order_code TEXT NOT NULL UNIQUE,
  discount INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(mobile, coupon_code)
);

CREATE TABLE IF NOT EXISTS otp_challenges (
  id TEXT PRIMARY KEY,
  mobile TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mobile TEXT NOT NULL UNIQUE,
  name TEXT,
  is_verified INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES market_users(id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_staff_access (
  email TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK(role IN ('SUPER_ADMIN','RESTAURANT','RIDER')),
  store_id INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_store_controls (
  store_id INTEGER PRIMARY KEY,
  commission_rate REAL NOT NULL DEFAULT 18,
  approved INTEGER NOT NULL DEFAULT 1,
  blocked INTEGER NOT NULL DEFAULT 0,
  settlement_cycle TEXT NOT NULL DEFAULT 'WEEKLY',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_riders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_online INTEGER NOT NULL DEFAULT 0,
  document_status TEXT NOT NULL DEFAULT 'PENDING',
  bank_account_masked TEXT NOT NULL DEFAULT '',
  upi_id TEXT NOT NULL DEFAULT '',
  weekly_payout INTEGER NOT NULL DEFAULT 0,
  cod_collection INTEGER NOT NULL DEFAULT 0,
  latitude REAL,
  longitude REAL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_delivery_assignments (
  order_code TEXT PRIMARY KEY,
  rider_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  delivery_fee INTEGER NOT NULL DEFAULT 35,
  tip INTEGER NOT NULL DEFAULT 0,
  delivery_otp TEXT NOT NULL,
  accepted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivered_at TEXT
);

CREATE TABLE IF NOT EXISTS market_order_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code TEXT NOT NULL,
  status TEXT NOT NULL,
  actor_type TEXT NOT NULL DEFAULT 'SYSTEM',
  actor_id TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_promotions (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'FLAT',
  discount_value INTEGER NOT NULL,
  min_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  uses INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'ALL',
  status TEXT NOT NULL DEFAULT 'QUEUED',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_payouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payee_type TEXT NOT NULL,
  payee_id INTEGER NOT NULL,
  period TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  upi_id TEXT NOT NULL DEFAULT '',
  reference TEXT NOT NULL DEFAULT '',
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code TEXT NOT NULL,
  store_id INTEGER NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_panel_accounts (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('SUPER_ADMIN','RESTAURANT','RIDER','STAFF')),
  panel_type TEXT NOT NULL DEFAULT 'STAFF',
  display_name TEXT NOT NULL,
  store_id INTEGER,
  rider_id INTEGER,
  permissions TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1,
  two_factor_enabled INTEGER NOT NULL DEFAULT 0,
  two_factor_hash TEXT,
  last_login TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_panel_sessions (
  token_hash TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_login_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  success INTEGER NOT NULL,
  ip_address TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_store_operations (
  store_id INTEGER PRIMARY KEY,
  opening_time TEXT NOT NULL DEFAULT '09:00',
  closing_time TEXT NOT NULL DEFAULT '22:00',
  document_status TEXT NOT NULL DEFAULT 'PENDING',
  document_note TEXT NOT NULL DEFAULT '',
  gst_number TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_customer_controls (
  mobile TEXT PRIMARY KEY,
  is_blocked INTEGER NOT NULL DEFAULT 0,
  is_suspicious INTEGER NOT NULL DEFAULT 0,
  wallet_balance INTEGER NOT NULL DEFAULT 0,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_support_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mobile TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code TEXT,
  type TEXT NOT NULL,
  method TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  reference TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_wallet_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rider_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  order_code TEXT,
  payout_id INTEGER,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_service_areas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  pin_code TEXT NOT NULL DEFAULT '',
  radius_km REAL NOT NULL DEFAULT 5,
  delivery_charge INTEGER NOT NULL DEFAULT 20,
  min_order INTEGER NOT NULL DEFAULT 100,
  free_delivery_above INTEGER NOT NULL DEFAULT 9999,
  night_charge INTEGER NOT NULL DEFAULT 0,
  rain_charge INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS market_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  image TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  vertical TEXT NOT NULL DEFAULT 'FOOD'
);

CREATE TABLE IF NOT EXISTS market_item_addons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS market_item_flags (
  item_id INTEGER PRIMARY KEY,
  is_featured INTEGER NOT NULL DEFAULT 0,
  is_popular INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS market_promotion_rules (
  code TEXT PRIMARY KEY,
  expires_at TEXT,
  user_mobile TEXT,
  store_id INTEGER,
  first_order_only INTEGER NOT NULL DEFAULT 0,
  max_discount INTEGER NOT NULL DEFAULT 0,
  auto_pause_after_use INTEGER NOT NULL DEFAULT 0,
  show_on_website INTEGER NOT NULL DEFAULT 1,
  usage_limit INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS market_single_coupon_claims (
  coupon_code TEXT PRIMARY KEY,
  mobile TEXT NOT NULL,
  order_code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_reward_offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  qualifying_orders INTEGER NOT NULL DEFAULT 4,
  window_days INTEGER NOT NULL DEFAULT 30,
  reward_type TEXT NOT NULL DEFAULT 'FREE_DELIVERY',
  reward_value INTEGER NOT NULL DEFAULT 0,
  min_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  uses INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_reward_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_id INTEGER NOT NULL,
  mobile TEXT NOT NULL,
  order_code TEXT NOT NULL UNIQUE,
  cycle_number INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS market_reward_claims_lookup
  ON market_reward_claims (offer_id,mobile,created_at);

CREATE UNIQUE INDEX IF NOT EXISTS market_reward_claim_cycle
  ON market_reward_claims (offer_id,mobile,cycle_number);

CREATE TABLE IF NOT EXISTS market_store_profiles (
  store_id INTEGER PRIMARY KEY,
  vertical TEXT NOT NULL DEFAULT 'FOOD' CHECK(vertical IN ('FOOD','GROCERY','ELECTRONICS')),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_sections (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '▦',
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_store_sections (
  store_id INTEGER PRIMARY KEY,
  section_key TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_admin_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_admin_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  order_code TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_review_moderation (
  review_id INTEGER PRIMARY KEY,
  is_hidden INTEGER NOT NULL DEFAULT 0,
  is_flagged INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS market_rider_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rider_id INTEGER NOT NULL,
  order_code TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_content (
  key TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_catalog_revision (
  id INTEGER PRIMARY KEY CHECK(id=1),
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_catalog_snapshots (
  id INTEGER PRIMARY KEY CHECK(id=1),
  catalog_json TEXT NOT NULL,
  catalog_version INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO market_catalog_revision (id,version) VALUES (1,1);

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_stores_insert
AFTER INSERT ON market_stores
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_stores_update
AFTER UPDATE ON market_stores
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_stores_delete
AFTER DELETE ON market_stores
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_items_insert
AFTER INSERT ON market_items
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_items_update
AFTER UPDATE ON market_items
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_items_delete
AFTER DELETE ON market_items
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_variants_insert
AFTER INSERT ON market_variants
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_variants_update
AFTER UPDATE ON market_variants
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_variants_delete
AFTER DELETE ON market_variants
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_settings_insert
AFTER INSERT ON market_settings
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_settings_update
AFTER UPDATE ON market_settings
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_settings_delete
AFTER DELETE ON market_settings
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_service_areas_insert
AFTER INSERT ON market_service_areas
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_service_areas_update
AFTER UPDATE ON market_service_areas
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_service_areas_delete
AFTER DELETE ON market_service_areas
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_categories_insert
AFTER INSERT ON market_categories
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_categories_update
AFTER UPDATE ON market_categories
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_categories_delete
AFTER DELETE ON market_categories
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_promotions_insert
AFTER INSERT ON market_promotions
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_promotions_update
AFTER UPDATE ON market_promotions
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_promotions_delete
AFTER DELETE ON market_promotions
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_promotion_rules_insert
AFTER INSERT ON market_promotion_rules
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_promotion_rules_update
AFTER UPDATE ON market_promotion_rules
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_promotion_rules_delete
AFTER DELETE ON market_promotion_rules
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_reward_offers_insert
AFTER INSERT ON market_reward_offers
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_reward_offers_update
AFTER UPDATE ON market_reward_offers
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_reward_offers_delete
AFTER DELETE ON market_reward_offers
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_content_insert
AFTER INSERT ON market_content
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_content_update
AFTER UPDATE ON market_content
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_content_delete
AFTER DELETE ON market_content
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_store_controls_insert
AFTER INSERT ON market_store_controls
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_store_controls_update
AFTER UPDATE ON market_store_controls
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_store_controls_delete
AFTER DELETE ON market_store_controls
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_store_operations_insert
AFTER INSERT ON market_store_operations
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_store_operations_update
AFTER UPDATE ON market_store_operations
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_store_operations_delete
AFTER DELETE ON market_store_operations
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_store_profiles_insert
AFTER INSERT ON market_store_profiles
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_store_profiles_update
AFTER UPDATE ON market_store_profiles
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_store_profiles_delete
AFTER DELETE ON market_store_profiles
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_sections_insert
AFTER INSERT ON market_sections
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_sections_update
AFTER UPDATE ON market_sections
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_sections_delete
AFTER DELETE ON market_sections
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_store_sections_insert
AFTER INSERT ON market_store_sections
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_store_sections_update
AFTER UPDATE ON market_store_sections
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE TRIGGER IF NOT EXISTS catalog_revision_market_store_sections_delete
AFTER DELETE ON market_store_sections
BEGIN
  UPDATE market_catalog_revision
  SET version=version+1,updated_at=CURRENT_TIMESTAMP
  WHERE id=1;
END;

CREATE INDEX IF NOT EXISTS market_order_status_history_order_idx ON market_order_status_history (order_code,created_at);

CREATE INDEX IF NOT EXISTS market_wallet_transactions_rider_idx ON market_wallet_transactions (rider_id,created_at);

CREATE INDEX IF NOT EXISTS market_store_sections_key_idx ON market_store_sections (section_key);

INSERT OR IGNORE INTO market_service_areas
  (name,pin_code,radius_km,delivery_charge,min_order,free_delivery_above,
   night_charge,rain_charge,is_active)
VALUES ('Lala Bazar','788163',8,20,100,499,0,0,1);

INSERT OR IGNORE INTO market_sections
   (key,name,description,image,icon,is_active,sort_order)
   VALUES ('FOOD','Food','Restaurants, meals and local favourites','/images/hero-food-collage.png','🍲',1,1);

INSERT OR IGNORE INTO market_sections
   (key,name,description,image,icon,is_active,sort_order)
   VALUES ('GROCERY','Grocery','Daily essentials and fresh household needs','/images/grocery-daily-needs.png','🛍️',1,2);

INSERT OR IGNORE INTO market_sections
   (key,name,description,image,icon,is_active,sort_order)
   VALUES ('ELECTRONICS','Electronics','Mobiles, accessories, chargers and useful gadgets','','⚡',1,3);

INSERT OR IGNORE INTO market_store_profiles (store_id,vertical) SELECT id,type FROM market_stores;

INSERT OR IGNORE INTO market_store_sections (store_id,section_key)
   SELECT s.id,coalesce(p.vertical,s.type)
   FROM market_stores s LEFT JOIN market_store_profiles p ON p.store_id=s.id;

INSERT OR IGNORE INTO market_store_controls (store_id,commission_rate,approved,blocked)
   SELECT id,18,1,0 FROM market_stores;

INSERT OR IGNORE INTO market_store_operations (store_id) SELECT id FROM market_stores;

INSERT OR IGNORE INTO market_customer_controls (mobile) SELECT DISTINCT mobile FROM market_orders;

INSERT OR IGNORE INTO market_settings (key,value) VALUES ('delivery_charge','20');

INSERT OR IGNORE INTO market_settings (key,value) VALUES ('maintenance_mode','false');

INSERT OR IGNORE INTO market_settings (key,value) VALUES ('currency','₹');

INSERT OR IGNORE INTO market_settings (key,value) VALUES ('cancellation_minutes','5');

INSERT OR IGNORE INTO market_settings (key,value) VALUES ('payment_timeout_minutes','15');

INSERT OR IGNORE INTO market_settings (key,value) VALUES ('order_accept_mode','MANUAL');

INSERT OR IGNORE INTO market_settings (key,value) VALUES ('support_number','8011767897');

INSERT OR IGNORE INTO market_settings (key,value) VALUES ('gst_percent','0');

INSERT OR IGNORE INTO market_settings (key,value) VALUES ('payment_gateway','COD,UPI');

INSERT OR IGNORE INTO market_settings (key,value) VALUES ('website_name','SABKA DELIVERY');

INSERT OR IGNORE INTO market_settings (key,value) VALUES ('rain_mode','false');

INSERT OR IGNORE INTO market_settings (key,value) VALUES ('upi_id','bigbull577@ybl');

INSERT OR IGNORE INTO market_settings (key,value) VALUES ('theme_primary','#c7181b');

INSERT OR IGNORE INTO market_settings (key,value) VALUES ('theme_accent','#ffc21c');

INSERT OR IGNORE INTO market_settings (key,value) VALUES ('theme_background','#fffdf7');
