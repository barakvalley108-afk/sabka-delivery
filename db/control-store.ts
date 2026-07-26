import { getMarketDatabase } from "./market-store";

<<<<<<< HEAD
/**
 * Backwards-compatible runtime accessor.
 *
 * The previous implementation bootstrapped the complete schema, triggers,
 * upgrades and seed data from request handlers. All of that work now belongs
 * to the explicit deployment migration. Runtime callers only receive env.DB.
 */
export async function ensureControlTables(): Promise<D1Database> {
  return getMarketDatabase();
=======
const controlSchema = [
  `CREATE TABLE IF NOT EXISTS market_staff_access (
  email TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK(role IN ('SUPER_ADMIN','RESTAURANT','RIDER')),
  store_id INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_store_controls (
  store_id INTEGER PRIMARY KEY,
  commission_rate REAL NOT NULL DEFAULT 18,
  approved INTEGER NOT NULL DEFAULT 1,
  blocked INTEGER NOT NULL DEFAULT 0,
  settlement_cycle TEXT NOT NULL DEFAULT 'WEEKLY',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_riders (
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
)`,
  `CREATE TABLE IF NOT EXISTS market_delivery_assignments (
  order_code TEXT PRIMARY KEY,
  rider_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  delivery_fee INTEGER NOT NULL DEFAULT 35,
  tip INTEGER NOT NULL DEFAULT 0,
  delivery_otp TEXT NOT NULL,
  accepted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivered_at TEXT
)`,
  `CREATE TABLE IF NOT EXISTS market_order_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code TEXT NOT NULL,
  status TEXT NOT NULL,
  actor_type TEXT NOT NULL DEFAULT 'SYSTEM',
  actor_id TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_promotions (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'FLAT',
  discount_value INTEGER NOT NULL,
  min_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  uses INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'ALL',
  status TEXT NOT NULL DEFAULT 'QUEUED',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_payouts (
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
)`,
  `CREATE TABLE IF NOT EXISTS market_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code TEXT NOT NULL,
  store_id INTEGER NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_panel_accounts (
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
)`,
  `CREATE TABLE IF NOT EXISTS market_panel_sessions (
  token_hash TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_login_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  success INTEGER NOT NULL,
  ip_address TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_store_operations (
  store_id INTEGER PRIMARY KEY,
  opening_time TEXT NOT NULL DEFAULT '09:00',
  closing_time TEXT NOT NULL DEFAULT '22:00',
  document_status TEXT NOT NULL DEFAULT 'PENDING',
  document_note TEXT NOT NULL DEFAULT '',
  gst_number TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_customer_controls (
  mobile TEXT PRIMARY KEY,
  is_blocked INTEGER NOT NULL DEFAULT 0,
  is_suspicious INTEGER NOT NULL DEFAULT 0,
  wallet_balance INTEGER NOT NULL DEFAULT 0,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_support_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mobile TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code TEXT,
  type TEXT NOT NULL,
  method TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  reference TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_wallet_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rider_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  order_code TEXT,
  payout_id INTEGER,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_service_areas (
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
)`,
  `CREATE TABLE IF NOT EXISTS market_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  image TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  vertical TEXT NOT NULL DEFAULT 'FOOD'
)`,
  `CREATE TABLE IF NOT EXISTS market_item_addons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1
)`,
  `CREATE TABLE IF NOT EXISTS market_item_flags (
  item_id INTEGER PRIMARY KEY,
  is_featured INTEGER NOT NULL DEFAULT 0,
  is_popular INTEGER NOT NULL DEFAULT 0
)`,
  `CREATE TABLE IF NOT EXISTS market_promotion_rules (
  code TEXT PRIMARY KEY,
  expires_at TEXT,
  user_mobile TEXT,
  store_id INTEGER,
  first_order_only INTEGER NOT NULL DEFAULT 0,
  max_discount INTEGER NOT NULL DEFAULT 0,
  auto_pause_after_use INTEGER NOT NULL DEFAULT 0,
  show_on_website INTEGER NOT NULL DEFAULT 1
)`,
  `CREATE TABLE IF NOT EXISTS market_single_coupon_claims (
  coupon_code TEXT PRIMARY KEY,
  mobile TEXT NOT NULL,
  order_code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_reward_offers (
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
)`,
  `CREATE TABLE IF NOT EXISTS market_reward_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_id INTEGER NOT NULL,
  mobile TEXT NOT NULL,
  order_code TEXT NOT NULL UNIQUE,
  cycle_number INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE INDEX IF NOT EXISTS market_reward_claims_lookup
  ON market_reward_claims (offer_id,mobile,created_at)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS market_reward_claim_cycle
  ON market_reward_claims (offer_id,mobile,cycle_number)`,
  `CREATE TABLE IF NOT EXISTS market_store_profiles (
  store_id INTEGER PRIMARY KEY,
  vertical TEXT NOT NULL DEFAULT 'FOOD' CHECK(vertical IN ('FOOD','GROCERY','ELECTRONICS')),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_sections (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '▦',
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_store_sections (
  store_id INTEGER PRIMARY KEY,
  section_key TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_admin_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_admin_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  order_code TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_review_moderation (
  review_id INTEGER PRIMARY KEY,
  is_hidden INTEGER NOT NULL DEFAULT 0,
  is_flagged INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT ''
)`,
  `CREATE TABLE IF NOT EXISTS market_rider_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rider_id INTEGER NOT NULL,
  order_code TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_content (
  key TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
];

const catalogRevisionTables = [
  "market_stores",
  "market_items",
  "market_variants",
  "market_settings",
  "market_service_areas",
  "market_categories",
  "market_promotions",
  "market_promotion_rules",
  "market_reward_offers",
  "market_content",
  "market_store_controls",
  "market_store_operations",
  "market_store_profiles",
  "market_sections",
  "market_store_sections",
] as const;

const catalogRevisionSchema = [
  `CREATE TABLE IF NOT EXISTS market_catalog_revision (
    id INTEGER PRIMARY KEY CHECK(id=1),
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  "INSERT OR IGNORE INTO market_catalog_revision (id,version) VALUES (1,1)",
  ...catalogRevisionTables.flatMap((table) =>
    (["INSERT", "UPDATE", "DELETE"] as const).map(
      (action) => `CREATE TRIGGER IF NOT EXISTS catalog_revision_${table}_${action.toLowerCase()}
        AFTER ${action} ON ${table}
        BEGIN
          UPDATE market_catalog_revision
          SET version=version+1,updated_at=CURRENT_TIMESTAMP
          WHERE id=1;
        END`,
    ),
  ),
];

async function initializeControlTables() {
  const db = await ensureMarketTables();
  await db.batch(controlSchema.map((sql) => db.prepare(sql)));
  await db.batch(catalogRevisionSchema.map((sql) => db.prepare(sql)));
  try {
    await db
      .prepare(
        "ALTER TABLE market_promotion_rules ADD COLUMN auto_pause_after_use INTEGER NOT NULL DEFAULT 0",
      )
      .run();
  } catch {}
  try {
    await db
      .prepare(
        "ALTER TABLE market_promotion_rules ADD COLUMN show_on_website INTEGER NOT NULL DEFAULT 1",
      )
      .run();
  } catch {}
  try {
    await db
      .prepare(
        "ALTER TABLE market_categories ADD COLUMN vertical TEXT NOT NULL DEFAULT 'FOOD'",
      )
      .run();
  } catch {}
  try {
    await db
      .prepare(
        "ALTER TABLE market_variants ADD COLUMN discount_percent INTEGER NOT NULL DEFAULT 0",
      )
      .run();
  } catch {}
  await db
    .prepare(
      `UPDATE market_variants
       SET discount_percent=round((price-discount_price)*100.0/price)
       WHERE discount_percent=0 AND price>0 AND discount_price IS NOT NULL
         AND discount_price<price`,
    )
    .run();
  try {
    await db
      .prepare(
        "ALTER TABLE market_panel_accounts ADD COLUMN panel_type TEXT NOT NULL DEFAULT 'STAFF'",
      )
      .run();
  } catch {}
  try {
    await db
      .prepare(
        "ALTER TABLE market_riders ADD COLUMN upi_id TEXT NOT NULL DEFAULT ''",
      )
      .run();
  } catch {}
  try {
    await db
      .prepare(
        "ALTER TABLE market_payouts ADD COLUMN upi_id TEXT NOT NULL DEFAULT ''",
      )
      .run();
  } catch {}
  try {
    await db
      .prepare(
        "ALTER TABLE market_payouts ADD COLUMN reference TEXT NOT NULL DEFAULT ''",
      )
      .run();
  } catch {}
  try {
    await db
      .prepare("ALTER TABLE market_payouts ADD COLUMN completed_at TEXT")
      .run();
  } catch {}
  await db
    .prepare(
      "INSERT OR IGNORE INTO market_store_profiles (store_id,vertical) SELECT id,type FROM market_stores",
    )
    .run();
  await db.batch([
    db.prepare(
      `INSERT OR IGNORE INTO market_sections
       (key,name,description,image,icon,is_active,sort_order)
       VALUES ('FOOD','Food','Restaurants, meals and local favourites','/images/hero-food-collage.png','🍲',1,1)`,
    ),
    db.prepare(
      `INSERT OR IGNORE INTO market_sections
       (key,name,description,image,icon,is_active,sort_order)
       VALUES ('GROCERY','Grocery','Daily essentials and fresh household needs','/images/grocery-daily-needs.png','🛍️',1,2)`,
    ),
    db.prepare(
      `INSERT OR IGNORE INTO market_sections
       (key,name,description,image,icon,is_active,sort_order)
       VALUES ('ELECTRONICS','Electronics','Mobiles, accessories, chargers and useful gadgets','','⚡',1,3)`,
    ),
    db.prepare(
      `INSERT OR IGNORE INTO market_store_sections (store_id,section_key)
       SELECT s.id,coalesce(p.vertical,s.type)
       FROM market_stores s LEFT JOIN market_store_profiles p ON p.store_id=s.id`,
    ),
  ]);
  await db
    .prepare(
      `UPDATE market_panel_accounts SET panel_type=CASE
        WHEN role='SUPER_ADMIN' THEN 'SUPER_ADMIN'
        WHEN role='RIDER' THEN 'DELIVERY'
        WHEN role='RESTAURANT' THEN coalesce((SELECT vertical FROM market_store_profiles WHERE store_id=market_panel_accounts.store_id),'RESTAURANT')
        ELSE 'STAFF' END
       WHERE panel_type='STAFF' AND role!='STAFF'`,
    )
    .run();
  await db
    .prepare(
      "INSERT OR IGNORE INTO market_store_controls (store_id,commission_rate,approved,blocked) SELECT id,18,1,0 FROM market_stores",
    )
    .run();
  await db
    .prepare(
      "INSERT OR IGNORE INTO market_store_operations (store_id) SELECT id FROM market_stores",
    )
    .run();
  await db
    .prepare(
      "INSERT OR IGNORE INTO market_customer_controls (mobile) SELECT DISTINCT mobile FROM market_orders",
    )
    .run();
  await db
    .prepare(
      "INSERT OR IGNORE INTO market_settings (key,value) VALUES ('data_preservation_v1','startup-cleanup-disabled')",
    )
    .run();
  const panelSystemV2 = await db
    .prepare("SELECT value FROM market_settings WHERE key='panel_system_v2'")
    .first<{ value: string }>();
  if (!panelSystemV2) {
    const existingOwner = await db
      .prepare(
        "SELECT username FROM market_panel_accounts WHERE role='SUPER_ADMIN' LIMIT 1",
      )
      .first<{ username: string }>();
    const statements = [
      db.prepare(
        "INSERT OR IGNORE INTO market_settings (key,value) VALUES ('panel_system_v2','ready')",
      ),
    ];
    if (!existingOwner) {
      statements.unshift(
        db
          .prepare(
            "INSERT OR IGNORE INTO market_panel_accounts (username,password_hash,role,panel_type,display_name,permissions,is_active) VALUES (?,?,?,?,?,?,1)",
          )
          .bind(
            "sabkaadmin",
            "372e38631e3d07819317a065088fb3bb02cc9ac6d25ad4990b87664d5b18db2b",
            "SUPER_ADMIN",
            "SUPER_ADMIN",
            "SABKA DELIVERY Owner",
            '["ALL"]',
          ),
      );
    }
    await db.batch(statements);
  }
  await db.batch([
    db.prepare(
      "INSERT OR IGNORE INTO market_service_areas (name,pin_code,radius_km,delivery_charge,min_order,free_delivery_above,is_active) VALUES ('Lala Bazar','788163',8,20,100,499,1)",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_service_areas (name,pin_code,radius_km,delivery_charge,min_order,free_delivery_above,is_active) VALUES ('Betlapar','788163',5,20,100,499,1)",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_categories (name,sort_order) VALUES ('Biryani & Rice',1)",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_categories (name,sort_order) VALUES ('Thali',2)",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_categories (name,sort_order) VALUES ('Momos & Fast Food',3)",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_categories (name,sort_order) VALUES ('Main Course',4)",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_categories (name,sort_order) VALUES ('Sweets & Desserts',5)",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_settings (key,value) VALUES ('delivery_charge','20')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_settings (key,value) VALUES ('maintenance_mode','false')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_settings (key,value) VALUES ('currency','₹')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_settings (key,value) VALUES ('languages','English,Hindi,Bengali')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_settings (key,value) VALUES ('cancellation_minutes','5')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_settings (key,value) VALUES ('order_accept_mode','MANUAL')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_settings (key,value) VALUES ('support_number','8011767897')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_settings (key,value) VALUES ('gst_percent','0')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_settings (key,value) VALUES ('payment_gateway','COD,UPI')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_settings (key,value) VALUES ('website_name','SABKA DELIVERY')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_settings (key,value) VALUES ('rain_mode','false')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_settings (key,value) VALUES ('upi_id','bigbull577@ybl')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_settings (key,value) VALUES ('theme_primary','#c7181b')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_settings (key,value) VALUES ('theme_accent','#ffc21c')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_settings (key,value) VALUES ('theme_background','#fffdf7')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_content (key,title,body) VALUES ('about','About SABKA DELIVERY','Local food and grocery delivery for Lala Bazar.')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_content (key,title,body) VALUES ('privacy','Privacy Policy','We protect customer and order information.')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_content (key,title,body) VALUES ('terms','Terms & Conditions','Orders are subject to restaurant availability.')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_content (key,title,body) VALUES ('faq','Frequently Asked Questions','Contact support for order help.')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_content (key,title,body,image) VALUES ('homepage_banner','Ghar ka swaad, jaldi delivery','Food and grocery delivery in Lala Bazar','/images/hero-food-collage.png')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_content (key,title,body,image) VALUES ('branding','SABKA DELIVERY','Sabka order, hamari zimmedari.','/images/sabka-delivery-logo.png')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_content (key,title,body,image) VALUES ('grocery_banner','Daily essentials, jaldi delivery','Fresh grocery, vegetables, dairy and daily needs—delivered fast in Lala Bazar.','/images/grocery-daily-needs.png')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_content (key,title,body) VALUES ('search_box','Search food or restaurant','Search grocery or store')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_content (key,title,body) VALUES ('benefit_delivery','Fast Delivery','20–35 mins')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_content (key,title,body) VALUES ('benefit_safety','Safe & Reliable','Contactless delivery')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_content (key,title,body) VALUES ('benefit_offers','Great Offers','Save more daily')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_content (key,title,body) VALUES ('categories_section','Food Categories','Categories')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_content (key,title,body) VALUES ('popular_section','Popular near you','Stores delivering now')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_content (key,title,body) VALUES ('recommended_section','Recommended dishes','Best prices today')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_content (key,title,body) VALUES ('offers_section','Offers & Coupons','Har coupon ek mobile number par sirf ek baar')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_content (key,title,body) VALUES ('electronics_section','Electronics','Mobile accessories, chargers aur useful gadgets SABKA DELIVERY par available hain.')",
    ),
    db.prepare(
      "UPDATE market_content SET body='Mobile accessories, chargers aur useful gadgets SABKA DELIVERY par available hain.' WHERE key='electronics_section' AND body LIKE '%jaldi hi%'",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_content (key,title,body) VALUES ('promise_delivery','Fast local delivery','Food and grocery across Lala Bazar')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_content (key,title,body) VALUES ('promise_safety','Safe & reliable','Verified stores and secure checkout')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_content (key,title,body) VALUES ('promise_pricing','Simple pricing','Transparent local delivery charges')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_content (key,title,body) VALUES ('footer','SABKA DELIVERY','Lala Bazar ka apna Food + Grocery delivery platform.')",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_content (key,title,body) VALUES ('contact','Contact SABKA DELIVERY','WhatsApp and support: 80117 67897')",
    ),
  ]);
  await db.batch([
    db.prepare(
      "INSERT OR IGNORE INTO market_promotions (code,title,discount_type,discount_value,min_order,is_active) VALUES ('SABKA50','Flat ₹50 OFF','FLAT',50,350,1)",
    ),
    db.prepare(
      "INSERT OR IGNORE INTO market_promotions (code,title,discount_type,discount_value,min_order,is_active) VALUES ('WELCOME20','20% OFF up to ₹60','PERCENT',20,350,1)",
    ),
    db.prepare(
      `INSERT OR IGNORE INTO market_reward_offers
       (id,title,description,qualifying_orders,window_days,reward_type,reward_value,min_order,is_active)
       VALUES (1,'5th order par free delivery','30 din mein 4 delivered orders complete karo; agle order ki delivery free.',4,30,'FREE_DELIVERY',0,100,1)`,
    ),
  ]);
  const brandUpgrade = await db
    .prepare(
      "SELECT value FROM market_settings WHERE key='brand_upgrade_sabka_v1'",
    )
    .first<{ value: string }>();
  if (!brandUpgrade) {
    await db.batch([
      db.prepare(
        "UPDATE market_settings SET value='SABKA DELIVERY' WHERE key='website_name'",
      ),
      db.prepare(
        "UPDATE market_content SET title='SABKA DELIVERY',body='Sabka order, hamari zimmedari.',image='/images/sabka-delivery-logo.png' WHERE key='branding'",
      ),
      db.prepare(
        "UPDATE market_content SET title='About SABKA DELIVERY' WHERE key='about'",
      ),
      db.prepare(
        "UPDATE market_content SET title='Contact SABKA DELIVERY' WHERE key='contact'",
      ),
      db.prepare(
        "UPDATE market_stores SET name='Sabka Fresh Mart' WHERE name='Apna Fresh Mart'",
      ),
      db.prepare(
        "UPDATE market_riders SET email=replace(email,'@apnadelivery.local','@sabkadelivery.local') WHERE email LIKE '%@apnadelivery.local'",
      ),
      db.prepare(
        "UPDATE market_promotions SET is_active=0 WHERE code='APNA50'",
      ),
      db.prepare(
        "INSERT OR IGNORE INTO market_promotions (code,title,discount_type,discount_value,min_order,is_active) VALUES ('SABKA50','Flat ₹50 OFF','FLAT',50,350,1)",
      ),
      db.prepare(
        "INSERT OR IGNORE INTO market_settings (key,value) VALUES ('brand_upgrade_sabka_v1','done')",
      ),
    ]);
  }
  const supportUpgrade = await db
    .prepare(
      "SELECT value FROM market_settings WHERE key='support_number_sabka_v1'",
    )
    .first<{ value: string }>();
  if (!supportUpgrade) {
    await db.batch([
      db.prepare(
        "UPDATE market_settings SET value='8011767897' WHERE key='support_number' AND value IN ('9402311270','94023 11270','')",
      ),
      db.prepare(
        "UPDATE market_content SET body='WhatsApp and support: 80117 67897' WHERE key='contact' AND body LIKE '%94023%'",
      ),
      db.prepare(
        "INSERT OR IGNORE INTO market_settings (key,value) VALUES ('support_number_sabka_v1','done')",
      ),
    ]);
  }
  const groceryImageUpgrade = await db
    .prepare("SELECT value FROM market_settings WHERE key='grocery_images_v1'")
    .first<{ value: string }>();
  if (!groceryImageUpgrade) {
    await db.batch([
      db.prepare(
        "UPDATE market_items SET image='/images/grocery-staples.png',emoji='' WHERE id IN (5,6)",
      ),
      db.prepare(
        "UPDATE market_items SET image='/images/grocery-vegetables.png',emoji='' WHERE id IN (7,8)",
      ),
      db.prepare(
        "UPDATE market_items SET image='/images/grocery-daily-needs.png',emoji='' WHERE id IN (9,10,11,12)",
      ),
      db.prepare(
        "INSERT OR IGNORE INTO market_settings (key,value) VALUES ('grocery_images_v1','done')",
      ),
    ]);
  }
  return db;
}

let controlDatabasePromise: ReturnType<typeof initializeControlTables> | null = null;

export async function ensureControlTables() {
  controlDatabasePromise ??= initializeControlTables();
  try {
    return await controlDatabasePromise;
  } catch (error) {
    controlDatabasePromise = null;
    throw error;
  }
>>>>>>> parent of 87acf46 (Sabka Delivery v67 verified)
}
