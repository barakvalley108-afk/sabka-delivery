import { ensureControlTables } from "../../../db/control-store";

export async function GET() {
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
      `SELECT s.*,
              coalesce(ss.section_key,sp.vertical,s.type) vertical,
              s.is_open isOpen,
              op.opening_time openingTime,
              op.closing_time closingTime,
              CASE
                WHEN s.is_open=1 AND (
                  op.store_id IS NULL OR
                  (
                    op.opening_time<=op.closing_time AND
                    time('now','+5 hours','+30 minutes')
                      BETWEEN op.opening_time AND op.closing_time
                  ) OR
                  (
                    op.opening_time>op.closing_time AND (
                      time('now','+5 hours','+30 minutes')>=op.opening_time OR
                      time('now','+5 hours','+30 minutes')<=op.closing_time
                    )
                  )
                )
                THEN 1
                ELSE 0
              END acceptingOrders
       FROM market_stores s
       JOIN market_store_controls c ON c.store_id=s.id
       LEFT JOIN market_store_operations op ON op.store_id=s.id
       LEFT JOIN market_store_sections ss ON ss.store_id=s.id
       LEFT JOIN market_store_profiles sp ON sp.store_id=s.id
       JOIN market_sections section
         ON section.key=coalesce(ss.section_key,sp.vertical,s.type)
       WHERE c.approved=1
         AND c.blocked=0
         AND section.is_active=1
       ORDER BY section.sort_order,s.name`,
    ),
    db.prepare(
      `SELECT i.*
       FROM market_items i
       JOIN market_stores s ON s.id=i.store_id
       JOIN market_store_controls c ON c.store_id=s.id
       LEFT JOIN market_store_sections ss ON ss.store_id=s.id
       LEFT JOIN market_store_profiles sp ON sp.store_id=s.id
       JOIN market_sections section
         ON section.key=coalesce(ss.section_key,sp.vertical,s.type)
       WHERE i.is_active=1
         AND c.approved=1
         AND c.blocked=0
         AND section.is_active=1
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
              r.store_id storeId,r.first_order_only firstOrderOnly
       FROM market_promotions p
       LEFT JOIN market_promotion_rules r ON r.code=p.code
       WHERE p.is_active=1
         AND (r.expires_at IS NULL OR date(r.expires_at)>=date('now'))
         AND r.user_mobile IS NULL
         AND coalesce(r.show_on_website,1)=1
       ORDER BY p.created_at DESC`,
    ),
    db.prepare(
      `SELECT id,title,description,qualifying_orders qualifyingOrders,
              window_days windowDays,reward_type rewardType,min_order minOrder
       FROM market_reward_offers
       WHERE is_active=1
       ORDER BY created_at DESC`,
    ),
    db.prepare("SELECT * FROM market_content"),
    db.prepare(
      `SELECT id,
              CASE WHEN name LIKE '__ALL__:%' THEN 'All' ELSE name END name,
              image,is_active isActive,sort_order sortOrder,vertical
       FROM market_categories
       ORDER BY vertical,sort_order,name`,
    ),
    db.prepare(
      `SELECT key,name,description,image,icon,
              is_active isActive,sort_order sortOrder,
              coalesce(
                (
                  SELECT cast(value as integer)
                  FROM market_settings
                  WHERE key='minimum_order_'||market_sections.key
                ),
                0
              ) minOrder,
              coalesce(
                (
                  SELECT cast(value as integer)
                  FROM market_settings
                  WHERE key='delivery_charge_'||market_sections.key
                ),
                (
                  SELECT cast(value as integer)
                  FROM market_settings
                  WHERE key='delivery_charge'
                ),
                20
              ) deliveryCharge
       FROM market_sections
       WHERE is_active=1
       ORDER BY sort_order,name`,
    ),
    db.prepare(
      `SELECT cast(version as integer) version,updated_at updatedAt
       FROM market_catalog_revision
       WHERE id=1`,
    ),
  ]);

  const config = Object.fromEntries(
    settings.results.map((entry) => [
      String(entry.key),
      String(entry.value),
    ]),
  );

  return Response.json(
    {
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
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
