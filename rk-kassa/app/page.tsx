"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cashierStateRef, categoryStateRef, collection, deleteDoc, doc, firestore, getDoc, getDocs, kassaStateRef, onSnapshot, salesCollectionRef, setDoc } from "./lib/supabase";

type Subcategory = { id: string; name: string; staticPrice?: number };
type Product = { id: number; name: string; icon: number; color: string; subcategories: Subcategory[]; image?: string; hidden?: boolean };
type SaleLine = { name: string; price: number; qty: number };
type PaymentMethod = "Swish" | "Kontant" | "Banköverföring";
type Sale = { id: number; time: string; payment: PaymentMethod; lines: SaleLine[]; kind?: "sale" | "refund"; reason?: string; cashier?: string; sessionId?: string };
type DayRecord = { id?: string; date: string; closedAt: number };
type Cashier = { id: number; name: string; icon?: "woman" | "man" };
type AuthUser = { id: string; username: string; role: "admin" | "cashier" };
type StoredUser = { id: string; username: string; role: "admin" | "cashier"; isActive: boolean; lastLoginAt?: number };
type LoginEvent = { username: string; at: number };

// Lägg enkelt till fler varor här när den riktiga produktlistan är klar.
const PASTEL_COLORS = ["#f6b8b8", "#f7e58d", "#b9dfae", "#afcff2", "#f3b6d2", "#d5b08a", "#f3c08a", "#cdb7e9", "#9eddd7", "#c4e7cf", "#f2a99a", "#d7e89b", "#b7e1f2", "#ded0f0", "#e5d3ac", "#ced4d6"];
const PASTEL_COLOR_NAMES = ["Röd", "Gul", "Grön", "Blå", "Rosa", "Brun", "Orange", "Lila", "Turkos", "Mint", "Korall", "Lime", "Himmelsblå", "Lavendel", "Sand", "Grå"];
const DEFAULT_CASHIERS: Cashier[] = [{ id: 1, name: "Kassör 1", icon: "woman" }];
const cashierIcon = (cashier: Cashier) => cashier.icon === "man" ? "👨" : "👩";
const DEFAULT_PRODUCTS: Product[] = [
  { id: 1, name: "Hushåll", icon: 40, color: PASTEL_COLORS[0], subcategories: [{ id: "glas", name: "Glas" }, { id: "tallrikar", name: "Tallrikar" }] },
  { id: 2, name: "Barn", icon: 27, color: PASTEL_COLORS[1], subcategories: [] },
  { id: 3, name: "Böcker", icon: 29, color: PASTEL_COLORS[2], subcategories: [] },
  { id: 4, name: "Textil", icon: 16, color: PASTEL_COLORS[3], subcategories: [] },
  { id: 5, name: "Fika", icon: 35, color: PASTEL_COLORS[5], subcategories: [] },
];
const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const iconPosition = (icon: number) => ({ backgroundImage: `url('${assetPath(`category-icons/${icon % 54}.png`)}')`, backgroundPosition: "center", backgroundSize: "contain" });

