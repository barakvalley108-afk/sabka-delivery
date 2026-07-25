import { ensureControlTables } from "./control-store";

export type MarketCatalog = {
  stores: Record<string, unknown>[];
  items: Record<string, unknown>[];
  variants: Record<string, unknown>[];
  deliveryFee: number;
  maintenanceMode: boolean;
  supportNumber: string;
  upiId: string;
  theme: {
    primary: string;
    accent: string;
    background: string;
  };
  websiteName: string;
  areas: Record<string, unknown>[];
  promotions: Record<string, unknown>[];
  rewardOffers: Record<string, unknown>[];
  content: Record<string, unknown>[];
  categories: Record<string, unknown>[];
  sections: Record<string, unknown>[];
  catalogVersion: number;
};

const unavailableCatalog: MarketCatalog = {
  stores: [],
  items: [],
  variants: [],
  deliveryFee: 20,
  maintenanceMode: false,
  supportNumber: "8011767897",
  upiId: "bigbull577@ybl",
  theme: {
    primary: "#c7181b",
    accent: "#ffc21c",
    background: "#fffdf7",
  },
  websiteName: "SABKA DELIVERY",
  areas: [],
  promotions: [],
  rewardOffers: [],
  content: [
    {
      key: "branding",
      title: "SABKA DELIVERY",
      body: "Sabka order, hamari zimmedari.",
      image: "/images/sabka-delivery-logo.png",
    },
    {
      key: "homepage_banner",
      title: "Food, grocery aur electronics—sab ek jagah",
      body: "Fast, safe and reliable local delivery in Lala Bazar.",
      image: "/images/hero-food-collage.png",
    },
  ],
  categories: [],
  sections: [
    {
      key: "FOOD",
      name: "Food",
      description: "Restaurants and local favourites",
      image: "/images/hero-food-collage.png",
      icon: "🍲",
      isActive: 1,
      sortOrder: 1,
      minOrder: 0,
      deliveryCharge: 20,
    },
    {
      key: "GROCERY",
      name: "Grocery",
      description: "Daily essentials",
      image: "/images/grocery-daily-needs.png",
      icon: "🛍️",
      isActive: 1,
      sortOrder: 2,
      minOrder: 0,
      deliveryCharge: 20,
    },
    {
      key: "ELECTRONICS",
      name: "Electronics",
      description: "Mobiles, accessories and gadgets",
      image: "/images/electronics-hero.webp",
      icon: "⚡",
      isActive: 1,
      sortOrder: 3,
      minOrder: 0,
      deliveryCharge: 20,
    },
  ],
  catalogVersion: 0,
};

let lastValidCatalog: MarketCatalog | null = null;

