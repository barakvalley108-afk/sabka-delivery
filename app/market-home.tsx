"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import dynamic from "next/dynamic";
import { QRCodeSVG } from "qrcode.react";
import { useLiveRefresh } from "./components/use-live-refresh";

const OrderSuccess = dynamic(() => import("./order-success"), {
  ssr: false,
  loading: () => (
    <section className="success order-success" aria-live="polite">
      <div className="success-animation" aria-hidden="true">
        <span className="success-static-icon">✓</span>
      </div>
      <h3>Order Placed Successfully</h3>
    </section>
  ),
});

type Store = {
  id: number;
  name: string;
  type: "FOOD" | "GROCERY";
  description: string;
  address: string;
  eta: string;
  rating: number;
  image: string;
  vertical: string;
};
type Item = {
  id: number;
  store_id: number;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  image: string;
  emoji: string;
  food_type: string;
};
type Variant = {
  id: number;
  item_id: number;
  label: string;
  unit: string;
  unit_value: number;
  price: number;
  discount_price: number | null;
  discount_percent: number;
  stock_quantity: number;
};
type User = { id: number; mobile: string; name: string | null };
type TrackOrder = {
  orderCode: string;
  status: string;
  total: number;
  area: string;
  createdAt: string;
  storeName: string;
  storeType: string;
  deliveryOtp?: string | null;
  riderName?: string | null;
  riderPhone?: string | null;
  paymentMethod?: string;
  paymentStatus?: string | null;
};
type Coupon = {
  code: string;
  title: string;
  discountType: string;
  discountValue: number;
  minOrder: number;
  maxDiscount: number;
  sortOrder?: number;
};
type RewardOffer = {
  id: number;
  title: string;
  description: string;
  qualifyingOrders: number;
  windowDays: number;
  rewardType: "FREE_DELIVERY";
  minOrder: number;
};
type RewardProgress = RewardOffer & {
  completedOrders: number;
  claimCount: number;
  cycleNumber: number;
  remainingOrders: number;
  eligible: boolean;
};
type SiteContentBlock = {
  key: string;
  title: string;
  body: string;
  image: string;
};
type MarketCategory = {
  id: number;
  name: string;
  image: string;
  isActive: number;
  sortOrder: number;
  vertical: string;
};
type MarketSection = {
  key: string;
  name: string;
  description: string;
  image: string;
  icon: string;
  isActive: number;
  sortOrder: number;
  deliveryCharge?: number;
  minOrder?: number;
};
export type MarketCatalog = {
  stores: Store[];
  items: Item[];
  variants: Variant[];
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
  promotions: Coupon[];
  rewardOffers: RewardOffer[];
  content: SiteContentBlock[];
  categories: MarketCategory[];
  sections: MarketSection[];
  catalogVersion: number;
};
type ValidatedCoupon = {
  code: string;
  title: string;
  discount: number;
  subtotal: number;
  mobile: string;
  storeId: number;
};
type PendingPayment = {
  orderCode: string;
  mobile: string;
  amount: number;
  expiresAt: string;
  estimatedDelivery: string;
};
type FoodFilter = "ALL" | "VEG" | "NON_VEG";
type NavKey = string;
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const categoryImages: Record<string, string> = {
  All: "/images/hero-food-collage.png",
  "Biryani & Rice": "/images/biryani-card.png",
  Thali: "/images/hero-food.png",
  "Snacks & Fast Food": "/images/hero-food-collage.png",
  "Main Course": "/images/curry-card.png",
  "Sweets & Desserts": "/images/hero-food-collage.png",
  Biryani: "/images/biryani-card.png",
  Staples: "/images/grocery-staples.png",
  Vegetables: "/images/grocery-vegetables.png",
  Dairy: "/images/grocery-daily-needs.png",
  Drinks: "/images/grocery-daily-needs.png",
  Snacks: "/images/grocery-daily-needs.png",
};
const matchesFoodFilter = (item: Item, filter: FoodFilter) =>
  filter === "ALL" ||
  (filter === "VEG" ? item.food_type === "VEG" : item.food_type !== "VEG");
const trackingSteps = [
  "ACCEPTED",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;
const groceryTrackingSteps = [
  "ACCEPTED",
  "CONFIRMED",
  "PACKING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;
const statusLabels: Record<string, string> = {
  PAYMENT_PENDING: "Payment pending",
  PLACED: "Accepted",
  ACCEPTED: "Accepted",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  PACKING: "Packing",
  READY_FOR_PICKUP: "Ready for pickup",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};
const normalizeSearch = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const editDistance = (left: string, right: string) => {
  const rows = Array.from({ length: left.length + 1 }, (_, index) => [index]);
  for (let column = 0; column <= right.length; column += 1)
    rows[0][column] = column;
  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] +
          (left[row - 1] === right[column - 1] ? 0 : 1),
      );
    }
  }
  return rows[left.length][right.length];
};
const fuzzyMatch = (content: string, rawQuery: string) => {
  const text = normalizeSearch(content);
  const query = normalizeSearch(rawQuery);
  if (!query || text.includes(query)) return true;
  const words = text.split(" ");
  return query.split(" ").every((term) =>
    words.some((word) => {
      if (word.includes(term) || term.includes(word)) return true;
      if (term.length < 3) return false;
      const allowance = term.length >= 6 ? 2 : 1;
      return (
        Math.abs(word.length - term.length) <= allowance &&
        editDistance(word, term) <= allowance
      );
    }),
  );
};
const trackingIndex = (status: string, steps: readonly string[]) => {
  let normalized = status === "PLACED" ? "ACCEPTED" : status;
  if (normalized === "PREPARING" && steps.includes("PACKING"))
    normalized = "PACKING";
  if (normalized === "PACKING" && steps.includes("PREPARING"))
    normalized = "PREPARING";
  return steps.indexOf(normalized);
};

const marketContentMap = (blocks: SiteContentBlock[]) =>
  Object.fromEntries(blocks.map((block) => [block.key, block])) as Record<
    string,
    SiteContentBlock
  >;