const money = (value: number) => `${new Intl.NumberFormat("sv-SE").format(value)} kr`;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Rensa", "0", "⌫"];
const PENDING_SALES_KEY = "rk-kassa-pending-sales";
const PENDING_CASHIERS_KEY = "rk-kassa-pending-cashiers";
const LEGACY_FIREBASE_CATEGORY_URL = "https://firestore.googleapis.com/v1/projects/rk-kassa/databases/(default)/documents/rk-kassa/categories?key=AIzaSyCKeSgETR8ELP39fDpMt5mZzYcJSn_UFII";
const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const sessionIdForDate = (date: Date) => `${dayKey(date)}-pass-${date.getTime()}`;
const saleTotal = (sale: Sale) => (sale.kind === "refund" ? -1 : 1) * sale.lines.reduce((sum, line) => sum + line.price * (line.qty || 1), 0);
const dayLabel = (key: string) => new Intl.DateTimeFormat("sv-SE", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(new Date(`${key}T12:00:00`));
const normalizeSubcategories = (items: Array<string | Subcategory> = []): Subcategory[] => items.map((item) => typeof item === "string" ? { id: item.toLowerCase().replace(/\s+/g, "-"), name: item } : item);
const INITIAL_ADMIN = { username: "finalworld", passwordHash: "246c892dfd8141fbcc6bb50900ac30ec9ea0097931a44b77cef5dbc6d4d1b37b" };
const memberRef = (username: string) => doc(firestore, "medlemmar", username.toLowerCase().trim());
const passwordHash = async (username: string, password: string) => {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${username.toLowerCase().trim()}:${password}`));
  return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

function StatsCard({ title, rows, unit, moneyOnly = false }: { title: string; rows: { name: string; revenue: number; units: number }[]; unit?: string; moneyOnly?: boolean }) {
  const visible = rows.slice(0, 8);
  const highest = Math.max(...visible.map((row) => row.revenue), 1);
  return <article className="stats-card"><h2>{title}</h2>{!visible.length ? <p>Inga poster ännu.</p> : <ol>{visible.map((row) => <li key={row.name}><div><strong>{row.name}</strong><span>{moneyOnly ? money(row.revenue) : `${row.units} ${unit || "st"} · ${money(row.revenue)}`}</span></div><i><b style={{ width: `${Math.max(8, Math.round(row.revenue / highest * 100))}%` }}/></i></li>)}</ol>}</article>;
}

function DonutChart({ cash, swish }: { cash: number; swish: number }) {
  const total = Math.max(0, cash) + Math.max(0, swish);
  const cashPercent = total ? Math.round(Math.max(0, cash) / total * 100) : 0;
  return <div className="payment-donut-wrap"><div className="payment-donut" style={{ background: `conic-gradient(#c96547 0 ${cashPercent}%, #9dbb89 ${cashPercent}% 100%)` }}><div><strong>{total ? `${cashPercent}%` : "–"}</strong><small>kontant</small></div></div><div className="payment-legend"><span><i className="cash"/>Kontant <b>{money(cash)}</b></span><span><i className="swish"/>Swish <b>{money(swish)}</b></span></div></div>;
}

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [hasLoadedRemote, setHasLoadedRemote] = useState(false);
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [userLoginLog, setUserLoginLog] = useState<Record<string, number>>({});
  const [loginEvents, setLoginEvents] = useState<LoginEvent[]>([]);
  const [manageUsers, setManageUsers] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "cashier">("cashier");
  const [passwordUser, setPasswordUser] = useState<StoredUser | null>(null);
  const [replacementPassword, setReplacementPassword] = useState("");
  const [view, setView] = useState<"home" | "sale" | "history" | "days" | "manage" | "sort" | "stats" | "user-log">("home");
  const [statsRange, setStatsRange] = useState<"30" | "90" | "all">("all");
  const [statsMonth, setStatsMonth] = useState("all");
  const [statsDay, setStatsDay] = useState("all");
  const [statsFrom, setStatsFrom] = useState("");
  const [statsTo, setStatsTo] = useState("");
  const [menu, setMenu] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const [choosingSubcategory, setChoosingSubcategory] = useState(false);
  const [price, setPrice] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [cart, setCart] = useState<SaleLine[]>([]);
  const [returningSaleId, setReturningSaleId] = useState<number | null>(null);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [payment, setPayment] = useState<"Swish" | "Kontant" | null>(null);
  const [savingSale, setSavingSale] = useState(false);
  const [swishConfirm, setSwishConfirm] = useState(false);
  const [saleComplete, setSaleComplete] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesWaitingForSync, setSalesWaitingForSync] = useState(false);
  const [lastCompletedSaleId, setLastCompletedSaleId] = useState<number | null>(null);
  const [dayRecords, setDayRecords] = useState<DayRecord[]>([]);
  const [historyDay, setHistoryDay] = useState(dayKey(new Date()));
  const [historySessionId, setHistorySessionId] = useState("all");
  const [activeSessionId, setActiveSessionId] = useState("");
  const [endDayConfirm, setEndDayConfirm] = useState(false);
  const [calculator, setCalculator] = useState(false);
  const [editingLine, setEditingLine] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editQty, setEditQty] = useState(1);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editSubcategoryName, setEditSubcategoryName] = useState("");
  const [removeLine, setRemoveLine] = useState<number | null>(null);
  const [clearCartConfirm, setClearCartConfirm] = useState(false);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [addCategory, setAddCategory] = useState(false);
  const [manageCategories, setManageCategories] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Product | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Product | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryIcon, setCategoryIcon] = useState(5);
  const [categoryColor, setCategoryColor] = useState(PASTEL_COLORS[0]);
  const [categorySubcategories, setCategorySubcategories] = useState<Subcategory[]>([]);
  const [newSubcategory, setNewSubcategory] = useState("");
  const [newSubcategoryStatic, setNewSubcategoryStatic] = useState(false);
  const [newSubcategoryPrice, setNewSubcategoryPrice] = useState("");
  const [categoryImage, setCategoryImage] = useState("");
  const [categoryImageError, setCategoryImageError] = useState("");
  const [cropSource, setCropSource] = useState("");
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropSize, setCropSize] = useState({ width: 1, height: 1 });
  const cropViewport = useRef<HTMLDivElement>(null);
  const cropDrag = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const viewHistoryReady = useRef(false);
  const handlingBrowserBack = useRef(false);
  const whooshAudio = useRef<AudioContext | null>(null);
  const saleWhoosh = useRef<HTMLAudioElement | null>(null);
  const hasSeparateCategoryState = useRef(false);
  const legacyCategoryRecoveryAttempted = useRef(false);
  const hasSeparateSalesState = useRef(false);
  const hasSeparateCashierState = useRef(false);
  const hasInitializedLastSale = useRef(false);
  const [cashiers, setCashiers] = useState<Cashier[]>(DEFAULT_CASHIERS);
  const [currentCashierId, setCurrentCashierId] = useState(1);
  const [cashiersWaitingForSync, setCashiersWaitingForSync] = useState(false);
  const [cashierPicker, setCashierPicker] = useState(false);
  const [manageCashiers, setManageCashiers] = useState(false);
  const [newCashierName, setNewCashierName] = useState("");
  const [newCashierIcon, setNewCashierIcon] = useState<"woman" | "man">("woman");
  const [editingCashier, setEditingCashier] = useState<Cashier | null>(null);
  const [cashierEditName, setCashierEditName] = useState("");
  const [cashierEditIcon, setCashierEditIcon] = useState<"woman" | "man">("woman");
  const [draggingCategory, setDraggingCategory] = useState<number | null>(null);
  const [saleDraft, setSaleDraft] = useState<Sale | null>(null);
  const [calcValue, setCalcValue] = useState("0");
  const [calcStored, setCalcStored] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);
  const [calcExpression, setCalcExpression] = useState("");
  const [calcHistory, setCalcHistory] = useState("0");
  const [calcAnswer, setCalcAnswer] = useState("0");
  const [calcJustEquals, setCalcJustEquals] = useState(false);
  const [copiedValue, setCopiedValue] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundPayment, setRefundPayment] = useState<"Kontant" | "Banköverföring">("Kontant");

  const printHistory = (mode: "detailed" | "summary") => {
    document.body.dataset.rkPrintMode = mode;
    window.print();
  };

  useEffect(() => {
    const saved = localStorage.getItem("rk-kassa-sales");
    if (saved) setSales(JSON.parse(saved));
    const savedLastSale = Number(localStorage.getItem("rk-kassa-last-completed-sale"));
    if (savedLastSale) {
      setLastCompletedSaleId(savedLastSale);
      hasInitializedLastSale.current = true;
    }
    if (localStorage.getItem(PENDING_SALES_KEY)) setSalesWaitingForSync(true);
    const savedDays = localStorage.getItem("rk-kassa-days");
    if (savedDays) setDayRecords(JSON.parse(savedDays));
    const savedSession = localStorage.getItem("rk-kassa-active-session");
    if (savedSession) setActiveSessionId(savedSession);
    const savedProducts = localStorage.getItem("rk-kassa-categories");
    if (savedProducts) {
      const restored: Product[] = JSON.parse(savedProducts);
      const migrated = restored.map((product, index) => ({...product, icon: product.icon % 54, color: PASTEL_COLORS.includes(product.color) ? product.color : PASTEL_COLORS[index % PASTEL_COLORS.length], subcategories: (product.subcategories || []).map((item: string | Subcategory) => typeof item === "string" ? { id: item.toLowerCase().replace(/\s+/g,"-"), name: item } : item)}));
      setProducts(migrated); localStorage.setItem("rk-kassa-categories", JSON.stringify(migrated));
    }
    const savedCashiers = localStorage.getItem(PENDING_CASHIERS_KEY) || localStorage.getItem("rk-kassa-cashiers");
    const restoredCashiers: Cashier[] = savedCashiers ? JSON.parse(savedCashiers) : DEFAULT_CASHIERS;
    setCashiers(restoredCashiers.length ? restoredCashiers : DEFAULT_CASHIERS);
    if (localStorage.getItem(PENDING_CASHIERS_KEY)) setCashiersWaitingForSync(true);
    const savedCashierId = Number(localStorage.getItem("rk-kassa-current-cashier"));
    if (restoredCashiers.some((cashier) => cashier.id === savedCashierId)) setCurrentCashierId(savedCashierId);
    const savedCart = localStorage.getItem("rk-kassa-cart");
    if (savedCart) {
      try { setCart(JSON.parse(savedCart) as SaleLine[]); } catch { localStorage.removeItem("rk-kassa-cart"); }
    }
    setCartHydrated(true);
    const updateFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => document.removeEventListener("fullscreenchange", updateFullscreen);
  }, []);

  useEffect(() => {
    if (!cartHydrated) return;
    localStorage.setItem("rk-kassa-cart", JSON.stringify(cart));
  }, [cart, cartHydrated]);

  // Ett pågående köp ska alltid öppnas direkt. Startsidan är bara för när
  // kassan är tom, så att man aldrig råkar börja ett nytt köp ovanpå ett gammalt.
  useEffect(() => {
    if (cartHydrated && cart.length > 0 && view === "home") setView("sale");
  }, [cart.length, cartHydrated, view]);

  useEffect(() => {
    // Existing installations did not have an explicit "last purchase" marker.
    // Establish it once, but never fall back to an older purchase after that.
    if (hasInitializedLastSale.current || !sales.length) return;
    const newest = sales.filter((sale) => sale.kind !== "refund").sort((a, b) => b.id - a.id)[0];
    if (!newest) return;
    hasInitializedLastSale.current = true;
    setLastCompletedSaleId(newest.id);
    localStorage.setItem("rk-kassa-last-completed-sale", String(newest.id));
  }, [sales]);

  useEffect(() => {
    if (!viewHistoryReady.current) {
      window.history.replaceState({ rkKassaView: view }, "");
      viewHistoryReady.current = true;
      return;
    }
    if (handlingBrowserBack.current) {
      handlingBrowserBack.current = false;
      return;
    }
    window.history.pushState({ rkKassaView: view }, "");
  }, [view]);

  useEffect(() => {
    const onBack = (event: PopStateEvent) => {
      handlingBrowserBack.current = true;
      setView((event.state?.rkKassaView as typeof view) || "home");
    };
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, []);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (cropSource) { setCropSource(""); return; }
      if (calculator) { setCalculator(false); return; }
      if (endDayConfirm) { setEndDayConfirm(false); return; }
      if (saleDraft) { setSaleDraft(null); return; }
      if (swishConfirm) { setSwishConfirm(false); return; }
      if (clearCartConfirm) { setClearCartConfirm(false); return; }
      if (deleteCategory) { setDeleteCategory(null); setManageCategories(true); return; }
      if (addCategory) { setAddCategory(false); setEditingCategory(null); setManageCategories(true); return; }
      if (manageCategories) { setManageCategories(false); return; }
      if (editingLine !== null) { setEditingLine(null); return; }
      if (refundOpen) { setRefundOpen(false); return; }
      if (passwordUser) { setPasswordUser(null); setReplacementPassword(""); return; }
      if (manageUsers) { setManageUsers(false); return; }
      if (editingCashier) { setEditingCashier(null); return; }
      if (manageCashiers) { setManageCashiers(false); return; }
      if (cashierPicker) { setCashierPicker(false); return; }
      if (choosingSubcategory) { setChoosingSubcategory(false); setSelected(null); return; }
      if (selected) { setSelected(null); setSelectedSubcategory(null); setPrice(""); return; }
      if (menu) setMenu(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [cropSource, calculator, endDayConfirm, saleDraft, swishConfirm, clearCartConfirm, deleteCategory, addCategory, manageCategories, editingLine, refundOpen, manageUsers, passwordUser, editingCashier, manageCashiers, cashierPicker, choosingSubcategory, selected, menu]);

  useEffect(() => {
    const savedUser = sessionStorage.getItem("rk-kassa-user");
    if (savedUser) setUser(JSON.parse(savedUser) as AuthUser);
    setAuthLoading(false);
    setHasLoadedRemote(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(kassaStateRef, (snapshot) => {
      const state = snapshot.data() as {
        sales?: Sale[]; days?: DayRecord[]; activeSessionId?: string; userLoginLog?: Record<string, number>; loginEvents?: LoginEvent[]; categories?: Product[];
        cashiers?: Cashier[]; currentCashierId?: number;
      } | undefined;
      if (state?.sales && !hasSeparateSalesState.current) {
        // A completed sale must never disappear just because Firebase is
        // temporarily unavailable. Keep the local, queued purchases in view
        // until Firebase has accepted them.
        const pendingRaw = localStorage.getItem(PENDING_SALES_KEY);
        const pending = pendingRaw ? JSON.parse(pendingRaw) as Sale[] : [];
        const savedRaw = localStorage.getItem("rk-kassa-sales");
        const saved = savedRaw ? JSON.parse(savedRaw) as Sale[] : [];
        const combined = new Map<number, Sale>();
        // An empty response must never erase the device backup. There is no
        // "remove all sales" action in the app, so a non-empty local ledger
        // is always safer than replacing it with an empty remote array.
        [...saved, ...pending, ...state.sales].forEach((sale) => combined.set(sale.id, sale));
        setSales([...combined.values()].sort((a, b) => b.id - a.id));
      }
      if (state?.days) setDayRecords(state.days);
      if (state?.activeSessionId) setActiveSessionId(state.activeSessionId);
      if (state?.userLoginLog) setUserLoginLog(state.userLoginLog);
      if (state?.loginEvents) setLoginEvents(state.loginEvents);
      if (state?.categories && !hasSeparateCategoryState.current) setProducts(state.categories.map((product) => ({ ...product, subcategories: normalizeSubcategories(product.subcategories) })));
      if (state?.cashiers && !hasSeparateCashierState.current && !localStorage.getItem(PENDING_CASHIERS_KEY)) setCashiers(state.cashiers);
      if (state?.currentCashierId && !hasSeparateCashierState.current && !localStorage.getItem(PENDING_CASHIERS_KEY)) setCurrentCashierId(state.currentCashierId);
      setHasLoadedRemote(true);
    }, () => {
      setAuthError("Kunde inte läsa kassan från databasen.");
      setHasLoadedRemote(true);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(categoryStateRef, (snapshot) => {
      const items = snapshot.data()?.items as Product[] | undefined;
      if (!items?.length) { void restoreLegacyCategories(); return; }
      hasSeparateCategoryState.current = true;
      setProducts(items.map((product) => ({ ...product, subcategories: normalizeSubcategories(product.subcategories) })));
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(salesCollectionRef, (snapshot) => {
      hasSeparateSalesState.current = true;
      const remote = snapshot.docs.map((item) => item.data() as Sale);
      const pendingRaw = localStorage.getItem(PENDING_SALES_KEY);
      const savedRaw = localStorage.getItem("rk-kassa-sales");
      const pending = pendingRaw ? JSON.parse(pendingRaw) as Sale[] : [];
      const saved = savedRaw ? JSON.parse(savedRaw) as Sale[] : [];
      const combined = new Map<number, Sale>();
      [...saved, ...pending, ...remote].forEach((sale) => combined.set(sale.id, sale));
      setSales([...combined.values()].sort((a, b) => b.id - a.id));
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(cashierStateRef, (snapshot) => {
      hasSeparateCashierState.current = true;
      const state = snapshot.data() as { cashiers?: Cashier[]; currentCashierId?: number } | undefined;
      if (state?.cashiers && !localStorage.getItem(PENDING_CASHIERS_KEY)) setCashiers(state.cashiers);
      if (state?.currentCashierId && !localStorage.getItem(PENDING_CASHIERS_KEY)) setCurrentCashierId(state.currentCashierId);
    });
  }, [user]);

  const total = cart.reduce((sum, line) => sum + line.price * (line.qty || 1), 0);
  const todayKey = dayKey(new Date());
  const currentSessionId = activeSessionId || `${todayKey}-pass-open`;
  const historyDaySales = useMemo(() => sales.filter((sale) => dayKey(new Date(sale.id)) === historyDay), [sales, historyDay]);
  const historySales = useMemo(() => historySessionId === "all" ? historyDaySales : historyDaySales.filter((sale) => (sale.sessionId || `${historyDay}-legacy`) === historySessionId), [historyDaySales, historyDay, historySessionId]);
  const historySessions = useMemo(() => {
    const sessions = new Map<string, { id: string; closed: boolean; closedAt?: number }>();
    dayRecords.filter((record) => record.date === historyDay).forEach((record) => { const id = record.id || `${record.date}-legacy`; sessions.set(id, { id, closed: true, closedAt: record.closedAt }); });
    historyDaySales.forEach((sale) => { const id = sale.sessionId || `${historyDay}-legacy`; if (!sessions.has(id)) sessions.set(id, { id, closed: false }); });
    if (activeSessionId && activeSessionId.startsWith(`${historyDay}-`)) sessions.set(activeSessionId, { id: activeSessionId, closed: false });
    return [...sessions.values()].sort((a, b) => (a.closedAt || Infinity) - (b.closedAt || Infinity));
  }, [dayRecords, historyDay, historyDaySales, activeSessionId]);
  const historyTotal = historySales.reduce((sum, sale) => sum + saleTotal(sale), 0);
  const historyCash = historySales.filter((sale) => sale.payment === "Kontant").reduce((sum, sale) => sum + saleTotal(sale), 0);
  const historySwish = historySales.filter((sale) => sale.payment === "Swish").reduce((sum, sale) => sum + saleTotal(sale), 0);
  const historyCustomers = historySales.filter((sale) => sale.kind !== "refund").length;
  const historyItems = historySales.filter((sale) => sale.kind !== "refund").reduce((sum, sale) => sum + sale.lines.reduce((lineSum, line) => lineSum + (line.qty || 1), 0), 0);
  const historyCashPurchases = historySales.filter((sale) => sale.kind !== "refund" && sale.payment === "Kontant").length;
  const historySwishPurchases = historySales.filter((sale) => sale.kind !== "refund" && sale.payment === "Swish").length;
  const historyCashiers = Array.from(new Set(historySales.filter((sale) => sale.kind !== "refund").map((sale) => sale.cashier).filter(Boolean))).join(", ") || cashiers.find((cashier) => cashier.id === currentCashierId)?.name || "–";
  const historyPrintRows = useMemo(() => historySales.flatMap((sale) => [
    { type: "purchase" as const, id: `purchase-${sale.id}`, label: `${sale.kind === "refund" ? "Återbetalning" : "Köp"} – ${sale.time}` },
    ...sale.lines.map((line, index) => ({ type: "line" as const, id: `line-${sale.id}-${index}`, name: line.name, qty: line.qty || 1, cash: sale.payment === "Kontant" ? line.price * (line.qty || 1) * (sale.kind === "refund" ? -1 : 1) : 0, swish: sale.payment === "Swish" ? line.price * (line.qty || 1) * (sale.kind === "refund" ? -1 : 1) : 0 })),
  ]), [historySales]);
  const historyRankings = useMemo(() => {
    const products = new Map<string, { units: number; revenue: number }>(); const categories = new Map<string, { units: number; revenue: number }>(); const cashiers = new Map<string, { units: number; revenue: number }>(); const hours = new Map<string, number>();
    historySales.forEach((sale) => {
      const hour = String(new Date(sale.id).getHours()).padStart(2, "0"); hours.set(hour, (hours.get(hour) || 0) + saleTotal(sale));
      if (sale.kind === "refund") return;
      const cashier = sale.cashier || "Okänd kassör"; const cashierValue = cashiers.get(cashier) || { units: 0, revenue: 0 }; cashiers.set(cashier, { units: cashierValue.units + 1, revenue: cashierValue.revenue + saleTotal(sale) });
      sale.lines.forEach((line) => {
        const quantity = line.qty || 1; const amount = line.price * quantity; const productValue = products.get(line.name) || { units: 0, revenue: 0 }; products.set(line.name, { units: productValue.units + quantity, revenue: productValue.revenue + amount });
        const category = line.name.split(" – ")[0]; const categoryValue = categories.get(category) || { units: 0, revenue: 0 }; categories.set(category, { units: categoryValue.units + quantity, revenue: categoryValue.revenue + amount });
      });
    });
    const ranked = (values: Map<string, { units: number; revenue: number }>) => [...values.entries()].map(([name, value]) => ({ name, ...value })).sort((a, b) => b.revenue - a.revenue);
    return { products: ranked(products), categories: ranked(categories), cashiers: ranked(cashiers), hours: [...hours.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => a.label.localeCompare(b.label)) };
  }, [historySales]);
  const historyPeakHour = historyRankings.hours.reduce<{ label: string; value: number } | undefined>((best, hour) => !best || hour.value > best.value ? hour : best, undefined);
  const historyClosed = historySessionId !== "all" && dayRecords.some((day) => (day.id || `${day.date}-legacy`) === historySessionId);
  const historyHasActiveSession = !!activeSessionId && activeSessionId.startsWith(`${historyDay}-`);
  const allDayKeys = useMemo(() => Array.from(new Set([...dayRecords.map((day) => day.date), ...sales.map((sale) => dayKey(new Date(sale.id)))] )).sort().reverse(), [dayRecords, sales]);
  const calcDisplayExpression = calcOp && calcStored !== null ? `${calcExpression}${calcValue === "0" ? "" : calcValue}` : calcJustEquals ? calcExpression : calcHistory.split("=")[0];
  const currentCashier = cashiers.find((cashier) => cashier.id === currentCashierId) || cashiers[0];
  // Återgå är bara en ångra-funktion för det pågående arbetspasset.
  // Ett köp från ett tidigare pass eller en tidigare dag får aldrig dyka upp här.
  const previousSale = !activeSessionId || lastCompletedSaleId === null ? undefined : sales.find((sale) => sale.id === lastCompletedSaleId && sale.kind !== "refund" && sale.sessionId === activeSessionId);
  const visibleProducts = products.filter((product) => !product.hidden);

  const statsSales = useMemo(() => {
    if (statsDay !== "all") return sales.filter((sale) => dayKey(new Date(sale.id)) === statsDay);
    if (statsFrom || statsTo) return sales.filter((sale) => { const day = dayKey(new Date(sale.id)); return (!statsFrom || day >= statsFrom) && (!statsTo || day <= statsTo); });
    if (statsMonth !== "all") return sales.filter((sale) => dayKey(new Date(sale.id)).slice(0, 7) === statsMonth);
    const cutoff = statsRange === "all" ? 0 : Date.now() - Number(statsRange) * 86_400_000;
    return sales.filter((sale) => sale.id >= cutoff);
  }, [sales, statsRange, statsMonth, statsDay, statsFrom, statsTo]);
  const availableStatsMonths = useMemo(() => Array.from(new Set(sales.map((sale) => dayKey(new Date(sale.id)).slice(0, 7)))).sort().reverse().map((key) => ({ key, label: new Intl.DateTimeFormat("sv-SE", { month: "long", year: "numeric" }).format(new Date(`${key}-01T12:00:00`)) })), [sales]);
  const availableStatsDays = useMemo(() => Array.from(new Set(sales.map((sale) => dayKey(new Date(sale.id))))).sort().reverse(), [sales]);
  const statsRevenue = statsSales.reduce((sum, sale) => sum + saleTotal(sale), 0);
  const statsCustomers = statsSales.filter((sale) => sale.kind !== "refund").length;
  const statsItems = statsSales.filter((sale) => sale.kind !== "refund").reduce((sum, sale) => sum + sale.lines.reduce((lineSum, line) => lineSum + (line.qty || 1), 0), 0);
  const statsCash = statsSales.filter((sale) => sale.payment === "Kontant").reduce((sum, sale) => sum + saleTotal(sale), 0);
  const statsSwish = statsSales.filter((sale) => sale.payment === "Swish").reduce((sum, sale) => sum + saleTotal(sale), 0);
  const statsRefunds = statsSales.filter((sale) => sale.kind === "refund");
  const statsRefundTotal = Math.abs(statsRefunds.reduce((sum, sale) => sum + saleTotal(sale), 0));
  const statsActiveDays = new Set(statsSales.map((sale) => dayKey(new Date(sale.id)))).size;
  const statsAverageItems = statsCustomers ? (statsItems / statsCustomers).toFixed(1).replace(".", ",") : "0";
  const statsLargestSale = Math.max(0, ...statsSales.filter((sale) => sale.kind !== "refund").map(saleTotal));
  const makeRanking = (mode: "product" | "category" | "cashier") => {
    const values = new Map<string, { units: number; revenue: number }>();
    statsSales.filter((sale) => sale.kind !== "refund").forEach((sale) => {
      if (mode === "cashier") {
        const name = sale.cashier || "Okänd kassör"; const current = values.get(name) || { units: 0, revenue: 0 };
        values.set(name, { units: current.units + 1, revenue: current.revenue + saleTotal(sale) }); return;
      }
      sale.lines.forEach((line) => {
        const name = mode === "category" ? line.name.split(" – ")[0] : line.name;
        const current = values.get(name) || { units: 0, revenue: 0 };
        values.set(name, { units: current.units + (line.qty || 1), revenue: current.revenue + line.price * (line.qty || 1) });
      });
    });
    return [...values.entries()].map(([name, value]) => ({ name, ...value })).sort((a, b) => b.revenue - a.revenue);
  };
  const productRanking = makeRanking("product");
  const weakestProductRanking = [...productRanking].sort((a, b) => a.units - b.units || a.revenue - b.revenue);
  const categoryRanking = makeRanking("category");
  const cashierRanking = makeRanking("cashier");
  const groupedRevenue = (kind: "month" | "weekday" | "hour") => {
    const labels = kind === "weekday" ? ["Sön", "Mån", "Tis", "Ons", "Tors", "Fre", "Lör"] : [];
    const values = new Map<string, number>();
    statsSales.forEach((sale) => {
      const date = new Date(sale.id);
      const key = kind === "month" ? new Intl.DateTimeFormat("sv-SE", { month: "short", year: "2-digit" }).format(date) : kind === "weekday" ? labels[date.getDay()] : String(date.getHours()).padStart(2, "0");
      values.set(key, (values.get(key) || 0) + saleTotal(sale));
    });
    return [...values.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => kind === "weekday" ? labels.indexOf(a.label) - labels.indexOf(b.label) : kind === "hour" ? a.label.localeCompare(b.label) : 0);
  };
  const monthlyRevenue = groupedRevenue("month");
  const weekdayRevenue = groupedRevenue("weekday");
  const hourlyRevenue = groupedRevenue("hour");
  const dailyRevenue = [...statsSales.reduce((values, sale) => { const key = dayKey(new Date(sale.id)); values.set(key, (values.get(key) || 0) + saleTotal(sale)); return values; }, new Map<string, number>()).entries()].map(([label, value]) => ({ label: label.slice(8), value })).sort((a, b) => a.label.localeCompare(b.label));

  const isAdmin = user?.role === "admin";
  const isHeadAdmin = user?.username.toLowerCase() === INITIAL_ADMIN.username;

  const loadUsers = async () => {
    const snapshot = await getDocs(collection(firestore, "medlemmar"));
    setUsers(snapshot.docs.map((item) => ({ id: item.id, username: String(item.data().name ?? item.id), role: item.data().admin ? "admin" : "cashier", isActive: true, lastLoginAt: userLoginLog[item.id.toLowerCase()] })).sort((a, b) => a.username.localeCompare(b.username, "sv")));
  };

  useEffect(() => {
    if (user?.role === "admin") void loadUsers();
  }, [user, userLoginLog]);

  const doLogin = async () => {
    setAuthError("");
    try {
      const username = loginUsername.trim().toLowerCase();
      if (!username || !loginPassword) return;
      const reference = memberRef(username);
      let member = await getDoc(reference);
      const hash = await passwordHash(username, loginPassword);
      if (!member.exists() && username === INITIAL_ADMIN.username && hash === INITIAL_ADMIN.passwordHash) {
        await setDoc(reference, { name: username, passwordHash: hash, admin: true, mainAdmin: true, createdAt: Date.now() });
        member = await getDoc(reference);
      }
      if (!member.exists() || member.data().passwordHash !== hash) {
        setAuthError("Inloggningen gick inte. Kontrollera användarnamn och lösenord.");
        return;
      }
      const loggedIn: AuthUser = { id: member.id, username: String(member.data().name ?? username), role: member.data().admin ? "admin" : "cashier" };
      const loginAt = Date.now();
      try {
        const currentState = await getDoc(kassaStateRef);
        const savedLog = currentState.exists() ? (currentState.data().userLoginLog as Record<string, number> | undefined) || {} : {};
        const nextLog = { ...savedLog, [username]: loginAt };
        const savedEvents = currentState.exists() ? (currentState.data().loginEvents as LoginEvent[] | undefined) || Object.entries(savedLog).map(([name, at]) => ({ username: name, at })) : [];
        const nextEvents = [...savedEvents, { username, at: loginAt }].slice(-20);
        await setDoc(kassaStateRef, { userLoginLog: nextLog, loginEvents: nextEvents, updatedAt: loginAt }, { merge: true });
        setUserLoginLog(nextLog);
        setLoginEvents(nextEvents);
      } catch {
        // The login itself must still work if the activity log is temporarily offline.
      }
      sessionStorage.setItem("rk-kassa-user", JSON.stringify(loggedIn));
      setHasLoadedRemote(false);
      setUser(loggedIn);
      setLoginPassword("");
      setLoginUsername("");
      if (loggedIn.role === "admin") await loadUsers();
    } catch {
      setAuthError("Inloggningen gick inte. Kontrollera användarnamn och lösenord.");
    }
  };

  const doLogout = async () => {
    sessionStorage.removeItem("rk-kassa-user");
    setUser(null);
    setHasLoadedRemote(false);
  };

  const createUser = async () => {
    if (!isAdmin || !newUsername.trim() || !newUserPassword.trim()) return;
    const username = newUsername.trim().toLowerCase();
    const reference = memberRef(username);
    if ((await getDoc(reference)).exists()) return;
    await setDoc(reference, { name: newUsername.trim(), passwordHash: await passwordHash(username, newUserPassword), admin: newUserRole === "admin", createdAt: Date.now() });
    setNewUsername(""); setNewUserPassword(""); setNewUserRole("cashier");
    await loadUsers();
  };
  const removeUser = async (id: string) => {
    if (!isAdmin || id === user?.id) return;
    await deleteDoc(memberRef(id));
    await loadUsers();
  };

  const changeUserPassword = async () => {
    if (!isAdmin || !passwordUser || !replacementPassword.trim()) return;
    await setDoc(memberRef(passwordUser.id), { passwordHash: await passwordHash(passwordUser.id, replacementPassword) }, { merge: true });
    setReplacementPassword(""); setPasswordUser(null);
    window.alert(`Lösenordet för ${passwordUser.username} är ändrat.`);
  };

  function typePrice(key: string) {
    if (key === "Rensa") return setPrice("");
    if (key === "⌫") return setPrice((p) => p.slice(0, -1));
    setPrice((p) => (p.length < 6 ? `${p}${key}`.replace(/^0+/, "") : p));
  }

  function addLine() {
    if (!selected || !Number(price)) return;
    setCart((lines) => [...lines, { name: selectedSubcategory ? `${selected.name} – ${selectedSubcategory.name}` : selected.name, price: Number(price), qty: itemQty }]);
    setSelected(null); setSelectedSubcategory(null); setPrice(""); setItemQty(1);
  }

  function finishSale() {
    if (!payment || !cart.length || savingSale) return;
    if (payment === "Swish") { setSwishConfirm(true); return; }
    void saveCompletedSale();
  }

  function prepareWhoosh() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    whooshAudio.current ||= new AudioContextClass();
    void whooshAudio.current.resume();
  }

  function playWhoosh() {
    const sound = saleWhoosh.current;
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
      sound.volume = .72;
      sound.playbackRate = .86;
      void sound.play().catch(() => playGeneratedWhoosh());
      return;
    }
    playGeneratedWhoosh();
  }

  function playGeneratedWhoosh() {
    const context = whooshAudio.current;
    if (!context) return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(180, now);
    oscillator.frequency.exponentialRampToValueAtTime(820, now + .42);
    oscillator.frequency.exponentialRampToValueAtTime(240, now + .78);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(2600, now + .38);
    filter.frequency.exponentialRampToValueAtTime(500, now + .82);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(.18, now + .07);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .86);
    oscillator.connect(filter).connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + .9);
  }

  function storeSalesOnThisDevice(next: Sale[], waitingForSync: boolean) {
    setSales(next);
    localStorage.setItem("rk-kassa-sales", JSON.stringify(next));
    if (waitingForSync) {
      localStorage.setItem(PENDING_SALES_KEY, JSON.stringify(next));
      setSalesWaitingForSync(true);
    } else {
      localStorage.removeItem(PENDING_SALES_KEY);
      setSalesWaitingForSync(false);
    }
  }

  async function writeSalesDocuments(next: Sale[], previous: Sale[]) {
    const before = new Map(previous.map((sale) => [sale.id, sale]));
    const after = new Map(next.map((sale) => [sale.id, sale]));
    const writes: Promise<void>[] = [];
    after.forEach((sale, id) => {
      if (JSON.stringify(before.get(id)) !== JSON.stringify(sale)) {
        writes.push(setDoc(doc(firestore, "kassa-sales", String(id)), sale));
      }
    });
    before.forEach((_sale, id) => {
      if (!after.has(id)) writes.push(deleteDoc(doc(firestore, "kassa-sales", String(id))));
    });
    await Promise.all(writes);
  }

  async function persistSales(next: Sale[]) {
    // Save first on the device. This makes a sale durable even if Firebase is
    // offline or has temporarily reached its write quota.
    storeSalesOnThisDevice(next, false);
    try {
      await writeSalesDocuments(next, sales);
      return true;
    } catch {
      storeSalesOnThisDevice(next, true);
      return false;
    }
  }

  useEffect(() => {
    if (!user || !salesWaitingForSync) return;
    const retryWhenBack = async () => {
      const pendingRaw = localStorage.getItem(PENDING_SALES_KEY);
      if (!pendingRaw) return;
      try {
        const pending = JSON.parse(pendingRaw) as Sale[];
        await Promise.all(pending.map((sale) => setDoc(doc(firestore, "kassa-sales", String(sale.id)), sale)));
        storeSalesOnThisDevice(pending, false);
      } catch {
        // Firebase may be offline or rate limited. We deliberately keep the
        // queue and only retry on a later focus/online event.
      }
    };
    const onOnline = () => { void retryWhenBack(); };
    const onVisibility = () => { if (document.visibilityState === "visible") void retryWhenBack(); };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("online", onOnline); document.removeEventListener("visibilitychange", onVisibility); };
  }, [user, salesWaitingForSync]);

  async function saveCompletedSale() {
    if (!payment || !cart.length || savingSale) return;
    prepareWhoosh();
    const nextSale: Sale = returningSaleId ? { ...(sales.find((sale) => sale.id === returningSaleId) || { id: returningSaleId, time: new Date().toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }) }), payment, lines: cart, cashier: currentCashier?.name } : { id: Date.now(), time: new Date().toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }), payment, lines: cart, cashier: currentCashier?.name, sessionId: currentSessionId };
    const next = returningSaleId ? sales.map((sale) => sale.id === returningSaleId ? nextSale : sale) : [nextSale, ...sales];
    setSavingSale(true);
    const synced = await persistSales(next);
    hasInitializedLastSale.current = true;
    setLastCompletedSaleId(nextSale.id);
    localStorage.setItem("rk-kassa-last-completed-sale", String(nextSale.id));
    setCart([]); setPayment(null); setReturningSaleId(null); setView("home");
    setSavingSale(false);
    setSwishConfirm(false);
    setSaleComplete(true);
    if (!synced) window.setTimeout(() => window.alert("Köpet är sparat på den här enheten och synkas automatiskt till databasen när anslutningen är tillbaka."), 2700);
    playWhoosh();
    window.setTimeout(() => setSaleComplete(false), 2600);
  }

  function startSale() { setReturningSaleId(null); setPayment(null); setSelected(null); setSelectedSubcategory(null); setChoosingSubcategory(false); setPrice(""); setItemQty(1); setView("sale"); setMenu(false); }

  function reopenPreviousSale() {
    if (!previousSale) return;
    setCart(structuredClone(previousSale.lines));
    setPayment(previousSale.payment === "Swish" ? "Swish" : "Kontant");
    setReturningSaleId(previousSale.id);
    setSelected(null); setSelectedSubcategory(null); setChoosingSubcategory(false); setPrice(""); setItemQty(1); setView("sale");
  }

  async function clearCart() {
    if (returningSaleId) {
      const next = sales.filter((sale) => sale.id !== returningSaleId);
      const synced = await persistSales(next);
      if (!synced) window.alert("Köpet är borttaget på den här enheten och synkas när databasen är tillgänglig igen.");
      // This was the one explicit latest-purchase link. It must not now point
      // to an older customer just because that is the next item in the list.
      hasInitializedLastSale.current = true;
      setLastCompletedSaleId(null);
      localStorage.removeItem("rk-kassa-last-completed-sale");
    }
    setCart([]); setPayment(null); setReturningSaleId(null); setClearCartConfirm(false);
  }

  function chooseProduct(product: Product) {
    setSelected(product); setSelectedSubcategory(null); setPrice(""); setItemQty(1); setChoosingSubcategory(product.subcategories.length > 0);
  }

  function addStaticSubcategory(product: Product, subcategory: Subcategory) {
    const staticPrice = Number(subcategory.staticPrice);
    if (!staticPrice) return;
    const name = `${product.name} – ${subcategory.name}`;
    setCart((lines) => {
      const existingIndex = lines.findIndex((line) => line.name.trim().toLocaleLowerCase("sv-SE") === name.trim().toLocaleLowerCase("sv-SE") && Number(line.price) === staticPrice);
      if (existingIndex < 0) return [...lines, { name, price: staticPrice, qty: 1 }];
      return lines.map((line, index) => index === existingIndex ? { ...line, qty: (line.qty || 1) + 1 } : line);
    });
    setSelected(null); setSelectedSubcategory(null); setChoosingSubcategory(false);
  }

  function openRefund() {
    setRefundAmount(""); setRefundReason(""); setRefundPayment("Kontant"); setRefundOpen(true); setMenu(false);
  }

  async function saveRefund() {
    const amount = Number(refundAmount);
    if (!amount || !refundPayment) return;
    const reason = refundReason.trim() || "Återbetalning";
    const refund: Sale = { id: Date.now(), time: new Date().toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }), payment: refundPayment, kind: "refund", reason, cashier: currentCashier?.name, sessionId: currentSessionId, lines: [{ name: reason, price: amount, qty: 1 }] };
    const next = [refund, ...sales];
    const synced = await persistSales(next);
    if (!synced) window.alert("Återbetalningen är sparad på den här enheten och synkas när databasen är tillgänglig igen.");
    setRefundOpen(false); setHistoryDay(todayKey); setView("history");
  }

  async function restoreLegacyCategories() {
    if (legacyCategoryRecoveryAttempted.current) return;
    legacyCategoryRecoveryAttempted.current = true;
    try {
      const response = await fetch(LEGACY_FIREBASE_CATEGORY_URL);
      if (!response.ok) return;
      const document = await response.json() as { fields?: Record<string, unknown> };
      const decode = (value: any): any => {
        if (!value) return undefined;
        if ("stringValue" in value) return value.stringValue;
        if ("integerValue" in value) return Number(value.integerValue);
        if ("doubleValue" in value) return Number(value.doubleValue);
        if ("booleanValue" in value) return value.booleanValue;
        if ("nullValue" in value) return null;
        if ("arrayValue" in value) return (value.arrayValue.values || []).map(decode);
        if ("mapValue" in value) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, item]) => [key, decode(item)]));
        return undefined;
      };
      const legacyItems = decode(document.fields?.items) as Product[] | undefined;
      if (!legacyItems?.length) return;
      const recovered = legacyItems.map((product, index) => ({ ...product, icon: Number(product.icon) % 54, color: product.color || PASTEL_COLORS[index % PASTEL_COLORS.length], subcategories: normalizeSubcategories(product.subcategories) }));
      await persistCategories(recovered);
      setProducts(recovered);
      localStorage.setItem("rk-kassa-categories", JSON.stringify(recovered));
      window.alert("Dina tidigare kategorier har återställts.");
    } catch {
      // Firebase's old database is currently rate limited. A later page load
      // retries once without touching the new Supabase data.
    }
  }

  async function persistCategories(next: Product[]) {
    const items = next.map(({ image, ...product }) => image ? { ...product, image } : product);
    await setDoc(categoryStateRef, { items, updatedAt: Date.now() });
    hasSeparateCategoryState.current = true;
  }

  async function saveCategory() {
    if (!categoryName.trim()) return;
    const next = editingCategory
      ? products.map((product) => product.id === editingCategory.id ? {...product, name: categoryName.trim(), icon: categoryIcon, color: categoryColor, subcategories: categorySubcategories, image: categoryImage || undefined} : product)
      : [...products, { id: Date.now(), name: categoryName.trim(), icon: categoryIcon, color: categoryColor, subcategories: categorySubcategories, image: categoryImage || undefined, hidden: false }];
    try {
      await persistCategories(next);
    } catch {
      window.alert("Kategorin kunde inte sparas. Bilden kan vara för stor. Prova att beskära den igen.");
      return;
    }
    setProducts(next); localStorage.setItem("rk-kassa-categories", JSON.stringify(next));
    // Stäng först redigeringsrutan och öppna sedan uttryckligen listan med
    // kategori-kort. Det undviker att underliggande Hantera-sida blir synlig.
    setCategoryName(""); setCategoryIcon(5); setCategoryColor(PASTEL_COLORS[0]); setCategorySubcategories([]); setNewSubcategory(""); setCategoryImage(""); setCategoryImageError(""); setEditingCategory(null); setManageCategories(false); setAddCategory(false);
    window.setTimeout(() => setManageCategories(true), 0);
  }

  async function toggleCategoryVisibility(product: Product) {
    const next = products.map((item) => item.id === product.id ? { ...item, hidden: !item.hidden } : item);
    try {
      await persistCategories(next);
      setProducts(next); localStorage.setItem("rk-kassa-categories", JSON.stringify(next));
    } catch {
      window.alert("Kategorin kunde inte uppdateras. Försök igen.");
    }
  }

  async function uploadCategoryImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 12_000_000) { setCategoryImageError("Välj en bild som är mindre än 12 MB."); return; }
    try {
      const source = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file);
      });
      const bitmap = await createImageBitmap(file);
      setCropSize({ width: bitmap.width, height: bitmap.height }); bitmap.close();
      setCropSource(source); setCropZoom(1); setCropOffset({ x: 0, y: 0 }); setCategoryImageError("");
    } catch { setCategoryImageError("Bilden kunde inte läsas. Prova en annan bild."); }
  }

  function saveCroppedImage() {
    const viewport = cropViewport.current; if (!viewport || !cropSource) return;
    const image = new Image();
    image.onload = () => {
      const width = 260; const height = 174; const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
      const context = canvas.getContext("2d"); if (!context) return;
      const rect = viewport.getBoundingClientRect();
      const baseScale = Math.max(rect.width / cropSize.width, rect.height / cropSize.height);
      const outputRatio = width / rect.width; const scale = baseScale * cropZoom * outputRatio;
      const drawWidth = cropSize.width * scale; const drawHeight = cropSize.height * scale;
      const maxX = Math.max(0, (drawWidth - width) / 2); const maxY = Math.max(0, (drawHeight - height) / 2);
      const offsetX = Math.max(-maxX, Math.min(maxX, cropOffset.x * outputRatio)); const offsetY = Math.max(-maxY, Math.min(maxY, cropOffset.y * outputRatio));
      context.drawImage(image, (width - drawWidth) / 2 + offsetX, (height - drawHeight) / 2 + offsetY, drawWidth, drawHeight);
      setCategoryImage(canvas.toDataURL("image/webp", .55)); setCropSource("");
    };
    image.src = cropSource;
  }

  function clampCropOffset(x: number, y: number, zoom = cropZoom) {
    const rect = cropViewport.current?.getBoundingClientRect(); if (!rect) return { x: 0, y: 0 };
    const baseScale = Math.max(rect.width / cropSize.width, rect.height / cropSize.height);
    const maxX = Math.max(0, (cropSize.width * baseScale * zoom - rect.width) / 2);
    const maxY = Math.max(0, (cropSize.height * baseScale * zoom - rect.height) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  }

  function addSubcategory() {
    const name = newSubcategory.trim();
    const price = Number(newSubcategoryPrice);
    if (!name || categorySubcategories.some((item) => item.name.toLowerCase() === name.toLowerCase()) || (newSubcategoryStatic && !price)) return;
    setCategorySubcategories((items) => [...items, { id: `${Date.now()}-${name}`, name, ...(newSubcategoryStatic ? { staticPrice: price } : {}) }]);
    setNewSubcategory(""); setNewSubcategoryStatic(false); setNewSubcategoryPrice("");
  }

  function storeCashiersOnThisDevice(next: Cashier[], selectedId: number, waitingForSync: boolean) {
    localStorage.setItem("rk-kassa-cashiers", JSON.stringify(next));
    localStorage.setItem("rk-kassa-current-cashier", String(selectedId));
    if (waitingForSync) {
      localStorage.setItem(PENDING_CASHIERS_KEY, JSON.stringify(next));
      localStorage.setItem(`${PENDING_CASHIERS_KEY}-selected`, String(selectedId));
      setCashiersWaitingForSync(true);
    } else {
      localStorage.removeItem(PENDING_CASHIERS_KEY);
      localStorage.removeItem(`${PENDING_CASHIERS_KEY}-selected`);
      setCashiersWaitingForSync(false);
    }
  }

  async function saveCashiers(next: Cashier[], selectedId: number) {
    storeCashiersOnThisDevice(next, selectedId, false);
    try {
      await setDoc(cashierStateRef, { cashiers: next, currentCashierId: selectedId, updatedAt: Date.now() });
    } catch {
      // Do not let an old Firebase snapshot erase cashiers that were just
      // created. They remain safely stored on this device until sync works.
      storeCashiersOnThisDevice(next, selectedId, true);
      window.alert("Kassörerna är sparade på den här enheten och synkas automatiskt när databasen är tillgänglig igen.");
    }
  }

  useEffect(() => {
    if (!user || !cashiersWaitingForSync) return;
    const retryWhenBack = async () => {
      const pendingRaw = localStorage.getItem(PENDING_CASHIERS_KEY);
      if (!pendingRaw) return;
      const selectedId = Number(localStorage.getItem(`${PENDING_CASHIERS_KEY}-selected`)) || 1;
      try {
        const pending = JSON.parse(pendingRaw) as Cashier[];
        await setDoc(cashierStateRef, { cashiers: pending, currentCashierId: selectedId, updatedAt: Date.now() });
        storeCashiersOnThisDevice(pending, selectedId, false);
      } catch {
        // Keep the local queue intact. A retry happens after the app regains
        // network/focus, without hammering a temporarily limited Firebase.
      }
    };
    const onOnline = () => { void retryWhenBack(); };
    const onVisibility = () => { if (document.visibilityState === "visible") void retryWhenBack(); };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("online", onOnline); document.removeEventListener("visibilitychange", onVisibility); };
  }, [user, cashiersWaitingForSync]);

  function selectCashier(id: number) {
    setCurrentCashierId(id); void saveCashiers(cashiers, id); setCashierPicker(false);
  }

  function addCashier() {
    const name = newCashierName.trim();
    if (!name || cashiers.some((cashier) => cashier.name.toLowerCase() === name.toLowerCase())) return;
    const cashier: Cashier = { id: Date.now(), name, icon: newCashierIcon }; const next = [...cashiers, cashier];
    setCashiers(next); setCurrentCashierId(cashier.id); setNewCashierName(""); setNewCashierIcon("woman"); void saveCashiers(next, cashier.id);
  }

  function openCashierEditor(cashier: Cashier) {
    setCashierEditName(cashier.name); setCashierEditIcon(cashier.icon === "man" ? "man" : "woman"); setEditingCashier(cashier);
  }

  function saveCashierEdit() {
    if (!editingCashier || !cashierEditName.trim()) return;
    const name = cashierEditName.trim();
    if (cashiers.some((cashier) => cashier.id !== editingCashier.id && cashier.name.toLowerCase() === name.toLowerCase())) return;
    const next = cashiers.map((cashier) => cashier.id === editingCashier.id ? { ...cashier, name, icon: cashierEditIcon } : cashier);
    setCashiers(next); setEditingCashier(null); void saveCashiers(next, currentCashierId);
  }

  function removeCashier(id: number) {
    if (cashiers.length === 1) return;
    const next = cashiers.filter((cashier) => cashier.id !== id);
    const selectedId = currentCashierId === id ? next[0].id : currentCashierId;
    setCashiers(next); setCurrentCashierId(selectedId); void saveCashiers(next, selectedId);
  }

  function moveCategoryAtPoint(clientX: number, clientY: number) {
    if (draggingCategory === null) return;
    const target = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>("[data-sort-id]");
    const targetId = Number(target?.dataset.sortId);
    if (!targetId || targetId === draggingCategory) return;
    setProducts((current) => {
      const from = current.findIndex((product) => product.id === draggingCategory);
      const to = current.findIndex((product) => product.id === targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current]; const [moved] = next.splice(from, 1); next.splice(to, 0, moved);
      localStorage.setItem("rk-kassa-categories", JSON.stringify(next)); void persistCategories(next).catch(() => window.alert("Sorteringen kunde inte sparas. Försök igen.")); return next;
    });
  }

  async function removeCategory(product: Product) {
    const next = products.filter((item) => item.id !== product.id);
    try {
      await persistCategories(next);
    } catch {
      window.alert("Kategorin kunde inte sparas. Försök igen.");
      return;
    }
    setProducts(next); localStorage.setItem("rk-kassa-categories", JSON.stringify(next));
    if (selected?.id === product.id) { setSelected(null); setPrice(""); }
    setDeleteCategory(null); setManageCategories(true);
  }

  async function updateHistorySale(updated: Sale) {
    const next = sales.map((sale) => sale.id === updated.id ? updated : sale);
    const synced = await persistSales(next);
    if (!synced) window.alert("Ändringen är sparad på den här enheten och synkas när databasen är tillgänglig igen.");
    setSaleDraft(null);
  }

  async function closeDay() {
    const sessionId = activeSessionId || `${historyDay}-pass-open`;
    const next = [...dayRecords.filter((day) => (day.id || `${day.date}-legacy`) !== sessionId), { id: sessionId, date: historyDay, closedAt: Date.now() }];
    try { await setDoc(kassaStateRef, { days: next, activeSessionId: "", updatedAt: Date.now() }, { merge: true }); } catch { window.alert("Passet kunde inte avslutas. Försök igen."); return; }
    setDayRecords(next); localStorage.setItem("rk-kassa-days", JSON.stringify(next));
    setActiveSessionId(""); localStorage.removeItem("rk-kassa-active-session");
    setLastCompletedSaleId(null); localStorage.removeItem("rk-kassa-last-completed-sale");
    setHistorySessionId(sessionId); setEndDayConfirm(false); setView("history");
  }

  async function reopenDay() {
    const sessionId = historySessionId === "all" ? dayRecords.find((day) => day.date === historyDay)?.id : historySessionId;
    if (!sessionId) return;
    const next = dayRecords.filter((day) => (day.id || `${day.date}-legacy`) !== sessionId);
    try { await setDoc(kassaStateRef, { days: next, activeSessionId: sessionId, updatedAt: Date.now() }, { merge: true }); } catch { window.alert("Passet kunde inte öppnas igen. Försök igen."); return; }
    setDayRecords(next); localStorage.setItem("rk-kassa-days", JSON.stringify(next));
    setActiveSessionId(sessionId); localStorage.setItem("rk-kassa-active-session", sessionId); setHistorySessionId(sessionId);
  }

  async function startNewSession() {
    const sessionId = sessionIdForDate(new Date());
    try { await setDoc(kassaStateRef, { activeSessionId: sessionId, updatedAt: Date.now() }, { merge: true }); } catch { window.alert("Det nya passet kunde inte startas. Försök igen."); return; }
    setActiveSessionId(sessionId); localStorage.setItem("rk-kassa-active-session", sessionId); setHistoryDay(todayKey); setHistorySessionId(sessionId); setView("home");
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    setMenu(false);
  }

  function openLineEditor(index: number) {
    const line = cart[index];
    const [categoryName, subcategoryName = ""] = line.name.split(" – ", 2);
    const product = products.find((item) => item.name === categoryName);
    setEditingLine(index); setEditPrice(String(line.price)); setEditQty(line.qty || 1); setEditCategoryName(product?.name || categoryName); setEditSubcategoryName(product?.subcategories.some((item) => item.name === subcategoryName) ? subcategoryName : "");
  }

  function saveLine() {
    if (editingLine === null || !Number(editPrice) || editQty < 1) return;
    setCart((lines) => lines.map((line, index) => index === editingLine ? { ...line, name: editSubcategoryName ? `${editCategoryName} – ${editSubcategoryName}` : editCategoryName, price: Number(editPrice), qty: editQty } : line));
    setEditingLine(null);
  }

  function calcPress(key: string) {
    const apply = (a: number, op: string, b: number) => op === "+" ? a + b : op === "−" ? a - b : op === "×" ? a * b : b === 0 ? 0 : a / b;
    const tidy = (value: number) => String(Number(value.toFixed(6)));
    const showCurrent = (next: string) => {
      setCalcValue(next);
      if (calcStored !== null && calcOp) {
        const answer = tidy(apply(calcStored, calcOp, Number(next)));
        setCalcHistory(`${calcExpression}${next}=${answer}`); setCalcAnswer(answer);
      } else { setCalcHistory(next); setCalcAnswer(next); }
    };
    if (/^\d$/.test(key) || key === ".") {
      if (calcJustEquals) {
        const next = key === "." ? "0." : key;
        setCalcStored(null); setCalcOp(null); setCalcExpression(""); setCalcJustEquals(false); showCurrent(next); return;
      }
      if (key === "." && calcValue.includes(".")) return;
      const next = calcValue === "0" ? (key === "." ? "0." : key) : `${calcValue}${key}`;
      showCurrent(next); return;
    }
    if (key === "C") { setCalcValue("0"); setCalcStored(null); setCalcOp(null); setCalcExpression(""); setCalcHistory("0"); setCalcAnswer("0"); setCalcJustEquals(false); return; }
    if (key === "⌫") {
      if (calcJustEquals) return calcPress("C");
      const next = calcValue.length > 1 ? calcValue.slice(0, -1) : "0"; showCurrent(next); return;
    }
    if (key === "=") {
      if (calcStored === null || !calcOp) return;
      const full = `${calcExpression}${calcValue}`; const answer = tidy(apply(calcStored, calcOp, Number(calcValue)));
      setCalcHistory(`${full}=${answer}`); setCalcAnswer(answer); setCalcValue(answer); setCalcStored(null); setCalcOp(null); setCalcExpression(full); setCalcJustEquals(true); return;
    }
    if (calcJustEquals) {
      setCalcStored(Number(calcValue)); setCalcOp(key); setCalcExpression(`${calcValue}${key}`); setCalcHistory(calcValue); setCalcValue("0"); setCalcJustEquals(false); return;
    }
    if (calcStored !== null && calcOp) {
      if (calcValue === "0") { setCalcOp(key); setCalcExpression(`${calcExpression.slice(0,-1)}${key}`); return; }
      const answer = tidy(apply(calcStored, calcOp, Number(calcValue))); const full = `${calcExpression}${calcValue}`;
      setCalcStored(Number(answer)); setCalcOp(key); setCalcExpression(`${full}${key}`); setCalcHistory(`${full}=${answer}`); setCalcAnswer(answer); setCalcValue("0"); return;
    }
    setCalcStored(Number(calcValue)); setCalcOp(key); setCalcExpression(`${calcValue}${key}`); setCalcHistory(calcValue); setCalcAnswer(calcValue); setCalcValue("0"); setCalcJustEquals(false);
  }

  if (authLoading && !hasLoadedRemote) {
    return (
      <main className="login-screen">
        <section className="login-card">
          <h1>Laddar...</h1>
          <p>Kontrollerar inloggning.</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="login-screen">
        <section className="login-card">
          <img className="login-logo" src={assetPath("rk-upplands-bro-logo.png")} alt="Svenska Röda Korset Upplands-Bro" />
          <label htmlFor="login-user">Användarnamn</label>
          <input id="login-user" autoFocus autoComplete="username" placeholder="Skriv användarnamn" value={loginUsername} onChange={(event) => setLoginUsername(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void doLogin(); }} />
          <label htmlFor="login-pass">Lösenord</label>
          <input id="login-pass" type="password" autoComplete="current-password" placeholder="Skriv lösenord" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void doLogin(); }} />
          <div className="edit-actions" style={{ marginTop: "16px" }}>
            <button className="save-edit" onClick={doLogin}>Logga in</button>
          </div>
          {authError ? <p role="alert">{authError}</p> : null}
        </section>
      </main>
    );
  }

  return <main className="app">
    <header className="header">
      <button className="menu-button" aria-label="Öppna meny" onClick={() => setMenu(!menu)}><span/><span/><span/></button>
        <div className="rk-brand"><img className="rk-logo-image" src={assetPath("rk-upplands-bro-logo.png")} alt="Svenska Röda Korset Upplands-Bro" /></div>
      <button className="home-cashier-button" onClick={() => setCashierPicker(true)}><span>{currentCashier ? cashierIcon(currentCashier) : "👤"} KASSÖR</span><strong>{currentCashier?.name || "Välj kassör"}</strong></button>
      <button className="calculator-button" onClick={() => setCalculator(true)}><img className="painted-calculator-icon" src={assetPath("calculator-icon.png")} alt=""/><strong>Miniräknare</strong></button>
      {view !== "home" && <button className="home-button" onClick={() => setView("home")}><img className="painted-home-icon" src={assetPath("home-icon.png")} alt=""/><strong>Startsida</strong></button>}
    </header>

    {cropSource && <div className="edit-backdrop crop-backdrop" role="dialog" aria-modal="true" aria-label="Beskär kategoribild"><div className="crop-card"><header><div><h1>Anpassa bilden</h1><p>Dra bilden tills rätt del syns.</p></div><button aria-label="Stäng" onClick={() => setCropSource("")}>×</button></header><div ref={cropViewport} className="crop-viewport" onPointerDown={(event) => {event.currentTarget.setPointerCapture(event.pointerId);cropDrag.current={x:event.clientX,y:event.clientY,startX:cropOffset.x,startY:cropOffset.y}}} onPointerMove={(event) => {if(!cropDrag.current)return;setCropOffset(clampCropOffset(cropDrag.current.startX+event.clientX-cropDrag.current.x,cropDrag.current.startY+event.clientY-cropDrag.current.y))}} onPointerUp={() => {cropDrag.current=null}} onPointerCancel={() => {cropDrag.current=null}}><img src={cropSource} alt="Bild som beskärs" draggable={false} style={{transform:`translate(calc(-50% + ${cropOffset.x}px), calc(-50% + ${cropOffset.y}px)) scale(${cropZoom})`}}/></div><label className="crop-zoom"><strong>🔍 ZOOMA</strong><input type="range" min="1" max="3" step="0.05" value={cropZoom} onChange={(event) => {const zoom=Number(event.target.value);setCropZoom(zoom);setCropOffset((offset)=>clampCropOffset(offset.x,offset.y,zoom))}}/><output>{Math.round(cropZoom*100)}%</output></label><div className="crop-actions"><button onClick={() => setCropSource("")}>AVBRYT</button><button onClick={saveCroppedImage}>✓ ANVÄND BILDEN</button></div></div></div>}

    <audio ref={saleWhoosh} src={assetPath("sale-whoosh.mp3")} preload="auto"/>
    {saleComplete && <div className="sale-complete-overlay" role="status" aria-live="polite"><div className="flying-receipt"><span>SVENSKA RÖDA KORSET</span><b>✓ BETALT</b><i>━━━━━━━━</i><strong>KÖP KLART</strong></div><div className="sale-complete-message"><span>✓</span><strong>Köp klart!</strong><small>Pengarna är registrerade.</small></div></div>}

    {menu && <><button className="menu-backdrop" aria-label="Stäng menyn" onClick={() => setMenu(false)}/><nav className="side-menu"><button onClick={() => {setView("home");setMenu(false)}}>⌂ Startsida</button><button onClick={startSale}>＋ Starta försäljning</button><button className="refund-menu-button" onClick={openRefund}>↩ Retur / återbetalning</button><button onClick={() => {setHistoryDay(todayKey);setView("history");setMenu(false)}}>☷ Sålt idag</button><button onClick={() => {setView("days");setMenu(false)}}>▤ Alla dagar</button><button onClick={() => {setView("manage");setMenu(false)}}>⚙ Hantera</button><button onClick={toggleFullscreen}>{isFullscreen ? "⊙ Avsluta helskärm" : "⛶ HELSKÄRM"}</button><button onClick={doLogout}>⎋ Logga ut</button></nav></>}

    {view === "home" && <section className="home-view">
      <div className="home-sale-actions"><button className="sell-button" onClick={startSale}><span className="sell-icon">＋</span><strong>SÄLJA</strong></button>{previousSale && <button className="reopen-purchase-button" onClick={reopenPreviousSale}>↩ ÅTERGÅ TILL FÖREGÅENDE KÖP</button>}</div>
    </section>}

    {view === "sale" && <section className="sale-view">
      <div className={`sale-main${visibleProducts.length <= 9 && !selected && !choosingSubcategory ? " no-category-scroll" : ""}`}>
        <div className="products">{visibleProducts.map((p) => <button key={p.id} style={{background:p.color}} className={`${selected?.id === p.id ? "product selected" : "product"}${p.image ? " has-photo" : ""}`} onClick={() => chooseProduct(p)}>{p.image ? <img className="category-photo" src={p.image} alt=""/> : <span className="category-art" style={iconPosition(p.icon)}/>}<strong>{p.name}</strong>{p.subcategories.length > 0 && <small>{p.subcategories.length} underkategorier</small>}</button>)}</div>
        {selected && !choosingSubcategory && <div className="price-entry" role="dialog" aria-modal="true" aria-label={`Skriv pris för ${selected.name}`}><div className="price-title"><strong className="selected-product-name">{selected.name}{selectedSubcategory ? ` – ${selectedSubcategory.name}` : ""}</strong><div className="price-tools"><output>{price ? money(Number(price)) : "0 kr"}</output>{copiedValue && <button className="paste-price" onClick={() => setPrice(copiedValue)}><span className="paste-symbol" aria-hidden="true"/> KLISTRA IN {money(Number(copiedValue))}</button>}</div><button className="close-price" aria-label="Stäng prisinmatning" onClick={() => {setSelected(null);setSelectedSubcategory(null);setPrice("");setItemQty(1)}}>×</button></div><div className="number-pad">{KEYS.map((key) => <button key={key} className={key === "Rensa" ? "clear" : ""} onClick={() => typePrice(key)}>{key}</button>)}</div><div className="item-quantity"><button aria-label="Minska antal" onClick={() => setItemQty((qty) => Math.max(1, qty - 1))}>−</button><strong>ANTAL: {itemQty}</strong><button aria-label="Öka antal" onClick={() => setItemQty((qty) => Math.min(99, qty + 1))}>+</button></div><button className="add-button" disabled={!Number(price)} onClick={addLine}>LÄGG TILL VARA</button></div>}
      </div>
      <aside className="basket"><div className="basket-heading"><h2>Varor i köpet</h2>{!!cart.length && <button className="clear-cart-button" onClick={() => setClearCartConfirm(true)}>TÖM</button>}</div>{!cart.length ? <p className="empty-cart">Inga varor ännu</p> : <div className="basket-lines">{cart.map((line, i) => <div className="basket-line" key={`${line.name}-${i}`}><button className="line-edit" aria-label={`Ändra ${line.name}`} onClick={() => openLineEditor(i)}><span className="line-name"><strong>{line.name}</strong></span><small className="line-quantity">Antal: {line.qty || 1}</small><b>{money(line.price * (line.qty || 1))}</b></button><button className="line-remove" aria-label={`Ta bort ${line.name}`} onClick={() => setRemoveLine(i)}>×</button></div>)}</div>}<div className="basket-total"><span>Totalt</span><strong>{money(total)}</strong></div>
        {!!cart.length && <div className="payment"><h2>3. Hur betalar kunden?</h2><div><button className={payment === "Swish" ? "chosen" : ""} onClick={() => setPayment("Swish")}><img className="swish-icon" src="/swish.png" alt=""/><strong>SWISH</strong></button><button className={payment === "Kontant" ? "chosen" : ""} onClick={() => setPayment("Kontant")}><span>💵</span><strong>KONTANT</strong></button></div><button className="finish-button" disabled={!payment || savingSale} onClick={finishSale}>{savingSale ? "SPARAR KÖPET…" : "KLART – SPARA KÖPET"}</button></div>}
      </aside>
    </section>}

    {choosingSubcategory && selected && <div className="edit-backdrop" role="dialog" aria-modal="true" aria-label={`Välj underkategori för ${selected.name}`}><div className="subcategory-card"><header><div>{selected.image ? <img className="category-photo" src={selected.image} alt=""/> : <span className="category-art" style={iconPosition(selected.icon)}/>}<h1>{selected.name}</h1></div><button aria-label="Stäng" onClick={() => {setChoosingSubcategory(false);setSelected(null)}}>×</button></header><p>Välj underkategori – eller fortsätt med bara {selected.name}.</p><div className="subcategory-options"><button className="parent-category-choice" style={{backgroundColor:selected.color}} onClick={() => {setSelectedSubcategory(null);setChoosingSubcategory(false)}}><strong>{selected.name}</strong><small>Ingen underkategori</small></button>{selected.subcategories.map((subcategory) => <button key={subcategory.id} style={{backgroundColor:selected.color}} onClick={() => {if (subcategory.staticPrice) { addStaticSubcategory(selected, subcategory); } else { setSelectedSubcategory(subcategory); setChoosingSubcategory(false); }}}><strong>{subcategory.name}</strong>{subcategory.staticPrice ? <small>Fast pris: {money(subcategory.staticPrice)}</small> : null}</button>)}</div></div></div>}

    {view === "days" && <section className="days-view"><h1>Alla dagar</h1><p>Tryck på en dag för att se eller ändra den.</p>{!allDayKeys.length ? <div className="no-sales">Inga dagar sparade ännu.</div> : <div className="day-posts">{allDayKeys.map((key) => { const entries = sales.filter((sale) => dayKey(new Date(sale.id)) === key); const sum = entries.reduce((total, sale) => total + saleTotal(sale), 0); const closed = dayRecords.find((day) => day.date === key); return <button key={key} onClick={() => {setHistoryDay(key);setView("history")}}><span><strong>{dayLabel(key)}</strong><small>{closed ? "Avslutad dag" : "Pågående dag"} · {entries.length} poster</small></span><b>{money(sum)}</b><em>›</em></button>})}</div>}</section>}

