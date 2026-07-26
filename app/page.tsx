import MarketHome, { type MarketCatalog } from "./market-home";

// Keep GET / free of D1 work. The client loads the persisted catalog snapshot
// from /api/market after hydration, so Cloudflare never performs the full
// catalog query while rendering the homepage.
const initialMarket: MarketCatalog = {
  stores: [],
  items: [],
  variants: [],
  deliveryFee: 20,
  maintenanceMode: false,
  supportNumber: "8011767897",
  upiId: "",
  theme: { primary: "#c7181b", accent: "#ffc21c", background: "#fffdf7" },
  websiteName: "SABKA DELIVERY",
  promotions: [],
  rewardOffers: [],
  content: [],
  categories: [],
  sections: [],
  catalogVersion: 0,
};

export default function Page() {
  return <MarketHome initialMarket={initialMarket} />;
}
