import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderCode: text("order_code").notNull().unique(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  area: text("area").notNull(),
  paymentMethod: text("payment_method").notNull(),
  itemsJson: text("items_json").notNull(),
  subtotal: integer("subtotal").notNull(),
  deliveryFee: integer("delivery_fee").notNull().default(20),
  total: integer("total").notNull(),
  status: text("status").notNull().default("PLACED"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const menuItems = sqliteTable("menu_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  restaurant: text("restaurant").notNull(),
  name: text("name").notNull().unique(),
  description: text("description").notNull().default(""),
  category: text("category").notNull(),
  price: integer("price").notNull(),
  isAvailable: integer("is_available", {mode: "boolean"}).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const couponClaims = sqliteTable("market_coupon_claims", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mobile: text("mobile").notNull(),
  couponCode: text("coupon_code").notNull(),
  orderCode: text("order_code").notNull().unique(),
  discount: integer("discount").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("market_coupon_claims_mobile_code_unique").on(table.mobile, table.couponCode)]);

export const staffAccess = sqliteTable("market_staff_access", {
  email: text("email").primaryKey(), role: text("role").notNull(),
  storeId: integer("store_id"), isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const storeControls = sqliteTable("market_store_controls", {
  storeId: integer("store_id").primaryKey(), commissionRate: real("commission_rate").notNull().default(18),
  approved: integer("approved").notNull().default(1), blocked: integer("blocked").notNull().default(0),
  settlementCycle: text("settlement_cycle").notNull().default("WEEKLY"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const riders = sqliteTable("market_riders", {
  id: integer("id").primaryKey({autoIncrement:true}), email: text("email").notNull().unique(),
  name: text("name").notNull(), phone: text("phone").notNull(), isOnline: integer("is_online").notNull().default(0),
  documentStatus: text("document_status").notNull().default("PENDING"), bankAccountMasked: text("bank_account_masked").notNull().default(""),
  upiId: text("upi_id").notNull().default(""),
  weeklyPayout: integer("weekly_payout").notNull().default(0), codCollection: integer("cod_collection").notNull().default(0),
  latitude: real("latitude"), longitude: real("longitude"), updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const deliveryAssignments = sqliteTable("market_delivery_assignments", {
  orderCode: text("order_code").primaryKey(), riderId: integer("rider_id").notNull(), status: text("status").notNull().default("ACTIVE"),
  deliveryFee: integer("delivery_fee").notNull().default(35), tip: integer("tip").notNull().default(0), deliveryOtp: text("delivery_otp").notNull(),
  acceptedAt: text("accepted_at").notNull().default(sql`CURRENT_TIMESTAMP`), deliveredAt: text("delivered_at"),
});

export const orderStatusHistory = sqliteTable("market_order_status_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderCode: text("order_code").notNull(),
  status: text("status").notNull(),
  actorType: text("actor_type").notNull().default("SYSTEM"),
  actorId: text("actor_id").notNull().default(""),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const promotions = sqliteTable("market_promotions", {
  code: text("code").primaryKey(), title: text("title").notNull(), discountType: text("discount_type").notNull().default("FLAT"),
  discountValue: integer("discount_value").notNull(), minOrder: integer("min_order").notNull().default(0),
  isActive: integer("is_active").notNull().default(1), uses: integer("uses").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const campaigns = sqliteTable("market_campaigns", {
  id: integer("id").primaryKey({autoIncrement:true}), channel: text("channel").notNull(), title: text("title").notNull(),
  message: text("message").notNull(), audience: text("audience").notNull().default("ALL"), status: text("status").notNull().default("QUEUED"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const payouts = sqliteTable("market_payouts", {
  id: integer("id").primaryKey({autoIncrement:true}), payeeType: text("payee_type").notNull(), payeeId: integer("payee_id").notNull(),
  period: text("period").notNull(), amount: integer("amount").notNull(), status: text("status").notNull().default("PENDING"),
  upiId: text("upi_id").notNull().default(""), reference: text("reference").notNull().default(""),
  completedAt: text("completed_at"), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const reviews = sqliteTable("market_reviews", {
  id: integer("id").primaryKey({autoIncrement:true}), orderCode: text("order_code").notNull(), storeId: integer("store_id").notNull(),
  rating: integer("rating").notNull(), comment: text("comment").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const panelAccounts = sqliteTable("market_panel_accounts", {
  username:text("username").primaryKey(),passwordHash:text("password_hash").notNull(),role:text("role").notNull(),displayName:text("display_name").notNull(),storeId:integer("store_id"),riderId:integer("rider_id"),permissions:text("permissions").notNull().default("[]"),isActive:integer("is_active").notNull().default(1),twoFactorEnabled:integer("two_factor_enabled").notNull().default(0),twoFactorHash:text("two_factor_hash"),lastLogin:text("last_login"),createdAt:text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
export const panelSessions = sqliteTable("market_panel_sessions", {tokenHash:text("token_hash").primaryKey(),username:text("username").notNull(),expiresAt:text("expires_at").notNull(),createdAt:text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)});
export const loginActivity = sqliteTable("market_login_activity", {id:integer("id").primaryKey({autoIncrement:true}),username:text("username").notNull(),success:integer("success").notNull(),ipAddress:text("ip_address").notNull().default(""),userAgent:text("user_agent").notNull().default(""),createdAt:text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)});
export const storeOperations = sqliteTable("market_store_operations", {storeId:integer("store_id").primaryKey(),openingTime:text("opening_time").notNull().default("09:00"),closingTime:text("closing_time").notNull().default("22:00"),documentStatus:text("document_status").notNull().default("PENDING"),documentNote:text("document_note").notNull().default(""),gstNumber:text("gst_number").notNull().default(""),updatedAt:text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)});
export const customerControls = sqliteTable("market_customer_controls", {mobile:text("mobile").primaryKey(),isBlocked:integer("is_blocked").notNull().default(0),isSuspicious:integer("is_suspicious").notNull().default(0),walletBalance:integer("wallet_balance").notNull().default(0),loyaltyPoints:integer("loyalty_points").notNull().default(0),note:text("note").notNull().default(""),updatedAt:text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)});
export const supportTickets = sqliteTable("market_support_tickets", {id:integer("id").primaryKey({autoIncrement:true}),mobile:text("mobile").notNull(),subject:text("subject").notNull(),message:text("message").notNull(),status:text("status").notNull().default("OPEN"),createdAt:text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)});
export const transactions = sqliteTable("market_transactions", {id:integer("id").primaryKey({autoIncrement:true}),orderCode:text("order_code"),type:text("type").notNull(),method:text("method").notNull(),amount:integer("amount").notNull(),status:text("status").notNull().default("PENDING"),reference:text("reference").notNull().default(""),createdAt:text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)});
export const walletTransactions = sqliteTable("market_wallet_transactions", {id:integer("id").primaryKey({autoIncrement:true}),riderId:integer("rider_id").notNull(),type:text("type").notNull(),amount:integer("amount").notNull(),balanceAfter:integer("balance_after").notNull(),orderCode:text("order_code"),payoutId:integer("payout_id"),note:text("note").notNull().default(""),createdAt:text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)});
export const serviceAreas = sqliteTable("market_service_areas", {id:integer("id").primaryKey({autoIncrement:true}),name:text("name").notNull().unique(),pinCode:text("pin_code").notNull().default(""),radiusKm:real("radius_km").notNull().default(5),deliveryCharge:integer("delivery_charge").notNull().default(20),minOrder:integer("min_order").notNull().default(100),freeDeliveryAbove:integer("free_delivery_above").notNull().default(9999),nightCharge:integer("night_charge").notNull().default(0),rainCharge:integer("rain_charge").notNull().default(0),isActive:integer("is_active").notNull().default(1)});
export const categories = sqliteTable("market_categories", {id:integer("id").primaryKey({autoIncrement:true}),name:text("name").notNull().unique(),image:text("image").notNull().default(""),isActive:integer("is_active").notNull().default(1),sortOrder:integer("sort_order").notNull().default(0)});
export const itemAddons = sqliteTable("market_item_addons", {id:integer("id").primaryKey({autoIncrement:true}),itemId:integer("item_id").notNull(),name:text("name").notNull(),price:integer("price").notNull().default(0),isActive:integer("is_active").notNull().default(1)});
export const itemFlags = sqliteTable("market_item_flags", {itemId:integer("item_id").primaryKey(),isFeatured:integer("is_featured").notNull().default(0),isPopular:integer("is_popular").notNull().default(0)});
export const promotionRules = sqliteTable("market_promotion_rules", {code:text("code").primaryKey(),expiresAt:text("expires_at"),userMobile:text("user_mobile"),storeId:integer("store_id"),firstOrderOnly:integer("first_order_only").notNull().default(0),maxDiscount:integer("max_discount").notNull().default(0),autoPauseAfterUse:integer("auto_pause_after_use").notNull().default(0),showOnWebsite:integer("show_on_website").notNull().default(1)});
export const singleCouponClaims = sqliteTable("market_single_coupon_claims", {couponCode:text("coupon_code").primaryKey(),mobile:text("mobile").notNull(),orderCode:text("order_code").notNull().unique(),createdAt:text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)});
export const reviewModeration = sqliteTable("market_review_moderation", {reviewId:integer("review_id").primaryKey(),isHidden:integer("is_hidden").notNull().default(0),isFlagged:integer("is_flagged").notNull().default(0),note:text("note").notNull().default("")});
export const riderReviews = sqliteTable("market_rider_reviews", {id:integer("id").primaryKey({autoIncrement:true}),riderId:integer("rider_id").notNull(),orderCode:text("order_code").notNull(),rating:integer("rating").notNull(),comment:text("comment").notNull().default(""),createdAt:text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)});
export const content = sqliteTable("market_content", {key:text("key").primaryKey(),title:text("title").notNull().default(""),body:text("body").notNull().default(""),image:text("image").notNull().default(""),updatedAt:text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)});
export const marketSettings = sqliteTable("market_settings", {key:text("key").primaryKey(),value:text("value").notNull(),updatedAt:text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)});