{view === "stats" && <section className="stats-view"><div className="stats-heading"><div><h1>Statistik</h1><p>Se vad som säljer bäst, när kunderna handlar och hur pengarna kommer in.</p></div><div className="stats-controls"><label>En dag<select aria-label="Välj dag" value={statsDay} onChange={(event) => {setStatsDay(event.target.value);setStatsMonth("all");setStatsFrom("");setStatsTo("")}}><option value="all">Välj en dag</option>{availableStatsDays.map((day) => <option key={day} value={day}>{dayLabel(day)}</option>)}</select></label><label>Från datum<input type="date" value={statsFrom} max={statsTo || undefined} onChange={(event) => {setStatsDay("all");setStatsMonth("all");setStatsFrom(event.target.value)}}/></label><label>Till datum<input type="date" value={statsTo} min={statsFrom || undefined} onChange={(event) => {setStatsDay("all");setStatsMonth("all");setStatsTo(event.target.value)}}/></label><select aria-label="Välj månad" value={statsMonth} onChange={(event) => {setStatsDay("all");setStatsFrom("");setStatsTo("");setStatsMonth(event.target.value)}}><option value="all">Alla månader</option>{availableStatsMonths.map((month) => <option key={month.key} value={month.key}>{month.label}</option>)}</select><div className="stats-ranges"><button className={statsDay === "all" && !statsFrom && !statsTo && statsMonth === "all" && statsRange === "30" ? "chosen" : ""} onClick={() => {setStatsDay("all");setStatsMonth("all");setStatsFrom("");setStatsTo("");setStatsRange("30")}}>30 dagar</button><button className={statsDay === "all" && !statsFrom && !statsTo && statsMonth === "all" && statsRange === "90" ? "chosen" : ""} onClick={() => {setStatsDay("all");setStatsMonth("all");setStatsFrom("");setStatsTo("");setStatsRange("90")}}>90 dagar</button><button className={statsDay === "all" && !statsFrom && !statsTo && statsMonth === "all" && statsRange === "all" ? "chosen" : ""} onClick={() => {setStatsDay("all");setStatsMonth("all");setStatsFrom("");setStatsTo("");setStatsRange("all")}}>Alltid</button></div></div></div>{!statsSales.length ? <div className="no-sales">Det finns ännu ingen försäljning för det här urvalet.</div> : <><div className="stats-summary"><article><span>OMSÄTTNING</span><strong>{money(statsRevenue)}</strong></article><article><span>KUNDER</span><strong>{statsCustomers}</strong></article><article><span>SÅLDA VAROR</span><strong>{statsItems} st</strong></article><article><span>SNITTKÖP</span><strong>{money(statsCustomers ? Math.round(statsRevenue / statsCustomers) : 0)}</strong></article><article><span>STÖRSTA KÖPET</span><strong>{money(statsLargestSale)}</strong></article><article><span>VAROR / KUND</span><strong>{statsAverageItems} st</strong></article><article><span>AKTIVA DAGAR</span><strong>{statsActiveDays} st</strong></article><article><span>ÅTERBETALT</span><strong>{money(statsRefundTotal)}</strong><small>{statsRefunds.length} returer</small></article></div><div className="stats-insight"><strong>Just nu säljer bäst:</strong> {productRanking[0]?.name || "–"} <b>{productRanking[0] ? `(${productRanking[0].units} st)` : ""}</b></div><div className="stats-visuals"><article className="stats-payment"><h2>Betalsätt</h2><DonutChart cash={statsCash} swish={statsSwish}/></article><article className="stats-card stats-highlight"><h2>Snabb läsning</h2><p><b>{productRanking[0]?.name || "–"}</b> säljer bäst just nu.</p><p><b>{weakestProductRanking[0]?.name || "–"}</b> säljer minst och kan behöva nytt pris eller bättre placering.</p><p>Under perioden har ni i snitt sålt för <b>{money(statsActiveDays ? Math.round(statsRevenue / statsActiveDays) : 0)}</b> per aktiv dag.</p></article></div><div className="stats-grid"><StatsCard title="Populäraste varor" rows={productRanking} unit="st"/><StatsCard title="Minst sålda varor" rows={weakestProductRanking} unit="st"/><StatsCard title="Starkaste kategorier" rows={categoryRanking} unit="st"/><StatsCard title="Omsättning per månad" rows={monthlyRevenue.map((item) => ({ name: item.label, revenue: item.value, units: 0 }))} moneyOnly/><StatsCard title="Omsättning per dag" rows={dailyRevenue.map((item) => ({ name: item.label, revenue: item.value, units: 0 }))} moneyOnly/><StatsCard title="Bästa veckodagar" rows={weekdayRevenue.map((item) => ({ name: item.label, revenue: item.value, units: 0 }))} moneyOnly/><StatsCard title="När handlar kunderna?" rows={hourlyRevenue.map((item) => ({ name: `${item.label}:00`, revenue: item.value, units: 0 }))} moneyOnly/><StatsCard title="Kassörernas försäljning" rows={cashierRanking} unit="köp"/></div></>}</section>}

    {view === "manage" && <section className="manage-view"><h1>Hantera</h1><p>Välj vad du vill ändra.</p><div className="manage-options"><button onClick={() => setManageCategories(true)}><span className="manage-option-icon">▦</span><strong>Hantera kategorier</strong><small>Lägg till, ändra eller ta bort kategorier</small><em>›</em></button><button onClick={() => setView("sort")}><span className="manage-option-icon">↕</span><strong>Sortera kategorier</strong><small>Dra kategorierna till önskad ordning</small><em>›</em></button><button onClick={() => setManageCashiers(true)}><span className="manage-option-icon">👤</span><strong>Hantera kassörer</strong><small>Lägg till eller ta bort kassörer</small><em>›</em></button>{isAdmin && <button onClick={() => setView("stats")}><span className="manage-option-icon">▥</span><strong>Statistik</strong><small>Försäljning, trender och populära varor</small><em>›</em></button>}{isAdmin && <button onClick={() => setManageUsers(true)}><span className="manage-option-icon">🧑</span><strong>Hantera användare</strong><small>Lägg till, inaktivera eller ta bort användare</small><em>›</em></button>}{isHeadAdmin && <button onClick={() => setView("user-log")}><span className="manage-option-icon">◷</span><strong>Användarlogg</strong><small>Se när kontona senast loggade in</small><em>›</em></button>}</div></section>}

    {view === "user-log" && isHeadAdmin && <section className="manage-view user-log-view"><h1>Användarlogg</h1><p>De 20 senaste inloggningarna, nyaste först.</p>{!loginEvents.length ? <div className="no-sales">Inga inloggningar har registrerats ännu.</div> : <div className="user-log-list">{[...loginEvents].reverse().map((event, index) => <article key={`${event.username}-${event.at}-${index}`}><span>👤</span><strong>{event.username}</strong><small>{new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.at))}</small></article>)}</div>}</section>}

    {view === "sort" && <section className="sort-view"><div className="sort-heading"><div><h1>Sortera kategorier</h1><p>Håll fingret på en kategori och dra den till rätt plats.</p></div><button onClick={() => setView("manage")}>✓ KLAR</button></div><div className="sort-grid" onPointerMove={(event) => moveCategoryAtPoint(event.clientX,event.clientY)} onPointerUp={() => setDraggingCategory(null)} onPointerCancel={() => setDraggingCategory(null)}>{products.map((product) => <button type="button" data-sort-id={product.id} key={product.id} style={{backgroundColor:product.color}} className={draggingCategory === product.id ? "sort-category dragging" : "sort-category"} onPointerDown={(event) => {event.currentTarget.setPointerCapture(event.pointerId);setDraggingCategory(product.id)}}><span className="drag-handle">☰</span>{product.image ? <img className="category-photo" src={product.image} alt=""/> : <span className="category-art" style={iconPosition(product.icon)}/>}<strong>{product.name}</strong></button>)}</div></section>}