export async function getMarketCatalog(): Promise<MarketCatalog> {
  const db = await ensureControlTables();
  const [
    storesResult,
    itemsResult,
    variantsResult,
    settings,
    areas,
    promotions,
    rewardOffers,
    content,
    categories,
    sections,
    revision,
  ] = await db.batch([
    db.prepare(
      `SELECT s.*,coalesce(ss.section_key,sp.vertical,s.type) vertical
       FROM market_stores s
       JOIN market_store_controls c ON c.store_id=s.id
       LEFT JOIN market_store_operations op ON op.store_id=s.id
       LEFT JOIN market_store_sections ss ON ss.store_id=s.id
       LEFT JOIN market_store_profiles sp ON sp.store_id=s.id
       JOIN market_sections section ON section.key=coalesce(ss.section_key,sp.vertical,s.type)
       WHERE s.is_open=1 AND c.approved=1 AND c.blocked=0 AND section.is_active=1
         AND (op.store_id IS NULL OR
           (op.opening_time<=op.closing_time AND time('now','+5 hours','+30 minutes') BETWEEN op.opening_time AND op.closing_time) OR
           (op.opening_time>op.closing_time AND (time('now','+5 hours','+30 minutes')>=op.opening_time OR time('now','+5 hours','+30 minutes')<=op.closing_time)))
       ORDER BY section.sort_order,s.name`,
    ),
    db.prepare(
      `SELECT i.* FROM market_items i
       JOIN market_stores s ON s.id=i.store_id
       LEFT JOIN market_store_sections ss ON ss.store_id=s.id
       LEFT JOIN market_store_profiles sp ON sp.store_id=s.id
       JOIN market_sections section ON section.key=coalesce(ss.section_key,sp.vertical,s.type)
       WHERE i.is_active=1 AND section.is_active=1
       ORDER BY section.sort_order,i.store_id,i.id`,
    ),
    db.prepare(
      "SELECT * FROM market_variants WHERE is_active=1 ORDER BY item_id,id",
    ),
    db.prepare("SELECT key,value FROM market_settings"),
    db.prepare(
      "SELECT * FROM market_service_areas WHERE is_active=1 ORDER BY name",
    ),
    db.prepare(
      `SELECT p.code,p.title,p.discount_type discountType,
              p.discount_value discountValue,p.min_order minOrder,
              r.max_discount maxDiscount,r.expires_at expiresAt,
              r.store_id storeId,r.first_order_only firstOrderOnly,
              p.sort_order sortOrder
       FROM market_promotions p
       LEFT JOIN market_promotion_rules r ON r.code=p.code
       WHERE p.is_active=1
         AND (r.expires_at IS NULL OR date(r.expires_at)>=date('now','+5 hours','+30 minutes'))
         AND r.user_mobile IS NULL
         AND coalesce(r.show_on_website,1)=1
       ORDER BY p.sort_order,p.created_at DESC,p.code`,
    ),
    db.prepare(
      `SELECT id,title,description,qualifying_orders qualifyingOrders,
              window_days windowDays,reward_type rewardType,min_order minOrder
       FROM market_reward_offers WHERE is_active=1 ORDER BY created_at DESC`,
    ),
    db.prepare("SELECT * FROM market_content"),
    db.prepare(
      `SELECT id,CASE WHEN name LIKE '__ALL__:%' THEN 'All' ELSE name END name,
              image,is_active isActive,sort_order sortOrder,vertical
       FROM market_categories ORDER BY vertical,sort_order,name`,
    ),
    db.prepare(
      `SELECT key,name,description,image,icon,is_active isActive,sort_order sortOrder,
              coalesce((SELECT cast(value as integer) FROM market_settings WHERE key='minimum_order_'||market_sections.key),0) minOrder,
              coalesce((SELECT cast(value as integer) FROM market_settings WHERE key='delivery_charge_'||market_sections.key),
                       (SELECT cast(value as integer) FROM market_settings WHERE key='delivery_charge'),20) deliveryCharge
       FROM market_sections WHERE is_active=1 ORDER BY sort_order,name`,
    ),
    db.prepare(
      "SELECT version,updated_at updatedAt FROM market_catalog_revision WHERE id=1",
    ),
  ]);

  const config = Object.fromEntries(
    settings.results.map((entry) => [String(entry.key), String(entry.value)]),
  );
  const catalog: MarketCatalog = {
    stores: storesResult.results,
    items: itemsResult.results,
    variants: variantsResult.results,
    deliveryFee: Number(config.delivery_charge || 20),
    maintenanceMode: config.maintenance_mode === "true",
    supportNumber: config.support_number || "8011767897",
    upiId: config.upi_id || "bigbull577@ybl",
    theme: {
      primary: config.theme_primary || "#c7181b",
      accent: config.theme_accent || "#ffc21c",
      background: config.theme_background || "#fffdf7",
    },
    websiteName: config.website_name || "SABKA DELIVERY",
    areas: areas.results,
    promotions: promotions.results,
    rewardOffers: rewardOffers.results,
    content: content.results,
    categories: categories.results,
    sections: sections.results,
    catalogVersion: Number(revision.results[0]?.version || 1),
  };
  lastValidCatalog = catalog;
  return catalog;
}

export async function getInitialMarketCatalog(): Promise<MarketCatalog> {
  try {
    return await getMarketCatalog();
  } catch {
    return lastValidCatalog || unavailableCatalog;
  }
}