export default function MarketHome({
  initialMarket,
}: {
  initialMarket: MarketCatalog;
}) {
  const initialContent = marketContentMap(initialMarket.content || []);
  const [mode, setMode] = useState("FOOD");
  const [couponList, setCouponList] = useState(initialMarket.promotions || []);
  const [rewardOffers, setRewardOffers] = useState<RewardOffer[]>(
    initialMarket.rewardOffers || [],
  );
  const [rewardProgress, setRewardProgress] = useState<RewardProgress[]>([]);
  const [rewardProgressMobile, setRewardProgressMobile] = useState("");
  const [maintenance, setMaintenance] = useState(
    !!initialMarket.maintenanceMode,
  );
  const [supportNumber, setSupportNumber] = useState(
    initialMarket.supportNumber || "8011767897",
  );
  const [upiId, setUpiId] = useState(
    initialMarket.upiId || "bigbull577@ybl",
  );
  const [theme, setTheme] = useState(
    initialMarket.theme || {
      primary: "#c7181b",
      accent: "#ffc21c",
      background: "#fffdf7",
    },
  );
  const [brandName, setBrandName] = useState(
    initialContent.branding?.title ||
      initialMarket.websiteName ||
      "SABKA DELIVERY",
  );
  const [brandLogo, setBrandLogo] = useState(
    initialContent.branding?.image || "/images/sabka-delivery-logo.png",
  );
  const [heroTitle, setHeroTitle] = useState(
    initialContent.homepage_banner?.title ||
      "Food, grocery aur electronics—sab ek jagah",
  );
  const [heroBody, setHeroBody] = useState(
    initialContent.homepage_banner?.body ||
      "Fast, safe and reliable local delivery in Lala Bazar.",
  );
  const [heroImage, setHeroImage] = useState(
    initialContent.homepage_banner?.image ||
      "/images/hero-food-collage.png",
  );
  const [siteContent, setSiteContent] = useState<
    Record<string, SiteContentBlock>
  >(initialContent);
  const [marketCategories, setMarketCategories] = useState<MarketCategory[]>(
    initialMarket.categories || [],
  );
  const [marketSections, setMarketSections] = useState<MarketSection[]>(
    initialMarket.sections || [],
  );
  const [stores, setStores] = useState<Store[]>(initialMarket.stores || []);
  const [items, setItems] = useState<Item[]>(initialMarket.items || []);
  const [variants, setVariants] = useState<Variant[]>(
    initialMarket.variants || [],
  );
  const activePricingSection = marketSections.find(
    (section) => section.key === mode,
  );
  const deliveryFee = Number(
    activePricingSection?.deliveryCharge ?? initialMarket.deliveryFee ?? 20,
  );
  const minimumOrder = Number(activePricingSection?.minOrder || 0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [foodFilter, setFoodFilter] = useState<FoodFilter>("ALL");
  const [selectedVariants, setSelectedVariants] = useState<
    Record<number, number>
  >({});
  const [cart, setCart] = useState<Record<number, number>>({});
  const [cartStore, setCartStore] = useState<number | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState<
    "cart" | "details" | "payment-pending" | "success"
  >("cart");
  const [couponCode, setCouponCode] = useState("");
  const [validatedCoupon, setValidatedCoupon] =
    useState<ValidatedCoupon | null>(null);
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [copiedCoupon, setCopiedCoupon] = useState("");
  const [checkoutMobile, setCheckoutMobile] = useState("");
  const [rewardApplied, setRewardApplied] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("25-35 min");
  const [pendingPayment, setPendingPayment] =
    useState<PendingPayment | null>(null);
  const [paymentChecking, setPaymentChecking] = useState(false);
  const paymentCheckInFlight = useRef(false);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI">("COD");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [activeNav, setActiveNav] = useState<NavKey>("home");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [appInstalled, setAppInstalled] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [challenge, setChallenge] = useState("");
  const [otp, setOtp] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyMobile, setHistoryMobile] = useState("");
  const [historyOrders, setHistoryOrders] = useState<TrackOrder[]>([]);
  const [historyError, setHistoryError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyUpdatedAt, setHistoryUpdatedAt] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const marketLoaded = useRef(initialMarket.catalogVersion > 0);
  const marketSignature = useRef(JSON.stringify(initialMarket));
  const marketVersion = useRef(Number(initialMarket.catalogVersion || 0));

  useEffect(() => {
    const source = new URLSearchParams(window.location.search).get("source");
    if (source === "android-app") {
      window.localStorage.setItem("sabka_native_shell", "1");
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setAppInstalled(window.matchMedia("(display-mode: standalone)").matches);
    });
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const installed = () => {
      setAppInstalled(true);
      setInstallPrompt(null);
      setMessage("SABKA DELIVERY app install ho gaya");
    };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  async function installApp() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setInstallPrompt(null);
      return;
    }
    setMessage("Chrome menu (⋮) kholkar ‘Install app’ ya ‘Add to Home screen’ dabao");
  }

  const loadMarket = useCallback(async () => {
    try {
      const response = await fetch("/api/market", { cache: "no-store" });
      if (!response.ok) throw new Error("Market refresh failed");
      const data = await response.json();
      marketVersion.current = Number(data.catalogVersion || 1);
      const signature = JSON.stringify(data);
      if (signature === marketSignature.current) return;
      marketSignature.current = signature;
      setStores(data.stores || []);
      setItems(data.items || []);
      setVariants(data.variants || []);
      setMaintenance(!!data.maintenanceMode);
      setSupportNumber(data.supportNumber || "8011767897");
      setUpiId(data.upiId || "bigbull577@ybl");
      if (data.theme) setTheme(data.theme);
      setBrandName(data.websiteName || "SABKA DELIVERY");
      setCouponList((data.promotions || []).map((promotion: Coupon) => promotion));
      setRewardOffers(
        (data.rewardOffers || []).map((offer: RewardOffer) => offer),
      );
      setMarketCategories(data.categories || []);
      if (data.sections?.length) setMarketSections(data.sections);
      const content = marketContentMap(data.content || []);
      setSiteContent(content);
      setBrandName(
        content.branding?.title || data.websiteName || "SABKA DELIVERY",
      );
      setBrandLogo(
        content.branding?.image || "/images/sabka-delivery-logo.png",
      );
      setHeroTitle(
        content.homepage_banner?.title ||
          "Food, grocery aur electronics—sab ek jagah",
      );
      setHeroBody(
        content.homepage_banner?.body ||
          "Fast, safe and reliable local delivery in Lala Bazar.",
      );
      setHeroImage(
        content.homepage_banner?.image || "/images/hero-food-collage.png",
      );
      marketLoaded.current = true;
    } catch {
      if (!marketLoaded.current) setMessage("Catalog load nahi hua");
    }
  }, []);

  const refreshMarket = useCallback(async () => {
    if (!marketLoaded.current) {
      await loadMarket();
      return;
    }
    try {
      const response = await fetch("/api/market-version", {
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = await response.json();
      if (Number(data.version || 1) !== marketVersion.current) {
        await loadMarket();
      }
    } catch {
      // Keep the current catalog visible while the live revision check reconnects.
    }
  }, [loadMarket]);

  // Catalog revisions are lightweight and do not need order-speed polling.
  useLiveRefresh(refreshMarket, 5000);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => setUser(data.user || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (checkout !== "details" || checkoutMobile.length !== 10) return;
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/market-rewards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: checkoutMobile }),
          cache: "no-store",
        });
        const data = await response.json();
        if (active && response.ok) {
          setRewardProgress(data.offers || []);
          setRewardProgressMobile(checkoutMobile);
        }
      } catch {
        // Checkout remains usable when the live reward check reconnects.
      }
    };
    const first = window.setTimeout(refresh, 250);
    const timer = window.setInterval(refresh, 15000);
    return () => {
      active = false;
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [checkout, checkoutMobile]);

  const checkPendingPayment = useCallback(async () => {
    if (!pendingPayment || paymentCheckInFlight.current) return;
    paymentCheckInFlight.current = true;
    setPaymentChecking(true);
    try {
      const response = await fetch("/api/market-payment-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderCode: pendingPayment.orderCode,
          mobile: pendingPayment.mobile,
        }),
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Payment status verify nahi hua");

      if (data.order?.confirmed) {
        setOrderCode(data.order.orderCode);
        setEstimatedDelivery(
          data.order.estimatedDelivery || pendingPayment.estimatedDelivery,
        );
        setCart({});
        setCartStore(null);
        setCouponCode("");
        setValidatedCoupon(null);
        setCouponMessage("");
        setPendingPayment(null);
        setCheckout("success");
        return;
      }

      const orderStatus = String(data.order?.orderStatus || "");
      const paymentStatus = String(data.order?.paymentStatus || "");
      if (
        orderStatus === "CANCELLED" ||
        ["FAILED", "CANCELLED"].includes(paymentStatus)
      ) {
        setPendingPayment(null);
        setCheckout("details");
        setMessage("Online payment complete nahi hua. Order cancel ho gaya.");
      }
    } catch {
      // A transient status error must not turn a pending payment into success.
    } finally {
      paymentCheckInFlight.current = false;
      setPaymentChecking(false);
    }
  }, [pendingPayment]);

  useEffect(() => {
    if (checkout !== "payment-pending" || !pendingPayment) return;
    const first = window.setTimeout(() => {
      void checkPendingPayment();
    }, 0);
    const timer = window.setInterval(() => {
      void checkPendingPayment();
    }, 3_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [checkout, pendingPayment, checkPendingPayment]);

  const contentValue = (
    key: string,
    field: "title" | "body" | "image",
    fallback: string,
  ) => siteContent[key]?.[field] || fallback;

  const activeSection =
    marketSections.find((section) => section.key === mode) || marketSections[0];

  const modeStores = useMemo(
    () => stores.filter((s) => (s.vertical || s.type) === mode),
    [stores, mode],
  );
  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        const store = stores.find((s) => s.id === item.store_id);
        const hasSearch = normalizeSearch(search).length > 0;
        return (
          (store?.vertical || store?.type) === mode &&
          (hasSearch || !selectedStore || item.store_id === selectedStore) &&
          (hasSearch || category === "All" || item.category === category) &&
          (mode !== "FOOD" || matchesFoodFilter(item, foodFilter)) &&
          fuzzyMatch(
            `${item.name} ${item.description} ${item.category} ${item.subcategory} ${store?.name}`,
            search,
          )
        );
      }),
    [items, stores, mode, selectedStore, category, foodFilter, search],
  );
  const categories = useMemo(() => {
    const configured = new Map(
      marketCategories
        .filter((entry) => entry.vertical === mode)
        .map((entry) => [entry.name.trim().toLowerCase(), entry]),
    );
    const names = Array.from(
      new Set(
        items
          .filter(
            (item) =>
              (stores.find((store) => store.id === item.store_id)?.vertical || stores.find((store) => store.id === item.store_id)?.type) === mode &&
              (mode !== "FOOD" || matchesFoodFilter(item, foodFilter)),
          )
          .map((item) => item.category),
      ),
    )
      .filter((name) => configured.get(name.trim().toLowerCase())?.isActive !== 0)
      .sort((left, right) => {
        const leftConfig = configured.get(left.trim().toLowerCase());
        const rightConfig = configured.get(right.trim().toLowerCase());
        return (
          (leftConfig?.sortOrder ?? 999) - (rightConfig?.sortOrder ?? 999) ||
          left.localeCompare(right)
        );
      });
    return ["All", ...names];
  }, [items, stores, mode, foodFilter, marketCategories]);
  const categoryImageFor = useCallback(
    (name: string) =>
      marketCategories.find(
        (entry) =>
          entry.vertical === mode &&
          entry.name.trim().toLowerCase() === name.trim().toLowerCase() &&
          entry.isActive !== 0,
      )?.image ||
      categoryImages[name] ||
      "/images/hero-food-collage.png",
    [marketCategories, mode],
  );
  const searchSuggestions = useMemo(() => {
    if (normalizeSearch(search).length < 2) return [];
    return items
      .filter((item) => {
        const store = stores.find((entry) => entry.id === item.store_id);
        return (
          (store?.vertical || store?.type) === mode &&
          (mode !== "FOOD" || matchesFoodFilter(item, foodFilter)) &&
          fuzzyMatch(
            `${item.name} ${item.description} ${item.category} ${store?.name}`,
            search,
          )
        );
      })
      .slice(0, 5);
  }, [items, stores, mode, foodFilter, search]);
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartRows = Object.entries(cart)
    .map(([id, quantity]) => {
      const variant = variants.find((v) => v.id === Number(id));
      const item = items.find((i) => i.id === variant?.item_id);
      return variant && item ? { variant, item, quantity } : null;
    })
    .filter(Boolean) as { variant: Variant; item: Item; quantity: number }[];
  const subtotal = cartRows.reduce(
    (sum, row) =>
      sum + (row.variant.discount_price ?? row.variant.price) * row.quantity,
    0,
  );
  const activeCoupon =
    validatedCoupon &&
    validatedCoupon.subtotal === subtotal &&
    validatedCoupon.mobile === checkoutMobile &&
    validatedCoupon.storeId === cartStore &&
    validatedCoupon.code === couponCode.trim().toUpperCase()
      ? validatedCoupon.code
      : "";
  const discount = activeCoupon ? validatedCoupon?.discount || 0 : 0;
  const eligibleReward = rewardProgress.find(
    (offer) =>
      rewardProgressMobile === checkoutMobile &&
      offer.eligible &&
      offer.rewardType === "FREE_DELIVERY" &&
      subtotal >= offer.minOrder,
  );
  const checkoutDeliveryFee = eligibleReward ? 0 : deliveryFee;
  const total = Math.max(0, subtotal + checkoutDeliveryFee - discount);
  const minimumPayableBeforeDiscount = subtotal + deliveryFee;
  const minimumOrderShortfall = Math.max(
    0,
    minimumOrder - minimumPayableBeforeDiscount,
  );
  const minimumOrderMet = minimumOrderShortfall === 0;
  const buildUpiPaymentUrl = (amount: number, note: string) =>
    `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(brandName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
  const upiPaymentUrl = buildUpiPaymentUrl(
    total,
    "SABKA DELIVERY order payment",
  );

  function openInstalledUpiApps(paymentUrl = upiPaymentUrl) {
    const nativeShell =
      /Android/i.test(navigator.userAgent) &&
      window.localStorage.getItem("sabka_native_shell") === "1";
    window.location.href = nativeShell
      ? paymentUrl.replace("upi://", "sabka-upi://")
      : paymentUrl;
  }

  function switchMode(next: string) {
    setMode(next);
    setSelectedStore(null);
    setCategory("All");
    setFoodFilter("ALL");
    setSearch("");
    setActiveNav(next.toLowerCase());
    window.setTimeout(() => {
      if (next !== "FOOD") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      document
        .querySelector(".main-content")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }
  function goHome() {
    setMode("FOOD");
    setSelectedStore(null);
    setCategory("All");
    setFoodFilter("ALL");
    setSearch("");
    setActiveNav("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function goSection(key: NavKey, selector: string) {
    setActiveNav(key);
    window.setTimeout(
      () => document.querySelector(selector)?.scrollIntoView({ behavior: "smooth" }),
      0,
    );
  }
  function openHistory() {
    setActiveNav("history");
    setHistoryOpen(true);
    const knownMobile = user?.mobile || historyMobile;
    if (knownMobile) setHistoryMobile(knownMobile);
    if (knownMobile.length === 10) void fetchHistory(knownMobile);
  }
  function openSupport() {
    setActiveNav("support");
    setSupportOpen(true);
  }
  function chooseFoodFilter(next: FoodFilter) {
    setFoodFilter(next);
    setCategory("All");
    setSelectedStore(null);
  }
  async function copyCouponCode(code: string) {
    try {
      let copied = false;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(code);
          copied = true;
        } catch {
          // Older browsers and non-secure previews can still use the selection fallback.
        }
      }
      if (!copied) {
        const field = document.createElement("textarea");
        field.value = code;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        copied = document.execCommand("copy");
        field.remove();
      }
      if (!copied) throw new Error("Clipboard unavailable");
      setCopiedCoupon(code);
      window.setTimeout(
        () => setCopiedCoupon((current) => (current === code ? "" : current)),
        1800,
      );
    } catch {
      setMessage("Coupon copy nahi hua—code manually select karo");
      window.setTimeout(() => setMessage(""), 2200);
    }
  }

  function updateCouponCode(value: string) {
    setValidatedCoupon(null);
    setCouponMessage("");
    setCouponCode(
      value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 20),
    );
  }

  async function applyManualCoupon() {
    const code = couponCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,20}$/.test(code)) {
      setValidatedCoupon(null);
      setCouponMessage("Invalid coupon");
      return;
    }
    setCouponCode(code);
    setValidatedCoupon(null);
    setCouponMessage("");
    setCouponValidating(true);
    try {
      const response = await fetch("/api/market-coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          mobile: checkoutMobile,
          storeId: cartStore,
          items: cart,
        }),
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Coupon validate nahi hua");
      }
      setCouponCode(data.coupon.code);
      setValidatedCoupon({
        ...data.coupon,
        mobile: checkoutMobile,
        storeId: Number(cartStore),
      });
      setCouponMessage(
        `✓ ${data.coupon.code} applied — ₹${data.coupon.discount} saved`,
      );
    } catch (error) {
      setCouponMessage(
        error instanceof Error ? error.message : "Coupon validate nahi hua",
      );
    } finally {
      setCouponValidating(false);
    }
  }
  function pickVariant(item: Item) {
    const options = variants.filter(
      (v) => v.item_id === item.id && v.stock_quantity > 0,
    );
    return (
      options.find((v) => v.id === selectedVariants[item.id]) || options[0]
    );
  }
  function addItem(item: Item) {
    const variant = pickVariant(item);
    if (!variant) return;
    if (cartStore && cartStore !== item.store_id && cartCount) {
      if (
        !window.confirm(
          "Dusre store ka cart start karne par current cart clear ho jayega. Continue?",
        )
      )
        return;
      setCart({});
    }
    setCartStore(item.store_id);
    setCart((current) => ({
      ...current,
      [variant.id]: (current[variant.id] || 0) + 1,
    }));
    setMessage(`${item.name} cart mein add hua`);
    window.setTimeout(() => setMessage(""), 1800);
  }
  function changeQty(id: number, change: number) {
    setCart((current) => {
      const next = { ...current };
      const qty = (next[id] || 0) + change;
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      if (!Object.keys(next).length) setCartStore(null);
      return next;
    });
  }

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPlacing(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/market-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: form.get("mobile"),
          customerName: form.get("name"),
          storeId: cartStore,
          address: form.get("address"),
          paymentMethod: form.get("payment"),
          couponCode: activeCoupon,
          rewardOfferId: eligibleReward?.id || null,
          items: cart,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Order place nahi hua");
      const orderMobile = String(form.get("mobile") || "");
      setOrderCode(data.order.orderCode);
      setEstimatedDelivery(data.order.estimatedDelivery || "25-35 min");
      setRewardApplied(data.order.rewardOffer?.title || "");
      setHistoryMobile(orderMobile);

      if (data.order.confirmed) {
        setCart({});
        setCartStore(null);
        setCouponCode("");
        setValidatedCoupon(null);
        setCouponMessage("");
        setPendingPayment(null);
        setCheckout("success");
      } else if (
        data.order.status === "PAYMENT_PENDING" &&
        data.order.paymentStatus === "PENDING"
      ) {
        const payment = {
          orderCode: data.order.orderCode,
          mobile: orderMobile,
          amount: Number(data.order.total),
          expiresAt: String(data.order.expiresAt || ""),
          estimatedDelivery:
            data.order.estimatedDelivery || "25-35 min",
        };
        setPendingPayment(payment);
        setCheckout("payment-pending");
        openInstalledUpiApps(
          buildUpiPaymentUrl(
            payment.amount,
            `SABKA DELIVERY ${payment.orderCode}`,
          ),
        );
      } else {
        throw new Error("Order payment verification pending hai");
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Order place nahi hua",
      );
    } finally {
      setPlacing(false);
    }
  }

  async function sendOtp() {
    setAuthLoading(true);
    setAuthMessage("");
    try {
      const response = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "OTP send nahi hua");
      setChallenge(data.challengeId);
      setAuthMessage("OTP SMS bhej diya gaya");
    } catch (error) {
      setAuthMessage(
        error instanceof Error ? error.message : "OTP send nahi hua",
      );
    } finally {
      setAuthLoading(false);
    }
  }
  async function verifyOtp() {
    setAuthLoading(true);
    setAuthMessage("");
    try {
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: challenge, mobile, otp, name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "OTP verify nahi hua");
      setUser(data.user);
      setLoginOpen(false);
      setChallenge("");
      setOtp("");
    } catch (error) {
      setAuthMessage(
        error instanceof Error ? error.message : "OTP verify nahi hua",
      );
    } finally {
      setAuthLoading(false);
    }
  }
  async function fetchHistory(searchValue: string) {
    const cleanSearch = searchValue.trim();

    if (!cleanSearch) {
      setHistoryError("Mobile number ya Order ID daalo");
      setHistoryOrders([]);
      return;
    }

    setHistoryLoading(true);
    setHistoryError("");
    setHistoryOrders([]);
    try {
      const response = await fetch("/api/market-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ search: cleanSearch }),
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "History load nahi hui");
      setHistoryOrders(data.orders || []);
      setHistoryUpdatedAt(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
      if (!data.orders?.length) {
        setHistoryError("Is Mobile Number ya Order ID se koi order nahi mila.");
      }
    } catch (error) {
      setHistoryError(
        error instanceof Error ? error.message : "History load nahi hui",
      );
    } finally {
      setHistoryLoading(false);
    }
  }
  async function loadHistory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetchHistory(historyMobile);
  }
  useEffect(() => {
    const currentSearch = historyMobile.trim();
    if (!historyOpen || currentSearch.length < 3) return;
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/market-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ search: currentSearch }),
          cache: "no-store",
        });
        const data = await response.json();
        if (!active || !response.ok) return;
        setHistoryOrders(data.orders || []);
        setHistoryError("");
        setHistoryUpdatedAt(
          new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        );
      } catch {
        // Keep the current tracking information visible while reconnecting.
      }
    };
    const wake = () => {
      if (!document.hidden) void refresh();
    };
    const timer = window.setInterval(refresh, 4000);
    window.addEventListener("focus", wake);
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", wake);
      window.removeEventListener("online", wake);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [historyMobile, historyOpen]);
  async function cancelHistoryOrder(order: TrackOrder) {
    let verificationMobile = historyMobile.trim();
    if (!/^\d{10}$/.test(verificationMobile)) {
      verificationMobile =
        window.prompt(
          "Order cancel karne ke liye wahi 10-digit mobile number daalo jisse order kiya tha:",
        )?.replace(/\D/g, "") || "";
    }
    if (!/^\d{10}$/.test(verificationMobile)) {
      setHistoryError("Cancel karne ke liye valid 10-digit mobile number zaroori hai.");
      return;
    }
    if (!window.confirm("Kya aap is order ko cancel karna chahte hain?"))
      return;
    setCancelling(true);
    setHistoryError("");
    try {
      const response = await fetch("/api/market-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderCode: order.orderCode,
          mobile: verificationMobile,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Order cancel nahi hua");
      setHistoryOrders((rows) =>
        rows.map((row) =>
          row.orderCode === order.orderCode
            ? { ...row, status: "CANCELLED" }
            : row,
        ),
      );
    } catch (error) {
      setHistoryError(
        error instanceof Error ? error.message : "Order cancel nahi hua",
      );
    } finally {
      setCancelling(false);
    }
  }

  return (
    <main
      className={`apna-app ${mode === "FOOD" ? "royal-food-app" : mode === "ELECTRONICS" ? "electronics-theme-app" : "grocery-light-app"}`}
      style={
        {
          "--ref-red": theme.primary,
          "--red": theme.primary,
          "--ref-yellow": theme.accent,
          "--yellow": theme.accent,
          "--ref-cream": theme.background,
          "--cream": theme.background,
        } as CSSProperties
      }
    >
      {maintenance && (
        <div className="maintenance-screen">
          <img src="/images/sabka-delivery-logo.png" alt="Sabka Delivery" />
          <h1>SABKA DELIVERY</h1>
          <h2>Maintenance chal raha hai</h2>
          <p>
            Website ko improve kiya ja raha hai. Thodi der baad dobara try karo.
          </p>
        </div>
      )}
      <header className="app-header">
        <button className="logo" onClick={goHome}>
          <span className="brand-mark">
            <img src={brandLogo} alt="Sabka Delivery logo" />
          </span>
          <span className="brand-copy">
            <b>Sabka Delivery</b>
            <small>Food • Grocery • Electronics</small>
          </span>
        </button>
        <button className="location-pill">
          <i>●</i>
          <span>
            <small>Delivering in</small>Lala Bazar
          </span>
          <b>⌄</b>
        </button>
        <div className="header-modes">
          {marketSections.map((section) => (
            <button
              className={mode === section.key ? "active" : ""}
              onClick={() => switchMode(section.key)}
              key={section.key}
            >
              {section.icon} {section.name}
            </button>
          ))}
        </div>
        <nav>
          <button
            className={activeNav === "home" ? "active" : ""}
            onClick={goHome}
          >
            Home
          </button>
          <button
            className={activeNav === "restaurants" ? "active" : ""}
            onClick={() => goSection("restaurants", ".stores-title")}
          >
            Restaurants
          </button>
          <button
            className={activeNav === "offers" ? "active" : ""}
            onClick={() => goSection("offers", ".offers-section")}
          >
            Offers
          </button>
          <button
            className={activeNav === "history" ? "active" : ""}
            onClick={openHistory}
          >
            Order History
          </button>
          <button
            className={activeNav === "support" ? "active" : ""}
            onClick={openSupport}
          >
            Support
          </button>
          {mode === "FOOD" && (
            <button
              className="veg-switch"
              role="switch"
              aria-checked={foodFilter === "VEG"}
              onClick={() =>
                chooseFoodFilter(foodFilter === "VEG" ? "ALL" : "VEG")
              }
            >
              <b>VEG</b>
              <i>
                <span />
              </i>
            </button>
          )}
          <button
            className="header-cart"
            onClick={() => {
              setCheckout("cart");
              setCartOpen(true);
            }}
          >
            🛒 <span>View cart</span> <b>{cartCount}</b>
          </button>
          {!appInstalled && (
            <button className="install-app-button" onClick={installApp}>
              ↓ <span>Install App</span>
            </button>
          )}
        </nav>
      </header>

      <section className={`hero ${mode.toLowerCase()}`}>
        <div>
          <span className="hero-tag">
            {mode === "FOOD"
              ? "PREMIUM QUALITY · FAST DELIVERY"
              : `${activeSection?.name || mode} · LOCAL DELIVERY`}
          </span>
          <h1>
            {mode === "FOOD" ? (
              heroTitle.includes(",") ? (
                <>
                  <span>{heroTitle.split(",")[0]},</span>
                  <br />
                  <em>{heroTitle.split(",").slice(1).join(",").trim()}</em>
                </>
              ) : (
                <em>{heroTitle}</em>
              )
            ) : (
              <>
                {mode === "GROCERY"
                  ? contentValue(
                      "grocery_banner",
                      "title",
                      "Daily essentials, jaldi delivery",
                    )
                  : activeSection?.name || mode}
              </>
            )}
          </h1>
          <p>
            {mode === "FOOD"
              ? heroBody
              : mode === "GROCERY"
                ? contentValue(
                    "grocery_banner",
                    "body",
                    "Fresh grocery, vegetables, dairy and daily needs—delivered fast in Lala Bazar.",
                  )
                : activeSection?.description ||
                  `${activeSection?.name || mode} products delivered across Lala Bazar.`}
          </p>
          <div className="hero-search-wrap">
            <label className="hero-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  mode === "FOOD"
                    ? contentValue(
                        "search_box",
                        "title",
                        "Search food or restaurant",
                      )
                    : `Search ${(activeSection?.name || mode).toLowerCase()} or store`
                }
              />
              <button
                type="button"
                onClick={() =>
                  document
                    .querySelector(".products-title")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                ⌕
              </button>
            </label>
            {searchSuggestions.length > 0 && (
              <div className="search-suggestions">
                <small>Did you mean?</small>
                {searchSuggestions.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setSearch(item.name);
                      setCategory("All");
                      setSelectedStore(null);
                      document
                        .querySelector(".products-title")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    {item.image ? <img src={item.image} alt="" /> : <i>⌕</i>}
                    <span>
                      <b>{item.name}</b>
                      <small>{item.category}</small>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="hero-points">
            <span>
              {contentValue("benefit_delivery", "image", "") ? (
                <img
                  src={contentValue("benefit_delivery", "image", "")}
                  alt=""
                />
              ) : (
                "🛵"
              )}{" "}
              <b>
                {contentValue("benefit_delivery", "title", "Fast Delivery")}
              </b>
              <small>
                {contentValue("benefit_delivery", "body", "20–35 mins")}
              </small>
            </span>
            <span>
              {contentValue("benefit_safety", "image", "") ? (
                <img src={contentValue("benefit_safety", "image", "")} alt="" />
              ) : (
                "◆"
              )}{" "}
              <b>
                {contentValue("benefit_safety", "title", "Safe & Reliable")}
              </b>
              <small>
                {contentValue("benefit_safety", "body", "Contactless delivery")}
              </small>
            </span>
            <span>
              {contentValue("benefit_offers", "image", "") ? (
                <img src={contentValue("benefit_offers", "image", "")} alt="" />
              ) : (
                "%"
              )}{" "}
              <b>{contentValue("benefit_offers", "title", "Great Offers")}</b>
              <small>
                {contentValue("benefit_offers", "body", "Save more daily")}
              </small>
            </span>
          </div>
        </div>
        <div
          className="hero-art"
          style={
            mode === "FOOD"
              ? { backgroundImage: `url(${heroImage})` }
              : {
                  backgroundImage: `url(${mode === "GROCERY" ? contentValue("grocery_banner", "image", "/images/grocery-daily-needs.png") : mode === "ELECTRONICS" ? "/images/electronics-hero.webp" : activeSection?.image || "/images/grocery-daily-needs.png"})`,
                }
          }
        >
          {mode === "GROCERY" && (
            <img
              className="grocery-poster-image"
              src={contentValue(
                "grocery_banner",
                "image",
                "/images/grocery-daily-needs.png",
              )}
              alt={contentValue(
                "grocery_banner",
                "title",
                "Sabka Delivery grocery poster",
              )}
            />
          )}
          <span className="lala-badge">
            LALA
            <br />
            BAZAR ♥
          </span>
        </div>
      </section>

      <section className="main-content">
        <div className="section-title">
          <div>
            <small>
              {mode === "FOOD"
                ? "DISCOVER LOCAL TASTE"
                : `SHOP ${activeSection?.name?.toUpperCase() || mode}`}
            </small>
            <h2>
              {mode === "FOOD"
                ? foodFilter === "VEG"
                  ? "Veg Categories"
                  : foodFilter === "NON_VEG"
                    ? "Non‑Veg Categories"
                    : contentValue(
                        "categories_section",
                        "title",
                        "Food Categories",
                      )
                : `${activeSection?.name || mode} Categories`}
            </h2>
          </div>
          {selectedStore ? (
            <button onClick={() => setSelectedStore(null)}>
              View all stores ×
            </button>
          ) : (
            <button onClick={() => setCategory("All")}>View all ›</button>
          )}
        </div>
        {mode === "FOOD" && (
          <div
            className="food-filter-tabs"
            role="group"
            aria-label="Food preference"
          >
            <button
              className={foodFilter === "ALL" ? "active" : ""}
              onClick={() => chooseFoodFilter("ALL")}
            >
              <i className="all-mark" />
              All Menu
            </button>
            <button
              className={foodFilter === "VEG" ? "active veg" : ""}
              onClick={() => chooseFoodFilter("VEG")}
            >
              <i className="veg-mark" />
              Veg Menu
            </button>
            <button
              className={foodFilter === "NON_VEG" ? "active nonveg" : ""}
              onClick={() => chooseFoodFilter("NON_VEG")}
            >
              <i className="nonveg-mark" />
              Non‑Veg Menu
            </button>
          </div>
        )}
        <div className="category-row">
          {categories.map((c) => (
            <button
              className={category === c ? "active" : ""}
              onClick={() => setCategory(c)}
              key={c}
            >
              <span
                className="category-image"
                style={{
                  backgroundImage: `url(${categoryImageFor(c)})`,
                }}
              />
              {c}
            </button>
          ))}
        </div>

        <div className="section-title stores-title">
          <h2>
            {mode === "FOOD"
              ? contentValue("popular_section", "title", "Popular near you")
              : `${activeSection?.name || mode} stores`}
          </h2>
          <button onClick={() => setSelectedStore(null)}>View all ›</button>
        </div>
        <div className="store-row">
          {modeStores.map((store) => (
            <button
              className={
                selectedStore === store.id
                  ? "store-card selected"
                  : "store-card"
              }
              onClick={() => setSelectedStore(store.id)}
              key={store.id}
            >
              <div style={{ backgroundImage: `url(${store.image})` }}>
                <span>{activeSection?.name || store.vertical || store.type}</span>
              </div>
              <section>
                <h3>{store.name}</h3>
                <p>{store.description}</p>
                <small>
                  ★ {store.rating} · {store.eta}
                </small>
              </section>
            </button>
          ))}
        </div>

        <div className="section-title products-title">
          <h2>
            {selectedStore
              ? stores.find((s) => s.id === selectedStore)?.name
              : mode === "FOOD"
                ? foodFilter === "VEG"
                  ? "Recommended veg dishes"
                  : foodFilter === "NON_VEG"
                    ? "Recommended non‑veg dishes"
                    : contentValue(
                        "recommended_section",
                        "title",
                        "Recommended dishes",
                      )
                : `${activeSection?.name || mode} items`}
          </h2>
          <span>{visibleItems.length} items</span>
        </div>
        <div className="product-grid">
          {visibleItems.map((item) => {
            const options = variants.filter((v) => v.item_id === item.id);
            const variant = pickVariant(item);
            return (
              <article className="product-card" key={item.id}>
                <div
                  className="product-visual"
                  style={
                    item.image ? { backgroundImage: `url(${item.image})` } : {}
                  }
                >
                  <span>
                    {item.image
                      ? ""
                      : mode === "GROCERY"
                        ? "PRODUCT"
                        : item.emoji}
                  </span>
                  {item.food_type !== "VEG" && <i className="nonveg">▲</i>}
                  {item.food_type === "VEG" && <i className="veg">●</i>}
                  {!!variant?.discount_percent && (
                    <b className="item-discount-badge">{variant.discount_percent}% OFF</b>
                  )}
                </div>
                <div className="product-info">
                  <small>
                    {stores.find((s) => s.id === item.store_id)?.name}
                  </small>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  {options.length > 1 ? (
                    <select
                      value={variant?.id || ""}
                      onChange={(e) =>
                        setSelectedVariants((x) => ({
                          ...x,
                          [item.id]: Number(e.target.value),
                        }))
                      }
                    >
                      {options.map((v) => (
                        <option value={v.id} key={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="variant-label">{variant?.label}</span>
                  )}
                  <div className="price-row">
                    <div>
                      {!!variant?.discount_percent && <del>₹{variant.price}</del>}
                      <b>₹{variant?.discount_price ?? variant?.price}</b>
                    </div>
                    {variant && variant.stock_quantity > 0 ? (
                      <button onClick={() => addItem(item)}>ADD</button>
                    ) : (
                      <button disabled>OUT</button>
                    )}
                  </div>
                  {variant &&
                    variant.stock_quantity <= 5 &&
                    variant.stock_quantity > 0 && (
                      <small className="stock-low">
                        Only {variant.stock_quantity} left
                      </small>
                    )}
                </div>
              </article>
            );
          })}
        </div>
        {!visibleItems.length && (
          <div className="empty">
            <span>⌕</span>
            <h3>Koi item nahi mila</h3>
            <button
              onClick={() => {
                setSearch("");
                setCategory("All");
                setSelectedStore(null);
                setFoodFilter("ALL");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      <section className="offers-section">
        <div className="section-title">
          <div>
            <small>EXCLUSIVE SAVINGS</small>
            <h2>
              {contentValue("offers_section", "title", "Offers & Coupons")}
            </h2>
          </div>
          <span>
            {contentValue(
              "offers_section",
              "body",
              "Har coupon ek mobile number par sirf ek baar",
            )}
          </span>
        </div>
        <div className="offer-group-title">
          <div>
            <small>AUTOMATIC · NO CODE</small>
            <h3>Loyalty offers</h3>
          </div>
          <span>Mobile number se automatically apply</span>
        </div>
        <div className="reward-grid">
          {rewardOffers.map((offer) => (
            <article key={offer.id}>
              <i>★</i>
              <div>
                <small>FREE DELIVERY REWARD</small>
                <h3>{offer.title}</h3>
                <p>{offer.description}</p>
                <b>
                  {offer.qualifyingOrders} orders · {offer.windowDays} days
                </b>
              </div>
              <span>AUTO</span>
            </article>
          ))}
        </div>
        <div className="offer-group-title coupon-group-title">
          <div>
            <small>ENTER CODE AT CHECKOUT</small>
            <h3>Coupons</h3>
          </div>
          <span>One use per mobile</span>
        </div>
        <div className="offer-grid coupon-offer-grid">
          {couponList.map((c) => (
            <article key={c.code}>
              <div>
                <small>SABKA DELIVERY COUPON</small>
                <h3>{c.title}</h3>
                <p>
                  Minimum order ₹{c.minOrder}
                  {c.maxDiscount ? ` · Max ₹${c.maxDiscount}` : ""}
                </p>
              </div>
              <aside>
                <code>{c.code}</code>
                <button
                  type="button"
                  className={copiedCoupon === c.code ? "selected" : ""}
                  onClick={() => void copyCouponCode(c.code)}
                >
                  {copiedCoupon === c.code ? "Copied ✓" : "Copy code"}
                </button>
              </aside>
            </article>
          ))}
        </div>
      </section>
      <section className="promise">
        <div>
          <span>
            {contentValue("promise_delivery", "image", "") ? (
              <img src={contentValue("promise_delivery", "image", "")} alt="" />
            ) : (
              "🛵"
            )}
          </span>
          <b>
            {contentValue("promise_delivery", "title", "Fast local delivery")}
          </b>
          <small>
            {contentValue(
              "promise_delivery",
              "body",
              "Food and grocery across Lala Bazar",
            )}
          </small>
        </div>
        <div>
          <span>
            {contentValue("promise_safety", "image", "") ? (
              <img src={contentValue("promise_safety", "image", "")} alt="" />
            ) : (
              "🛡️"
            )}
          </span>
          <b>{contentValue("promise_safety", "title", "Safe & reliable")}</b>
          <small>
            {contentValue(
              "promise_safety",
              "body",
              "Verified stores and secure checkout",
            )}
          </small>
        </div>
        <div>
          <span>
            {contentValue("promise_pricing", "image", "") ? (
              <img src={contentValue("promise_pricing", "image", "")} alt="" />
            ) : (
              "₹"
            )}
          </span>
          <b>{contentValue("promise_pricing", "title", "Simple pricing")}</b>
          <small>
            {contentValue(
              "promise_pricing",
              "body",
              `From ₹${deliveryFee} delivery charge`,
            )}
          </small>
        </div>
      </section>
      <footer>
        <b>
          <img src={contentValue("footer", "image", brandLogo)} alt="" />{" "}
          {contentValue("footer", "title", brandName)}
        </b>
        <p>
          {contentValue(
            "footer",
            "body",
            "Lala Bazar ka apna Food + Grocery delivery platform.",
          )}
        </p>
        <div className="footer-legal">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms</a>
        </div>
        <button onClick={openSupport}>
          WhatsApp Support · {supportNumber}
        </button>
      </footer>
      <div
        className="mobile-nav"
        style={{ gridTemplateColumns: `repeat(${marketSections.length + 2}, minmax(68px, 1fr))` }}
      >
        <button
          className={activeNav === "home" ? "active" : ""}
          onClick={goHome}
        >
          ⌂<small>Home</small>
        </button>
        {marketSections.map((section) => (
          <button
            className={activeNav === section.key.toLowerCase() ? "active" : ""}
            onClick={() => switchMode(section.key)}
            key={section.key}
          >
            {section.icon}<small>{section.name}</small>
          </button>
        ))}
        <button
          className={activeNav === "history" ? "active" : ""}
          onClick={openHistory}
        >
          ▤<small>History</small>
        </button>
      </div>
      {!cartOpen && (
        <div className="customer-fabs">
          {!appInstalled && <button className="install-app-fab" onClick={installApp}>↓ Install App</button>}
          <a
            className="whatsapp-fab"
            href={`https://wa.me/91${supportNumber}?text=Hello%20Sabka%20Delivery%2C%20mujhe%20support%20chahiye`}
            target="_blank"
            rel="noreferrer"
            aria-label="Chat with Sabka Delivery support on WhatsApp"
          >
            WhatsApp
          </a>
        </div>
      )}
      {message && <div className="toast">{message}</div>}

      {cartOpen && (
        <div className="overlay" onClick={() => setCartOpen(false)}>
          <aside className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <header>
              <div>
                <small>
                  {checkout === "cart"
                    ? "YOUR CART"
                    : checkout === "details"
                      ? "CHECKOUT"
                      : checkout === "payment-pending"
                        ? "PAYMENT VERIFICATION"
                        : "ORDER CONFIRMED"}
                </small>
                <h2>
                  {checkout === "cart"
                    ? stores.find((s) => s.id === cartStore)?.name ||
                      "Sabka Cart"
                    : checkout === "details"
                      ? "Delivery details"
                      : checkout === "payment-pending"
                        ? "Payment pending"
                        : "Thank you!"}
                </h2>
              </div>
              <button onClick={() => setCartOpen(false)}>×</button>
            </header>
            {checkout === "success" ? (
              <OrderSuccess
                orderCode={orderCode}
                estimatedDelivery={estimatedDelivery}
                rewardApplied={rewardApplied}
                onTrackOrder={() => {
                  setCartOpen(false);
                  openHistory();
                  if (historyMobile.length === 10)
                    void fetchHistory(historyMobile);
                }}
                onContinueShopping={() => {
                  setCheckout("cart");
                  setCartOpen(false);
                  goHome();
                }}
              />
            ) : checkout === "payment-pending" && pendingPayment ? (
              <section className="payment-verification-pending" aria-live="polite">
                <span aria-hidden="true">⌛</span>
                <h3>Payment Verification Pending</h3>
                <p>
                  Order ID: <b>{pendingPayment.orderCode}</b>
                </p>
                <p>
                  Backend payment confirm hone ke baad hi order place hoga.
                </p>
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      openInstalledUpiApps(
                        buildUpiPaymentUrl(
                          pendingPayment.amount,
                          `SABKA DELIVERY ${pendingPayment.orderCode}`,
                        ),
                      )
                    }
                  >
                    Open UPI App
                  </button>
                  <button
                    type="button"
                    disabled={paymentChecking}
                    onClick={() => void checkPendingPayment()}
                  >
                    {paymentChecking ? "Checking…" : "Check Payment Status"}
                  </button>
                </div>
                {pendingPayment.expiresAt ? (
                  <small>
                    Pending payment automatically cancel hoga after{" "}
                    {new Date(pendingPayment.expiresAt).toLocaleTimeString(
                      "en-IN",
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                    .
                  </small>
                ) : null}
              </section>
            ) : checkout === "details" ? (
              <form className="checkout-form" onSubmit={placeOrder}>
                <button type="button" onClick={() => setCheckout("cart")}>
                  ← Back to cart
                </button>
                <label>
                  Name
                  <input
                    name="name"
                    required
                    minLength={2}
                    defaultValue={user?.name || ""}
                    placeholder="Customer name"
                  />
                </label>
                <label>
                  Mobile
                  <input
                    name="mobile"
                    required
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={checkoutMobile}
                    onChange={(event) => {
                      setCheckoutMobile(
                        event.target.value.replace(/\D/g, "").slice(0, 10),
                      );
                      setValidatedCoupon(null);
                      setCouponMessage("");
                    }}
                    placeholder="10-digit number"
                  />
                </label>
                <label>
                  Address
                  <textarea
                    name="address"
                    required
                    minLength={8}
                    placeholder="House, road, landmark"
                  />
                </label>
                <section className="checkout-reward">
                  <strong>Automatic offers</strong>
                  {checkoutMobile.length !== 10 ? (
                    <small>Mobile number daalo—reward automatically check hoga.</small>
                  ) : rewardProgressMobile === checkoutMobile &&
                    rewardProgress.length ? (
                    rewardProgress.map((offer) => (
                      <div className={offer.eligible ? "unlocked" : ""} key={offer.id}>
                        <span>★</span>
                        <p>
                          <b>{offer.title}</b>
                          <small>
                            {offer.eligible
                              ? subtotal >= offer.minOrder
                                ? "Unlocked · delivery charge ₹0"
                                : `Unlocked · minimum ₹${offer.minOrder} order`
                              : `${offer.remainingOrders} aur delivered order ke baad unlock`}
                          </small>
                        </p>
                      </div>
                    ))
                  ) : (
                    <small>Reward progress check ho raha hai…</small>
                  )}
                </section>
                <section className="checkout-coupons">
                  <strong>Apply coupon</strong>
                  <small>One use per mobile</small>
                  <div className="manual-coupon">
                    <input
                      value={couponCode}
                      onChange={(event) => updateCouponCode(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void applyManualCoupon();
                        }
                      }}
                      placeholder="Enter coupon code"
                    />
                    <button
                      type="button"
                      onClick={() => void applyManualCoupon()}
                      disabled={couponValidating}
                    >
                      {couponValidating ? "Checking…" : "Apply"}
                    </button>
                  </div>
                  {couponMessage && (
                    <p className={activeCoupon ? "coupon-applied" : ""}>
                      {couponMessage}
                    </p>
                  )}
                </section>
                <fieldset>
                  <legend>Payment</legend>
                  <label>
                    <input
                      type="radio"
                      name="payment"
                      value="COD"
                      checked={paymentMethod === "COD"}
                      onChange={() => setPaymentMethod("COD")}
                    />{" "}
                    Cash on Delivery
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="payment"
                      value="UPI"
                      checked={paymentMethod === "UPI"}
                      onChange={() => setPaymentMethod("UPI")}
                    />{" "}
                    UPI
                  </label>
                </fieldset>
                {paymentMethod === "UPI" && (
                  <section className="upi-payment-box">
                    <QRCodeSVG
                      value={upiPaymentUrl}
                      title={`Pay ₹${total} to ${upiId}`}
                      size={145}
                      bgColor="#ffffff"
                      fgColor="#15100e"
                      level="M"
                    />
                    <div>
                      <small>SCAN & PAY EXACT AMOUNT</small>
                      <h3>₹{total}</h3>
                      <p>
                        UPI ID: <b>{upiId}</b>
                      </p>
                      <button
                        type="button"
                        className="open-upi-app"
                        onClick={() => openInstalledUpiApps()}
                      >
                        Open installed UPI apps
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard?.writeText(upiId);
                          setMessage("UPI ID copied");
                          window.setTimeout(() => setMessage(""), 1800);
                        }}
                      >
                        Copy UPI ID
                      </button>
                    </div>
                  </section>
                )}
                <div className="checkout-total">
                  <span>
                    Payable total
                    {discount > 0 ? <small>You saved ₹{discount}</small> : null}
                  </span>
                  <b>₹{total}</b>
                </div>
                <button className="place-order" disabled={placing}>
                  {placing ? "Placing order…" : `Place order · ₹${total}`}
                </button>
              </form>
            ) : cartCount === 0 ? (
              <div className="empty-cart">
                <span>🛒</span>
                <h3>Cart khaali hai</h3>
                <button onClick={() => setCartOpen(false)}>
                  Explore items
                </button>
              </div>
            ) : (
              <>
                <div className="cart-lines">
                  {cartRows.map((row) => (
                    <article key={row.variant.id}>
                      <div>
                        <b>{row.item.name}</b>
                        <small>{row.variant.label}</small>
                        <strong>
                          ₹{row.variant.discount_price ?? row.variant.price}
                        </strong>
                      </div>
                      <div>
                        <button onClick={() => changeQty(row.variant.id, -1)}>
                          −
                        </button>
                        <b>{row.quantity}</b>
                        <button onClick={() => changeQty(row.variant.id, 1)}>
                          +
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="bill">
                  <p>
                    <span>Subtotal</span>
                    <b>₹{subtotal}</b>
                  </p>
                  <p>
                    <span>Delivery fee</span>
                    <b>
                      {checkoutDeliveryFee === 0 && deliveryFee > 0 ? (
                        <><s>₹{deliveryFee}</s> FREE</>
                      ) : (
                        `₹${checkoutDeliveryFee}`
                      )}
                    </b>
                  </p>
                  {discount > 0 && (
                    <p className="discount-line">
                      <span>Coupon ({activeCoupon})</span>
                      <b>−₹{discount}</b>
                    </p>
                  )}
                  <p>
                    <span>Total</span>
                    <b>₹{total}</b>
                  </p>
                  <p
                    className={`minimum-order-note ${minimumOrderMet ? "met" : "pending"}`}
                  >
                    <span>Minimum payable total</span>
                    <b>
                      {minimumOrderMet
                        ? `₹${minimumOrder} reached ✓`
                        : `₹${minimumOrderShortfall} more`}
                    </b>
                  </p>
                </div>
                <button
                  className="checkout-button"
                  disabled={!minimumOrderMet}
                  onClick={() => {
                    if (!checkoutMobile && user?.mobile)
                      setCheckoutMobile(user.mobile);
                    setCheckout("details");
                  }}
                >
                  {minimumOrderMet ? "Proceed to checkout" : `Add ₹${minimumOrderShortfall} more`}{" "}
                  <span>₹{total} →</span>
                </button>
              </>
            )}
          </aside>
        </div>
      )}

      {loginOpen && (
        <div className="overlay" onClick={() => setLoginOpen(false)}>
          <section
            className="modal login-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <div>
                <small>OTP LOGIN</small>
                <h2>Welcome to SABKA DELIVERY</h2>
              </div>
              <button onClick={() => setLoginOpen(false)}>×</button>
            </header>
            <p>Password nahi chahiye—mobile number par OTP aayega.</p>
            <label>
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </label>
            <label>
              Mobile number
              <input
                value={mobile}
                onChange={(e) =>
                  setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="10-digit number"
                inputMode="numeric"
              />
            </label>
            {challenge && (
              <label>
                6-digit OTP
                <input
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="••••••"
                  inputMode="numeric"
                />
              </label>
            )}
            {authMessage && <p className="form-message">{authMessage}</p>}
            <button
              className="primary"
              disabled={authLoading}
              onClick={challenge ? verifyOtp : sendOtp}
            >
              {authLoading
                ? "Please wait…"
                : challenge
                  ? "Verify & Login"
                  : "Send OTP"}
            </button>
          </section>
        </div>
      )}

      {historyOpen && (
        <div className="overlay" onClick={() => setHistoryOpen(false)}>
          <section
            className="modal history-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <div>
                <small>YOUR ORDERS</small>
                <h2>Order History</h2>
                <span className="tracking-live">
                  <i /> LIVE · AUTO REFRESH
                  {historyUpdatedAt ? ` · ${historyUpdatedAt}` : ""}
                </span>
              </div>
              <button onClick={() => setHistoryOpen(false)}>×</button>
            </header>
            <p>Mobile number ya Order ID daalkar apna order check karein.</p>
            <form onSubmit={loadHistory}>
              <label>
                Mobile Number or Order ID
                <input
                  type="text"
                  value={historyMobile}
                  onChange={(e) =>
                    setHistoryMobile(e.target.value.slice(0, 40))
                  }
                  required
                  placeholder="Enter mobile number or Order ID"
                  autoComplete="off"
                />
              </label>
              <button className="primary" disabled={historyLoading}>
                {historyLoading ? "Loading…" : "Show my orders"}
              </button>
            </form>
            {historyError && <p className="form-message">{historyError}</p>}
            {!historyLoading && historyOrders.length > 0 && (
              <div className="history-list">
                {historyOrders.map((order) => {
                  const orderSteps =
                    order.storeType === "FOOD"
                      ? trackingSteps
                      : groceryTrackingSteps;
                  const shownStatus =
                    order.storeType !== "FOOD" && order.status === "PREPARING"
                      ? "PACKING"
                      : order.status;
                  const currentIndex = trackingIndex(order.status, orderSteps);
                  const cancellable = [
                    "PAYMENT_PENDING",
                    "PLACED",
                    "ACCEPTED",
                  ].includes(order.status);
                  return (
                    <article key={order.orderCode}>
                      <div className="history-order-head">
                        <div>
                          <span
                            className={`history-status s-${shownStatus.toLowerCase()}`}
                          >
                            {statusLabels[shownStatus] ||
                              shownStatus.replaceAll("_", " ")}
                          </span>
                          <h3>{order.orderCode}</h3>
                          <p>
                            {order.storeName} ·{" "}
                            {new Date(order.createdAt).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="history-payment">
                          <b>₹{order.total}</b>
                          <small>
                            {order.paymentMethod || "PAYMENT"} ·{" "}
                            {order.paymentStatus || "PENDING"}
                          </small>
                        </div>
                      </div>
                      {order.status === "CANCELLED" ? (
                        <div className="track-note cancelled-note">
                          × Yeh order cancel ho chuka hai.
                        </div>
                      ) : (
                        <>
                          <div className="tracking-timeline">
                            {orderSteps.map((step, index) => {
                              const done = currentIndex >= index;
                              return (
                                <div
                                  className={done ? "step done" : "step"}
                                  key={step}
                                >
                                  <i>{done ? "✓" : index + 1}</i>
                                  <small>{statusLabels[step]}</small>
                                  {index < orderSteps.length - 1 && <b />}
                                </div>
                              );
                            })}
                          </div>
                          <div className="track-note">
                            ⓘ{" "}
                            {order.status === "OUT_FOR_DELIVERY"
                              ? "Delivery partner aapka order lekar nikal chuka hai."
                              : order.status === "DELIVERED"
                                ? "Order successfully deliver ho gaya."
                                : "Delivery executive details order out for delivery hone par dikhenge."}
                          </div>
                          {order.status === "OUT_FOR_DELIVERY" &&
                            order.deliveryOtp && (
                              <div className="delivery-otp-box">
                                <span>DELIVERY OTP</span>
                                <strong>{order.deliveryOtp}</strong>
                                <small>
                                  Order milne ke baad hi rider ko yeh OTP batayein.
                                </small>
                              </div>
                            )}
                          {order.status === "OUT_FOR_DELIVERY" &&
                            order.riderPhone && (
                              <div className="delivery-partner-contact">
                                <span>
                                  <small>DELIVERY PARTNER</small>
                                  <b>{order.riderName || "Your rider"}</b>
                                </span>
                                <a href={`tel:${order.riderPhone}`}>
                                  Call · {order.riderPhone}
                                </a>
                              </div>
                            )}
                        </>
                      )}
                      {cancellable && (
                        <div className="cancel-order-box">
                          <p>
                            Order <b>Confirmed</b> hone se pehle hi cancel kiya
                            ja sakta hai.
                          </p>
                          <button
                            onClick={() => cancelHistoryOrder(order)}
                            disabled={cancelling}
                          >
                            {cancelling ? "Cancelling…" : "Cancel order"}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
            {!historyLoading &&
              !historyError &&
              historyOrders.length === 0 &&
              historyMobile.trim().length > 0 && (
                <div className="history-empty">
                  Order history dekhne ke liye button dabao.
                </div>
              )}
          </section>
        </div>
      )}

      {supportOpen && (
        <div className="overlay" onClick={() => setSupportOpen(false)}>
          <section
            className="modal support-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <div>
                <small>NEED HELP?</small>
                <h2>Sabka Delivery Support</h2>
              </div>
              <button onClick={() => setSupportOpen(false)}>×</button>
            </header>
            <div className="support-icon">☎</div>
            <h3>Order ya payment mein help chahiye?</h3>
            <p>WhatsApp par hamari support team se baat karo.</p>
            <a
              href={`https://wa.me/91${supportNumber}?text=Hello%20Sabka%20Delivery%2C%20mujhe%20support%20chahiye`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp · {supportNumber}
            </a>
            <small>Support available for Lala Bazar orders.</small>
          </section>
        </div>
      )}
    </main>
  );
}