{view === "history" && (
  <section className="history-view">
    <div className="print-day-sheet print-day-detail">
      <div className="print-day-brand"><img src={assetPath("rk-upplands-bro-logo.png")} alt="Svenska Röda Korset Upplands-Bro"/></div>
      <div className="print-day-meta"><strong>Dag: {dayLabel(historyDay)}</strong></div>
      <table>
        <thead><tr><th></th><th>Kontant</th><th>Swish</th></tr></thead>
        <tbody>
          {historyPrintRows.map((row) => row.type === "purchase"
            ? <tr className="print-purchase-row" key={row.id}><td colSpan={3}>{row.label}</td></tr>
            : <tr key={row.id}><td>{row.name}{row.qty > 1 ? ` ×${row.qty}` : ""}</td><td>{row.cash ? money(row.cash) : ""}</td><td>{row.swish ? money(row.swish) : ""}</td></tr>)}
          {Array.from({ length: Math.max(0, 20 - historyPrintRows.length) }, (_, index) => <tr className="print-empty-row" key={`empty-${index}`}><td></td><td></td><td></td></tr>)}
        </tbody>
        <tfoot><tr><th>Totalt</th><th>{money(historyCash)}</th><th>{money(historySwish)}</th></tr><tr className="print-purchase-count-row"><td></td><td>Antal: <b>{historyCashPurchases}</b></td><td>Antal: <b>{historySwishPurchases}</b></td></tr></tfoot>
      </table>
      <div className="print-grand-total">SUMMA TOTALT: <strong>{money(historyTotal)}</strong></div>
    </div>
    <div className="print-day-sheet print-day-summary">
      <div className="print-day-brand"><img src={assetPath("rk-upplands-bro-logo.png")} alt="Svenska Röda Korset Upplands-Bro"/></div>
      <div className="print-day-meta"><strong>Dag: {dayLabel(historyDay)}</strong></div>
      <table className="print-summary-table">
        <thead><tr><th></th><th>Kontant</th><th>Swish</th></tr></thead>
        <tbody>
          {historySales.map((sale) => <tr key={sale.id}><td>{sale.time}</td><td>{sale.payment === "Kontant" ? money(saleTotal(sale)) : ""}</td><td>{sale.payment === "Swish" ? money(saleTotal(sale)) : ""}</td></tr>)}
          {Array.from({ length: Math.max(0, 20 - historySales.length) }, (_, index) => <tr className="print-empty-row" key={`summary-empty-${index}`}><td></td><td></td><td></td></tr>)}
        </tbody>
        <tfoot><tr><th>Totalt</th><th>{money(historyCash)}</th><th>{money(historySwish)}</th></tr><tr className="print-purchase-count-row"><td></td><td>Antal: <b>{historyCashPurchases}</b></td><td>Antal: <b>{historySwishPurchases}</b></td></tr></tfoot>
      </table>
      <div className="print-grand-total">SUMMA TOTALT: <strong>{money(historyTotal)}</strong></div>
    </div>
    <div className="history-top">
      <div><h1>{historyDay === todayKey ? "Sålt idag" : "Dagens försäljning"}</h1><p className="history-date">{dayLabel(historyDay)}</p><label className="session-picker">Visa <select value={historySessionId} onChange={(event) => setHistorySessionId(event.target.value)}><option value="all">Hela dagen</option>{historySessions.map((session, index) => <option key={session.id} value={session.id}>{session.closed ? `Avslut ${index + 1}` : "Pågående pass"}</option>)}</select></label></div>
      <div className="history-actions">
        {historyClosed ? <button className="reopen-day-button" onClick={reopenDay}>↻ FORTSÄTT DETTA PASS</button> : historyHasActiveSession && historySessionId !== "all" ? <button className="end-day-button" onClick={() => setEndDayConfirm(true)}>✓ AVSLUTA PASSET</button> : historyDay === todayKey && !historyHasActiveSession ? <button className="reopen-day-button" onClick={startNewSession}>＋ STARTA NYTT PASS</button> : null}
        <button className="print-day-button" onClick={() => printHistory("detailed")}>🖨 SKRIV UT DETALJER</button>
        <button className="print-day-button" onClick={() => printHistory("summary")}>🖨 SKRIV UT ÖVERSIKT</button>
      </div>
    </div>
    <div className="day-stats"><article><span>TOTALT</span><strong>{money(historyTotal)}</strong></article><article className="cash-stat"><span>💵 KONTANT</span><strong>{money(historyCash)}</strong></article><article className="swish-stat"><span><img src="/swish.png" alt=""/> SWISH</span><strong>{money(historySwish)}</strong></article><article className="items-stat"><span>▦ SÅLDA VAROR</span><strong>{historyItems} st</strong></article><article className="customers-stat"><span>👤 KUNDER</span><strong>{historyCustomers} st</strong></article></div>
    {!historySales.length ? <div className="no-sales">Inga poster registrerade denna dag.</div> : <div className="sales-list">{historySales.map((sale) => <article className={sale.kind === "refund" ? "refund-entry" : ""} key={sale.id}><header><strong>{sale.kind === "refund" ? "↩ Återbetalning" : "Köp"} klockan {sale.time}</strong><span className={sale.payment === "Swish" ? "pay swish" : "pay cash"}>{sale.payment === "Swish" ? <img className="history-swish" src="/swish.png" alt=""/> : "💵"} {sale.payment}</span></header>{sale.lines.map((line, i) => <div key={i}><span>{line.name}{(line.qty || 1) > 1 ? ` · ${line.qty} st` : ""}</span><strong>{sale.kind === "refund" ? "−" : ""}{money(line.price * (line.qty || 1))}</strong></div>)}<footer><span>{sale.kind === "refund" ? "Återbetalat" : "Totalt"}</span><strong>{money(saleTotal(sale))}</strong><button onClick={() => setSaleDraft(structuredClone(sale))}>ÄNDRA POST</button></footer></article>)}</div>}
  </section>
)}

    {cashierPicker && <div className="edit-backdrop" role="dialog" aria-modal="true" aria-label="Välj kassör"><div className="cashier-card"><header><h1>Välj kassör</h1><button aria-label="Stäng" onClick={() => setCashierPicker(false)}>×</button></header><div className="cashier-picker-list">{cashiers.map((cashier) => <button key={cashier.id} className={cashier.id === currentCashierId ? "chosen" : ""} onClick={() => selectCashier(cashier.id)}><span>{cashierIcon(cashier)}</span><strong>{cashier.name}</strong>{cashier.id === currentCashierId && <small>AKTIV</small>}</button>)}</div></div></div>}
    {manageCashiers && <div className="edit-backdrop" role="dialog" aria-modal="true" aria-label="Hantera kassörer"><div className="cashier-card"><header><h1>Hantera kassörer</h1><button aria-label="Stäng" onClick={() => setManageCashiers(false)}>×</button></header><div className="new-cashier"><input autoFocus value={newCashierName} onChange={(e) => setNewCashierName(e.target.value.slice(0,30))} onKeyDown={(e) => {if(e.key === "Enter"){e.preventDefault();addCashier()}}} placeholder="Namn på kassör"/><div className="cashier-icon-choice"><button className={newCashierIcon === "woman" ? "chosen" : ""} aria-label="Kvinna" onClick={() => setNewCashierIcon("woman")}>👩</button><button className={newCashierIcon === "man" ? "chosen" : ""} aria-label="Man" onClick={() => setNewCashierIcon("man")}>👨</button></div><button disabled={!newCashierName.trim()} onClick={addCashier}>＋ LÄGG TILL</button></div><div className="cashier-manage-list">{cashiers.map((cashier) => <div key={cashier.id} className={cashier.id === currentCashierId ? "active" : ""}><button className="cashier-select" onClick={() => selectCashier(cashier.id)}>{cashierIcon(cashier)} <strong>{cashier.name}</strong>{cashier.id === currentCashierId && <small>AKTIV</small>}</button><button className="cashier-edit" aria-label={`Ändra ${cashier.name}`} onClick={() => openCashierEditor(cashier)}>✎</button><button className="cashier-remove" disabled={cashiers.length === 1} aria-label={`Ta bort ${cashier.name}`} onClick={() => removeCashier(cashier.id)}>×</button></div>)}</div></div></div>}
    {editingCashier && <div className="edit-backdrop" role="dialog" aria-modal="true" aria-label="Ändra kassör"><div className="edit-card cashier-edit-card"><h1>Ändra kassör</h1><label htmlFor="cashier-edit-name">Namn</label><input id="cashier-edit-name" autoFocus value={cashierEditName} onChange={(event) => setCashierEditName(event.target.value.slice(0, 30))}/><label>Välj ikon</label><div className="cashier-icon-choice large"><button className={cashierEditIcon === "woman" ? "chosen" : ""} onClick={() => setCashierEditIcon("woman")}>👩 <span>Kvinna</span></button><button className={cashierEditIcon === "man" ? "chosen" : ""} onClick={() => setCashierEditIcon("man")}>👨 <span>Man</span></button></div><div className="edit-actions"><button className="cancel-edit" onClick={() => setEditingCashier(null)}>Avbryt</button><button className="save-edit" disabled={!cashierEditName.trim()} onClick={saveCashierEdit}>SPARA</button></div></div></div>}
    {manageUsers && isAdmin && <div className="edit-backdrop" role="dialog" aria-modal="true" aria-label="Hantera användare"><div className="cashier-card"><header><h1>Hantera användare</h1><button aria-label="Stäng" onClick={() => setManageUsers(false)}>×</button></header><p className="password-note">Lösenord visas aldrig, men en admin kan alltid byta dem.</p><div className="new-cashier user-create"><input autoFocus value={newUsername} onChange={(e) => setNewUsername(e.target.value.slice(0, 32))} onKeyDown={(e) => {if (e.key === "Enter") {e.preventDefault(); createUser();}}} placeholder="Användarnamn"/><input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value.slice(0, 30))} placeholder="Lösenord"/><select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as "admin" | "cashier")}>{["admin","cashier"].map((role) => <option key={role} value={role}>{role}</option>)}</select><button disabled={!newUsername.trim() || !newUserPassword.trim()} onClick={createUser}>＋ Lägg till användare</button></div><div className="cashier-manage-list user-manage-list">{users.map((item) => <div key={item.id} className={item.isActive ? "active" : ""}><button className="cashier-select">👤 <strong>{item.username}</strong> ({item.role}) {item.isActive ? <small>AKTIV</small> : <small>INAKTIV</small>}</button><button className="password-change" aria-label={`Byt lösenord för ${item.username}`} onClick={() => {setPasswordUser(item);setReplacementPassword("")}}>🔑</button><button className="cashier-remove" disabled={item.id === user?.id} aria-label={`Ta bort ${item.username}`} onClick={() => removeUser(item.id)}>×</button></div>)}</div></div></div>}
    {passwordUser && <div className="edit-backdrop" role="dialog" aria-modal="true" aria-label={`Byt lösenord för ${passwordUser.username}`}><div className="edit-card password-card"><h1>Byt lösenord</h1><p><strong>{passwordUser.username}</strong></p><label htmlFor="replacement-password">Nytt lösenord</label><input id="replacement-password" type="password" autoFocus value={replacementPassword} onChange={(event) => setReplacementPassword(event.target.value.slice(0, 64))} onKeyDown={(event) => {if(event.key === "Enter") void changeUserPassword()}} placeholder="Skriv nytt lösenord"/><small>Det gamla lösenordet visas inte av säkerhetsskäl.</small><div className="edit-actions"><button className="cancel-edit" onClick={() => {setPasswordUser(null);setReplacementPassword("")}}>Avbryt</button><button className="save-edit" disabled={!replacementPassword.trim()} onClick={() => void changeUserPassword()}>SPARA NYTT</button></div></div></div>}
    {refundOpen && <div className="edit-backdrop" role="dialog" aria-modal="true" aria-label="Registrera retur eller återbetalning"><div className="refund-card"><header><div><span className="refund-symbol" aria-hidden="true"/><h1>Retur / återbetalning</h1></div><button aria-label="Stäng" onClick={() => setRefundOpen(false)}>×</button></header><div className="refund-fields"><label htmlFor="refund-amount">Belopp</label><div className="refund-amount"><input id="refund-amount" inputMode="numeric" autoFocus value={refundAmount} onChange={(e) => setRefundAmount(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="0"/><span>kr</span></div><label htmlFor="refund-reason">Anledning</label><input id="refund-reason" className="refund-reason" value={refundReason} onChange={(e) => setRefundReason(e.target.value.slice(0, 40))} placeholder="Till exempel: Vara återlämnad"/></div><h2>Hur får kunden pengarna?</h2><div className="refund-payment"><button className="refund-swish-disabled" disabled aria-disabled="true"><img src="/swish.png" alt=""/> SWISH <small>Ej möjligt</small></button><button className={refundPayment === "Kontant" ? "chosen" : ""} onClick={() => setRefundPayment("Kontant")}>💵 KONTANT</button><button className={refundPayment === "Banköverföring" ? "chosen refund-bank-transfer" : "refund-bank-transfer"} onClick={() => setRefundPayment("Banköverföring")}><span aria-hidden="true">🏦</span> BANKÖVERFÖRING</button></div><div className="refund-actions"><button className="cancel-edit" onClick={() => setRefundOpen(false)}>AVBRYT</button><button className="save-refund" disabled={!Number(refundAmount)} onClick={saveRefund}>REGISTRERA ÅTERBETALNING</button></div></div></div>}
    {editingLine !== null && <div className="edit-backdrop" role="dialog" aria-modal="true" aria-label="Ändra vara"><div className="edit-card"><h1>Ändra vara</h1><label htmlFor="edit-category">Kategori</label><select id="edit-category" className="edit-category-select" value={editCategoryName} onChange={(e) => {setEditCategoryName(e.target.value);setEditSubcategoryName("")}}>{products.map((product) => <option key={product.id} value={product.name}>{product.name}</option>)}</select>{products.find((product) => product.name === editCategoryName)?.subcategories.length ? <><label htmlFor="edit-subcategory">Underkategori</label><select id="edit-subcategory" className="edit-category-select" value={editSubcategoryName} onChange={(e) => setEditSubcategoryName(e.target.value)}><option value="">Ingen underkategori</option>{products.find((product) => product.name === editCategoryName)?.subcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.name}>{subcategory.name}</option>)}</select></> : null}<label>Antal</label><div className="quantity"><button onClick={() => setEditQty((q) => Math.max(1, q - 1))}>−</button><output>{editQty}</output><button onClick={() => setEditQty((q) => q + 1)}>+</button></div><label htmlFor="edit-price">Pris per styck</label><div className="edit-price"><input id="edit-price" inputMode="numeric" value={editPrice} onChange={(e) => setEditPrice(e.target.value.replace(/\D/g, "").slice(0, 6))}/><span>kr</span></div><div className="edit-actions"><button className="cancel-edit" onClick={() => setEditingLine(null)}>Avbryt</button><button className="save-edit" onClick={saveLine}>SPARA</button></div></div></div>}
    {removeLine !== null && <div className="edit-backdrop" role="alertdialog" aria-modal="true" aria-label="Bekräfta borttagning"><div className="confirm-card"><div className="warning">!</div><h1>Ta bort varan?</h1><p>Vill du ta bort <strong>{cart[removeLine]?.name}</strong> från köpet?</p><div className="edit-actions"><button className="cancel-edit" onClick={() => setRemoveLine(null)}>Nej, behåll</button><button className="remove-confirm" onClick={() => {setCart((c) => c.filter((_, n) => n !== removeLine));setRemoveLine(null)}}>JA, TA BORT</button></div></div></div>}
    {clearCartConfirm && <div className="edit-backdrop" role="alertdialog" aria-modal="true" aria-label="Bekräfta töm kundvagnen"><div className="confirm-card"><div className="warning">!</div><h1>{returningSaleId ? "Ta bort köpet?" : "Töm kundvagnen?"}</h1><p>{returningSaleId ? "Det föregående köpet tas bort helt." : "Alla varor i det pågående köpet tas bort."}</p><div className="edit-actions"><button className="cancel-edit" onClick={() => setClearCartConfirm(false)}>Nej, behåll</button><button className="remove-confirm" onClick={() => void clearCart()}>{returningSaleId ? "JA, TA BORT KÖPET" : "JA, TÖM"}</button></div></div></div>}
    {swishConfirm && <div className="edit-backdrop" role="alertdialog" aria-modal="true" aria-label="Kontrollera Swish-betalning"><div className="confirm-card swish-confirm-card"><img src="/swish.png" alt="Swish"/><h1>Kontrollera Swish</h1><p>Kontrollera att kunden verkligen har swishat <strong>{money(total)}</strong> innan du sparar köpet.</p><div className="edit-actions"><button className="cancel-edit" onClick={() => setSwishConfirm(false)}>AVBRYT</button><button className="save-edit" disabled={savingSale} onClick={() => void saveCompletedSale()}>{savingSale ? "SPARAR…" : "✓ JAG HAR SETT BETALNINGEN"}</button></div></div></div>}
    {manageCategories && <div className="edit-backdrop" role="dialog" aria-modal="true" aria-label="Hantera kategorier"><div className="manage-category-card"><header><h1>Hantera kategorier</h1><button aria-label="Stäng" onClick={() => setManageCategories(false)}>×</button></header><button className="new-category-button" onClick={() => {setCategoryName("");setCategoryIcon(5);setCategoryColor(PASTEL_COLORS[0]);setCategorySubcategories([]);setNewSubcategory("");setNewSubcategoryStatic(false);setNewSubcategoryPrice("");setCategoryImage("");setCategoryImageError("");setEditingCategory(null);setManageCategories(false);setAddCategory(true)}}>＋ LÄGG TILL KATEGORI</button><div className="manage-category-list">{products.map((product) => <div style={{backgroundColor:product.color}} className={product.hidden ? "category-is-hidden" : ""} key={product.id}>{product.image ? <img className="category-photo" src={product.image} alt=""/> : <span className="category-art" style={iconPosition(product.icon)}/>}<strong>{product.name}{product.hidden && <small className="category-hidden-label">DOLD</small>}</strong><button className="category-visibility-button" onClick={() => void toggleCategoryVisibility(product)}>{product.hidden ? "VISA" : "DÖLJ"}</button><button className="category-edit-button" onClick={() => {setCategoryName(product.name);setCategoryIcon(product.icon);setCategoryColor(product.color);setCategorySubcategories(normalizeSubcategories(product.subcategories));setNewSubcategory("");setNewSubcategoryStatic(false);setNewSubcategoryPrice("");setCategoryImage(product.image || "");setCategoryImageError("");setEditingCategory(product);setManageCategories(false);setAddCategory(true)}}>ÄNDRA</button><button className="category-delete-button" aria-label={`Ta bort ${product.name}`} onClick={() => {setDeleteCategory(product);setManageCategories(false)}}>×</button></div>)}</div></div></div>}
    {addCategory && <div className="edit-backdrop" role="dialog" aria-modal="true" aria-label={editingCategory ? "Ändra kategori" : "Lägg till kategori"}><div className="category-card"><h1>{editingCategory ? "Ändra kategori" : "Lägg till kategori"}</h1><label htmlFor="category-name">Namn på kategorin</label><input id="category-name" value={categoryName} onChange={(e) => setCategoryName(e.target.value.slice(0, 24))} placeholder="Till exempel: Prydnader" autoFocus/><h2>Underkategorier <small>(frivilligt)</small></h2><div className="subcategory-editor"><div><input value={newSubcategory} onChange={(e) => setNewSubcategory(e.target.value.slice(0,24))} onKeyDown={(e) => {if(e.key === "Enter"){e.preventDefault();addSubcategory()}}} placeholder="Till exempel: Glas"/><label className="static-subcategory-toggle"><input type="checkbox" checked={newSubcategoryStatic} onChange={(e) => setNewSubcategoryStatic(e.target.checked)}/>Fast pris</label>{newSubcategoryStatic && <input className="static-price-input" inputMode="numeric" value={newSubcategoryPrice} onChange={(e) => setNewSubcategoryPrice(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Pris kr"/>}<button disabled={!newSubcategory.trim() || (newSubcategoryStatic && !Number(newSubcategoryPrice))} onClick={addSubcategory}>＋ LÄGG TILL</button></div>{categorySubcategories.length > 0 && <div className="subcategory-tags">{categorySubcategories.map((subcategory) => <span key={subcategory.id}>{subcategory.name}{subcategory.staticPrice ? ` · ${money(subcategory.staticPrice)}` : ""}<button aria-label={`Ta bort ${subcategory.name}`} onClick={() => setCategorySubcategories((items) => items.filter((item) => item.id !== subcategory.id))}>×</button></span>)}</div>}</div><h2>Egen bild <small>(frivilligt)</small></h2><div className="category-upload">{categoryImage && <img src={categoryImage} alt="Förhandsvisning av kategoribild"/>}<label><input type="file" accept="image/*" onChange={(event) => {uploadCategoryImage(event.target.files?.[0]);event.currentTarget.value=""}}/>📷 {categoryImage ? "BYT BILD" : "LADDA UPP BILD"}</label>{categoryImage && <button onClick={() => {setCategoryImage("");setCategoryImageError("")}}>TA BORT BILD</button>}{categoryImageError && <p role="alert">{categoryImageError}</p>}</div><h2>Välj bakgrundsfärg</h2><div className="color-picker">{PASTEL_COLORS.map((color,index) => <button key={color} style={{backgroundColor:color}} className={categoryColor === color ? "picked" : ""} onClick={() => setCategoryColor(color)} aria-label={`Välj ${PASTEL_COLOR_NAMES[index]}`} title={PASTEL_COLOR_NAMES[index]}>{categoryColor === color ? "✓" : ""}</button>)}</div><h2>Välj illustration <small>(används utan egen bild)</small></h2><div className="icon-picker">{Array.from({length:54},(_, icon) => <button key={icon} style={{backgroundColor:categoryColor}} className={categoryIcon === icon ? "picked" : ""} onClick={() => setCategoryIcon(icon)} aria-label={`Välj bild ${icon + 1}`}><span className="category-art" style={iconPosition(icon)}/></button>)}</div><div className="edit-actions"><button className="cancel-edit" onClick={() => {setAddCategory(false);setEditingCategory(null);setManageCategories(true)}}>Avbryt</button><button className="save-edit" disabled={!categoryName.trim()} onClick={saveCategory}>{editingCategory ? "SPARA" : "LÄGG TILL"}</button></div></div></div>}
    {deleteCategory && <div className="edit-backdrop" role="alertdialog" aria-modal="true" aria-label="Bekräfta borttagning av kategori"><div className="confirm-card"><div className="warning">!</div><h1>Ta bort kategorin?</h1><p>Vill du ta bort <strong>{deleteCategory.name}</strong>?</p><div className="edit-actions"><button className="cancel-edit" onClick={() => {setDeleteCategory(null);setManageCategories(true)}}>Nej, behåll</button><button className="remove-confirm" onClick={() => removeCategory(deleteCategory)}>JA, TA BORT</button></div></div></div>}
    {saleDraft && <div className="edit-backdrop" role="dialog" aria-modal="true" aria-label="Ändra försäljning"><div className="sale-edit-card"><h1>Ändra köp</h1><p>Klockan {saleDraft.time}</p><h2>Betalsätt</h2><div className="edit-payment"><button className={saleDraft.payment === "Swish" ? "chosen" : ""} onClick={() => setSaleDraft({...saleDraft,payment:"Swish"})}><img src="/swish.png" alt=""/> Swish</button><button className={saleDraft.payment === "Kontant" ? "chosen" : ""} onClick={() => setSaleDraft({...saleDraft,payment:"Kontant"})}>💵 Kontant</button></div><h2>Varor</h2><div className="sale-edit-lines">{saleDraft.lines.map((line,index) => <div key={index}><strong>{line.name}</strong><label>Antal<input inputMode="numeric" value={line.qty || 1} onChange={(e) => setSaleDraft({...saleDraft,lines:saleDraft.lines.map((l,i) => i===index?{...l,qty:Math.max(1,Number(e.target.value)||1)}:l)})}/></label><label>Pris<input inputMode="numeric" value={line.price} onChange={(e) => setSaleDraft({...saleDraft,lines:saleDraft.lines.map((l,i) => i===index?{...l,price:Number(e.target.value)||0}:l)})}/></label><button aria-label={`Ta bort ${line.name}`} onClick={() => setSaleDraft({...saleDraft,lines:saleDraft.lines.filter((_,i)=>i!==index)})}>×</button></div>)}</div><div className="edit-actions"><button className="cancel-edit" onClick={() => setSaleDraft(null)}>Avbryt</button><button className="save-edit" disabled={!saleDraft.lines.length} onClick={() => updateHistorySale(saleDraft)}>SPARA ÄNDRINGAR</button></div></div></div>}
    {endDayConfirm && <div className="edit-backdrop" role="alertdialog" aria-modal="true" aria-label="Bekräfta avsluta pass"><div className="confirm-card"><div className="day-check">✓</div><h1>Avsluta passet?</h1><p>Passet sparas under den här dagen. Du kan senare fortsätta just detta pass eller starta ett nytt.</p><div className="edit-actions"><button className="cancel-edit" onClick={() => setEndDayConfirm(false)}>Avbryt</button><button className="save-edit" onClick={closeDay}>JA, AVSLUTA</button></div></div></div>}
    {calculator && <div className="calculator" role="dialog" aria-modal="true" aria-label="Miniräknare"><header><div className="calc-title"><img src="/calculator-icon.png" alt=""/><h1>Miniräknare</h1></div><button onClick={() => setCalculator(false)}>× Stäng</button></header><div className="calc-body"><div className="calc-display-row"><output><span className="calc-expression">{calcDisplayExpression || "0"}</span><span className="calc-answer">{calcAnswer}</span></output><button className="copy-result" disabled={!Number.isFinite(Number(calcAnswer))} onClick={() => {setCopiedValue(String(Math.max(0,Math.round(Number(calcAnswer)))));setCalculator(false)}}><span className="copy-symbol" aria-hidden="true"/> KOPIERA</button></div><div className="calc-grid">{["C","⌫","÷","×","7","8","9","−","4","5","6","+","1","2","3","=","0","."].map(key => <button key={key} className={key === "=" ? "equals" : /[÷×−+]/.test(key) ? "operator" : ""} onClick={() => calcPress(key)}>{key}</button>)}</div></div></div>}
  </main>;
}
