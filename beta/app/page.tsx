import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Bell,
  BookOpen,
  Compass,
  CalendarDays,
  Calculator,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Copy,
  ExternalLink,
  Eye,
  Funnel,
  Flag,
  Heart,
  Home,
  History,
  ImagePlus,
  Info,
  ListChecks,
  Lightbulb,
  Link2,
  Unlink2,
  LockKeyhole,
  LoaderCircle,
  GripVertical,
  LogOut,
  Menu,
  MessageCircle,
  MoveRight,
  NotebookPen,
  Palette,
  Pencil,
  Pin,
  Plus,
  Printer,
  Search,
  Bug,
  Share2,
  ArrowUpDown,
  ArrowLeftRight,
  Settings,
  Trash2,
  ThumbsUp,
  UserCog,
  UserRound,
  Users,
  WalletCards,
  Wrench,
  X,
} from "lucide-react";
import {
  DndContext,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth, db } from "../src/lib/firebase";
import {
  acceptPrivacy,
  createGroup,
  createList,
  createReport,
  createPublicListShare,
  decideJoinRequest,
  ensureAccount,
  getGlobalPinReactions,
  getPublicListShare,
  hideGlobalPin,
  leaveGroup,
  markListSeen,
  migratePrivateLists,
  removeGroupMember,
  removeList,
  removePrivateList,
  removeReport,
  requestToJoin,
  saveGlobalPin,
  saveList,
  saveNote,
  savePrivateNote,
  savePreferences,
  savePrivateList,
  saveThemePalette,
  setListFollowing,
  setNoteFollowing,
  switchGroup,
  toggleGlobalPinReaction,
  transferGroupOwnership,
  touchPresence,
  updateAccountAdmin,
  updateGroup,
  updateMembership,
  updateProfile,
  watchAccount,
  watchAllAccounts,
  watchAdminUserCounts,
  watchAllLists,
  watchAllPrivateLists,
  watchFollowedLists,
  watchFollowedNotes,
  watchFollowedContent,
  watchGlobalPin,
  watchGlobalPins,
  watchGroup,
  watchGroupMembers,
  watchJoinRequests,
  watchLists,
  watchListReadStates,
  watchMemberships,
  watchOnlineCount,
  watchOnlineUserIds,
  watchKnownOnlineUserIds,
  watchDirectChats,
  watchDirectMessages,
  watchTotalDirectMessageCount,
  ensureDirectChat,
  sendDirectMessage,
  markDirectChatRead,
  watchNotes,
  watchPrivateNotes,
  watchPrivateLists,
  watchReports,
  watchThemePalettes,
  removeNote,
  removePrivateNote,
  watchCalendarEvents,
  watchPrivateCalendarEvents,
  saveCalendarEvent,
  savePrivateCalendarEvent,
  removeCalendarEvent,
  removePrivateCalendarEvent,
  syncCalendarEventLocations,
  removeCalendarEventEverywhere,
  watchBudgetEntries,
  watchPrivateBudgetEntries,
  watchBudgetSettings,
  watchPrivateBudgetSettings,
  saveBudgetEntry,
  savePrivateBudgetEntry,
  saveBudgetSettings,
  savePrivateBudgetSettings,
  removeBudgetEntry,
  removePrivateBudgetEntry,
  resetBudget,
  resetPrivateBudget,
  clearBudgetMoney,
  clearPrivateBudgetMoney,
  watchRecipes,
  watchPrivateRecipes,
  watchPublicRecipes,
  getPublicRecipe,
  saveRecipe,
  savePrivateRecipe,
  syncRecipeLocations,
  removeRecipeEverywhere,
  unpublishRecipe,
  syncRecipePublication,
  setPublicRecipeLiked,
  recordRecipeView,
  watchRecipeViewCount,
  reconcileRecipePublications,
} from "../src/lib/bubbsun-data";
import type {
  Account,
  AdminUserCounts,
  BudgetEntry,
  BudgetSettings,
  BubbsunList,
  BubbsunNote,
  CalendarEvent,
  DirectChat,
  DirectMessage,
  GlobalPin,
  Group,
  JoinRequest,
  ListItem,
  Membership,
  Page,
  PublicListShare,
  Recipe,
  RecipeIngredient,
  Report,
  ThemePalette,
} from "../src/types";
import { LanguageBridge } from "../src/LanguageBridge";
import "./globals.css";
import "./v700.css";
import "./v700-fixes.css";
import "./beta-final.css";

const bubbsunVersion = "0.911";
const bubbsunEdition = "Almost Done Edition";

const NEW_BADGE_EPOCH = Date.parse("2026-08-14T00:00:00Z");

const iconSources: Record<string, string> = {
  list_cart: "/assets/list-cart.png",
  "🛒": "/assets/list-cart.png",
  list_pets: "/assets/list-pets.png",
  "🐾": "/assets/list-pets.png",
  list_checklist: "/assets/list-checklist.png",
  "📋": "/assets/list-checklist.png",
};
const fallbackIcon = "/assets/list-cart.png";
const listIconOptions = [
  "list_cart",
  "list_basket",
  "list_food",
  "list_dining",
  "list_home",
  "list_drink_cup",
  "list_work",
  "list_checklist",
  "list_fitness",
  "list_hiking",
  "list_pets",
  "list_vacation",
  "list_supporter_heart_cart",
  "list_supporter_moon",
  "list_supporter_emblem",
  "list_supporter_compass",
];
listIconOptions.forEach((id) => {
  iconSources[id] = `/assets/new-icons/lists-v13/${id}.png?v=7`;
});
const groupIconOptions = [
  "group_home",
  "group_coffee",
  "group_plant",
  "group_books",
  "group_paws",
  "group_cart",
  "group_yarn",
  "group_star",
  "group_moon",
  "group_duck",
  "group_mushrooms",
  "group_game",
];
const legacyGroupIcons = [
  "⌂",
  "☕",
  "♛",
  "🐾",
  "♥",
  "★",
  "🌳",
  "🏡",
  "👥",
  "🛒",
  "☀",
  "🌙",
];
const legacyStoredGroupIconAliases: Record<string,string> = {
  group_cottage: "group_home",
  group_heart: "group_yarn",
  group_tree: "group_mushrooms",
  group_people: "group_books",
  group_sun: "group_duck",
};
const normalizedGroupIcon = (value?: string) =>
  value?.startsWith("group_")
    ? legacyStoredGroupIconAliases[value] || value
    : groupIconOptions[Math.max(0, legacyGroupIcons.indexOf(value || "⌂"))];
function GroupIcon({
  id,
  className = "",
}: {
  id?: string;
  className?: string;
}) {
  return (
    <img
      className={`group-picture ${className}`}
      src={`${import.meta.env.BASE_URL}assets/new-icons/groups/${normalizedGroupIcon(id)}.png?v=5`}
      alt=""
    />
  );
}
const colorOptions = [
  0xff2b7a78, 0xffc94c58, 0xffff9f43, 0xffafd27f, 0xff5275a5, 0xff9a78bc,
  0xff3caea3, 0xff7bae48, 0xffb1453a, 0xff7a4fa3, 0xff3289c7, 0xff35aeb8,
];
const listColorOptions = [
  0xff4f938f, 0xffe88fb0, 0xffffae6f, 0xffa9cf8b, 0xff6f96c5, 0xffad8acb,
  0xff55b9b0, 0xff8fbd68, 0xffdb806b, 0xff9c6daf, 0xff58a7d2, 0xfff2b7a7,
];
const listTypes = [
  { id: "shopping", label: "Inköp", icon: "🛒" },
  { id: "packing", label: "Packlista", icon: "🎒" },
  { id: "cleaning", label: "Städlista", icon: "🧹" },
  { id: "home", label: "Hemfix", icon: "🔧" },
  { id: "orders", label: "Beställningar", icon: "📦" },
  { id: "wishlist", label: "Önskelista", icon: "🎁" },
  { id: "other", label: "Annat", icon: "📝" },
] as const;
const cleaningRooms = ["Hela hemmet", "Kök", "Vardagsrum", "Sovrum", "Badrum", "Hall", "Tvättstuga", "Ute"];
const cleaningRecurrences = ["En gång", "Varje dag", "Varje vecka", "Varannan vecka", "Varje månad"];
const homeFixPlaces = ["Hela hemmet", "Kök", "Vardagsrum", "Sovrum", "Badrum", "Hall", "Tvättstuga", "Garage", "Förråd", "Ute"];
const homeFixPriorities = ["Låg", "Normal", "Hög", "Akut"];
const homeFixTypes = ["Reparera", "Montera", "Underhåll", "Förbättring", "Annat"];
const shortDate = (value?: string) => value
  ? new Date(`${value}T12:00:00`).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })
  : "";
const noteIcons=["idea","star","search","alarm","palette","archive","tag","lock"] as const;
const noteIconSource=(icon:string)=>`${import.meta.env.BASE_URL}assets/note-icons/${noteIcons.includes(icon as typeof noteIcons[number])?icon:"idea"}.png`;
const listTypeInfo = (id?: string) =>
  listTypes.find((type) => type.id === id) || listTypes[listTypes.length - 1];
const themes = [
  {
    id: "retro",
    name: "Retro",
    icon: "theme_retro_radio.png",
    bg: "#f4ead8",
    paper: "#fff7e9",
    panel: "#e3c99d",
    text: "#302015",
    accent: "#587556",
    outline: "#a77f5f",
  },
  {
    id: "light",
    name: "Ljus retro",
    icon: "theme_light_radio.png",
    bg: "#fbf7ef",
    paper: "#fffaf3",
    panel: "#f5eee2",
    text: "#392d24",
    accent: "#6f8748",
    outline: "#d8c5a8",
    header: "#fbf7ef",
    headerButton: "#6f8748",
    brandDecoration: "#b86a42",
    brandSuffix: "#b86a42",
  },
  {
    id: "ocean",
    name: "Mörk retro",
    icon: "theme_dark_retro_radio.png",
    bg: "#11191e",
    paper: "#192226",
    panel: "#20292c",
    text: "#f0d9b4",
    accent: "#60794f",
    outline: "#3d4848",
    header: "#11191e",
    headerButton: "#526946",
  },
  {
    id: "forest",
    name: "Skog",
    icon: "theme_forest.png",
    bg: "#e3ebd8",
    paper: "#f8faef",
    panel: "#b8cea3",
    text: "#263a24",
    accent: "#4f7b48",
    outline: "#78946a",
    header: "#a4bf8d",
    headerButton: "#3f6d43",
  },
  {
    id: "sunset",
    name: "Solnedgång",
    icon: "theme_sunset.png",
    bg: "#f4d8ca",
    paper: "#fff3e3",
    panel: "#dca58f",
    text: "#4d2930",
    accent: "#b65757",
    outline: "#bf7c6c",
    header: "#cf8f83",
    headerButton: "#914b5b",
  },
  {
    id: "winter",
    name: "Vinter",
    icon: "theme_winter.png",
    bg: "#e3f0f5",
    paper: "#fbfeff",
    panel: "#bed8e4",
    text: "#253d4a",
    accent: "#527f9a",
    outline: "#83acbe",
    header: "#acd0df",
    headerButton: "#426e88",
  },
  {
    id: "flower",
    name: "Blomster",
    icon: "theme_flower.png",
    bg: "#f4dfe6",
    paper: "#fff7fa",
    panel: "#e8bccc",
    text: "#4b2b37",
    accent: "#a65373",
    outline: "#cc829f",
    header: "#dda9bc",
    headerButton: "#91445f",
  },
  {
    id: "fire",
    name: "Eld",
    icon: "theme_fire.png",
    bg: "#f0d5bd",
    paper: "#fff2dd",
    panel: "#dda06e",
    text: "#49291d",
    accent: "#ad472f",
    outline: "#c36e42",
    header: "#ce7d51",
    headerButton: "#913521",
  },
  {
    id: "neon",
    name: "Neon",
    icon: "theme_neon.png",
    bg: "#15152d",
    paper: "#25254b",
    panel: "#34336a",
    text: "#f8f1ff",
    accent: "#24d6c8",
    outline: "#d46fff",
    header: "#24234f",
    headerButton: "#7b4bd1",
  },
  {
    id: "cosmic",
    name: "Kosmisk supporter",
    icon: "theme_cosmic_new.png",
    bg: "#090820",
    paper: "#211849",
    panel: "#302365",
    text: "#fff1cf",
    accent: "#d59a43",
    outline: "#9a6cda",
    header: "#17113b",
    headerButton: "#7950bd",
    supporter: true,
  },
  {
    id: "heart",
    name: "Hjärtlig supporter",
    icon: "theme_heart.png",
    bg: "#f3d3dc",
    paper: "#fff5f7",
    panel: "#e6a9bb",
    text: "#54283a",
    accent: "#b93f6d",
    outline: "#cb708f",
    header: "#d98da6",
    headerButton: "#a62f5c",
    supporter: true,
  },
  {
    id: "gothic",
    name: "Gotisk supporter",
    icon: "theme_gothic_noir.png",
    bg: "#0d0d12",
    paper: "#211f28",
    panel: "#302d38",
    text: "#f1e8dc",
    accent: "#a92f42",
    outline: "#807482",
    header: "#18171e",
    headerButton: "#752536",
    supporter: true,
  },
];
const usableThemePalette = (
  themeId: string,
  palette?: ThemePalette,
) => {
  if (themeId === "ocean" && (palette?.paletteVersion || 0) < 2) return undefined;
  if (themeId === "light" && (palette?.paletteVersion || 0) < 3) return undefined;
  return palette;
};
const rgbaHex = (value: number) =>
  `#${(value >>> 0).toString(16).padStart(8, "0").slice(-6)}`;
const loadPrivate = (uid: string): BubbsunList[] => {
  try {
    return JSON.parse(localStorage.getItem(`bubbsun-private-${uid}`) || "[]");
  } catch {
    return [];
  }
};

function GoogleMark() {
  return (
    <span className="google-mark">
      <i>G</i>
    </span>
  );
}

const GOOGLE_WEB_CLIENT_ID =
  "999127046153-ik86946iup8gukr49khobsgo22dr392e.apps.googleusercontent.com";

type GoogleIdentityWindow = Window & {
  google?: {
    accounts: {
      id: {
        initialize: (options: {
          client_id: string;
          callback: (response: { credential?: string }) => void;
        }) => void;
        renderButton: (
          parent: HTMLElement,
          options: Record<string, string | number>,
        ) => void;
      };
    };
  };
};

function GoogleIdentityButton({
  onCredential,
  busy,
}: {
  onCredential: (credential: string) => void;
  busy: boolean;
}) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const credentialHandler = useRef(onCredential);
  credentialHandler.current = onCredential;

  useEffect(() => {
    let cancelled = false;
    const render = () => {
      if (cancelled || !buttonRef.current) return;
      const google = (window as GoogleIdentityWindow).google;
      if (!google) return;
      google.accounts.id.initialize({
        client_id: GOOGLE_WEB_CLIENT_ID,
        callback: ({ credential }) => {
          if (credential) credentialHandler.current(credential);
        },
      });
      buttonRef.current.replaceChildren();
      google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: Math.min(400, buttonRef.current.clientWidth || 320),
      });
    };

    let script = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (!script) {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", render);
    render();
    return () => {
      cancelled = true;
      script?.removeEventListener("load", render);
    };
  }, []);

  return (
    <div
      className="google-identity-login"
      aria-busy={busy}
      style={{ pointerEvents: busy ? "none" : "auto", opacity: busy ? 0.65 : 1 }}
    >
      <div ref={buttonRef} />
    </div>
  );
}

type BubbsunInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let savedInstallPrompt: BubbsunInstallPrompt | null = null;

function isInstalledApp() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function isAppleMobile() {
  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function InstallLauncher({ place }: { place: "login" | "banner" | "settings" }) {
  const [installed, setInstalled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const updateInstalled = () => setInstalled(isInstalledApp());
    const rememberPrompt = (event: Event) => {
      event.preventDefault();
      savedInstallPrompt = event as BubbsunInstallPrompt;
    };
    const installedNow = () => {
      savedInstallPrompt = null;
      setInstalled(true);
    };
    updateInstalled();
    setHidden(localStorage.getItem("bubbsun-hide-install-banner") === "yes");
    window.addEventListener("beforeinstallprompt", rememberPrompt);
    window.addEventListener("appinstalled", installedNow);
    const displayMode = window.matchMedia("(display-mode: standalone)");
    displayMode.addEventListener?.("change", updateInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", rememberPrompt);
      window.removeEventListener("appinstalled", installedNow);
      displayMode.removeEventListener?.("change", updateInstalled);
    };
  }, []);

  const install = async () => {
    if (isAndroidMobile()) {
      window.location.assign(ANDROID_APP_URL);
      return;
    }
    if (isInstalledApp()) {
      setInstalled(true);
      setMessage("Bubbsun är redan installerad på den här enheten.");
      return;
    }
    if (isAppleMobile()) {
      setHelpOpen(true);
      return;
    }
    if (savedInstallPrompt) {
      const prompt = savedInstallPrompt;
      await prompt.prompt();
      const choice = await prompt.userChoice;
      savedInstallPrompt = null;
      if (choice.outcome === "accepted") setInstalled(true);
      return;
    }
    setHelpOpen(true);
  };

  if (installed && place !== "settings") return null;
  if (place === "banner" && hidden) return null;

  return (
    <>
      {place === "login" && (
        <div className="login-install">
          <button onClick={() => void install()}>📲 {isAndroidMobile() ? "HÄMTA ANDROID-APPEN" : "INSTALLERA BUBBSUN"}</button>
          <span>{isAndroidMobile() ? "Hämta den riktiga Bubbsun-appen för Android." : "Få en egen ikon och öppna Bubbsun som en vanlig app."}</span>
        </div>
      )}
      {place === "banner" && (
        <section className="install-banner">
          <div className="install-banner-copy">
            <i aria-hidden="true">📲</i>
            <span>
              <strong>{isAndroidMobile() ? "BUBBSUN FÖR ANDROID" : "HA BUBBSUN SOM EN APP"}</strong>
              <small>{isAndroidMobile() ? "Hämta den riktiga Android-appen från Bubbsuns GitHub." : "Snabbare att hitta, med en egen ikon på telefonen eller datorn."}</small>
            </span>
          </div>
          <button className="install-banner-primary" onClick={() => void install()}>
            {isAndroidMobile() ? "HÄMTA APPEN" : "INSTALLERA"}
          </button>
          <button
            className="install-banner-hide"
            onClick={() => {
              localStorage.setItem("bubbsun-hide-install-banner", "yes");
              setHidden(true);
            }}
          >
            DÖLJ DETTA FÖR ALLTID
          </button>
        </section>
      )}
      {place === "settings" && (
        <div className="settings-card install-card">
          <h2>{isAndroidMobile() ? "BUBBSUN FÖR ANDROID" : "HA BUBBSUN SOM EN APP"}</h2>
          <p>
            {isAndroidMobile() ? "Hämta den riktiga Bubbsun-appen för Android. Webbversionen installeras inte längre som en extra Android-app." : "Installera Bubbsun på telefonen eller datorn. Då får du en egen ikon och kan öppna Bubbsun som en vanlig app."}
          </p>
          <button onClick={() => void install()}>
            {installed ? "✓ BUBBSUN ÄR INSTALLERAD" : isAndroidMobile() ? "📲 HÄMTA ANDROID-APPEN" : "📲 INSTALLERA BUBBSUN"}
          </button>
          {message && <strong>{message}</strong>}
        </div>
      )}
      {helpOpen && (
        <div className="modal-backdrop" onClick={() => setHelpOpen(false)}>
          <section
            className="modal modal-card install-help-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-help-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="install-help-close" aria-label="Stäng" onClick={() => setHelpOpen(false)}>
              <X />
            </button>
            <i className="install-help-icon" aria-hidden="true">📲</i>
            <small>{isAppleMobile() ? "IPHONE & IPAD" : "INSTALLERA BUBBSUN"}</small>
            <h2 id="install-help-title">LÄGG BUBBSUN PÅ HEMSKÄRMEN</h2>
            {isAppleMobile() ? (
              <ol>
                <li><b>1</b><span>Öppna <strong>bubbsun.se</strong> i Safari.</span></li>
                <li><b>2</b><span>Tryck på Safaris <strong>Dela-knapp</strong> (fyrkanten med pil upp).</span></li>
                <li><b>3</b><span>Välj <strong>Lägg till på hemskärmen</strong>.</span></li>
                <li><b>4</b><span>Tryck på <strong>Lägg till</strong>.</span></li>
              </ol>
            ) : (
              <p>Öppna webbläsarens meny och välj <strong>Installera app</strong> eller <strong>Lägg till på startskärmen</strong>.</p>
            )}
            <button className="install-help-done" onClick={() => setHelpOpen(false)}>JAG FÖRSTÅR</button>
          </section>
        </div>
      )}
    </>
  );
}

function LoginPage({
  onLogin,
  onGoogleCredential,
  error,
  busy,
}: {
  onLogin: () => void;
  onGoogleCredential: (credential: string) => void;
  error: string;
  busy: boolean;
}) {
  // Google Identity Services avoids popup sessions that can hang in modern
  // browsers. Keep Firebase's popup flow available as compatibility mode.
  const useGoogleIdentity = true;
  return (
    <main className="login-page">
      <div className="login-layout">
        <img
          src="/assets/login-bubbsun-hero.png"
          alt="Bubbsun – lugn, ordning, du har koll"
          className="login-hero"
        />
        <section className="login-card">
          <div className="login-welcome">
            <span>DELADE LISTOR · WEBB &amp; ANDROID</span>
            <h1>Listor blir <em>bättre tillsammans.</em></h1>
            <p>
              Skapa egna listor eller dela dem med familjen. Alla ser ändringarna direkt –
              hemma, i butiken och på språng.
            </p>
          </div>
          {useGoogleIdentity ? (
            <>
              <GoogleIdentityButton onCredential={onGoogleCredential} busy={busy} />
              <button className="google-login-compat" onClick={onLogin} disabled={busy}>
                PROBLEM ATT LOGGA IN? PROVA KOMPATIBILITETSLÄGET
              </button>
            </>
          ) : (
            <button onClick={onLogin} disabled={busy}>
              <GoogleMark /> {busy ? "ANSLUTER…" : "FORTSÄTT MED GOOGLE"}
            </button>
          )}
          {error && <div className="error-box">{error}</div>}
          <InstallLauncher place="login" />
          <small>Samma Bubbsun-konto och grupper som i Android-appen.</small>
        </section>
      </div>

      <section className="login-about" aria-labelledby="about-bubbsun-title">
        <div className="login-about-intro">
          <span>LISTOR SOM FAKTISKT BLIR ANVÄNDA</span>
          <h2 id="about-bubbsun-title">Lugnare vardag, tillsammans</h2>
          <p>
            Bubbsun är en enkel och personlig listapp för familjer, vänner och
            alla som vill slippa bortglömda lappar. Skapa privata listor för dig
            själv eller delade listor där alla ser samma sak direkt.
          </p>
        </div>

        <div className="login-feature-grid">
          <article>
            <i aria-hidden="true">🛒</i>
            <h3>Gemensamma inköpslistor</h3>
            <p>
              Lägg till det som saknas hemma. När någon bockar av en vara ser
              resten av familjen det direkt.
            </p>
          </article>
          <article>
            <i aria-hidden="true">👨‍👩‍👧‍👦</i>
            <h3>Dela med familj och vänner</h3>
            <p>
              Samla familjens vardagslistor i en grupp, så slipper ni skicka
              nya meddelanden och bilder varje gång något ändras.
            </p>
          </article>
          <article>
            <i aria-hidden="true">🔒</i>
            <h3>Privata listor</h3>
            <p>
              Allt behöver inte delas. Dina privata listor syns bara för dig
              och följer med mellan telefon och dator.
            </p>
          </article>
          <article>
            <i aria-hidden="true">✨</i>
            <h3>Personligt och lätt att förstå</h3>
            <p>
              Välj färg, ikon och tema. Bubbsun är gjort för att kännas varmt,
              tydligt och enkelt även för den som inte älskar teknik.
            </p>
          </article>
        </div>

        <div className="login-how-it-works">
          <div>
            <span>1</span>
            <p><strong>Logga in</strong> med ditt Google-konto.</p>
          </div>
          <div>
            <span>2</span>
            <p><strong>Skapa en lista</strong> för dig själv eller en grupp.</p>
          </div>
          <div>
            <span>3</span>
            <p><strong>Bjud in andra</strong> och börja hjälpas åt.</p>
          </div>
        </div>

        <div className="login-faq">
          <div className="login-faq-heading">
            <span>BRA ATT VETA</span>
            <h2>Vanliga frågor om Bubbsun</h2>
          </div>
          <details>
            <summary>Vad är Bubbsun?</summary>
            <p>
              Bubbsun är en listapp för privata och delade listor. Den passar
              till exempel för inköp, ärenden, önskelistor och sådant familjen
              behöver komma ihåg tillsammans.
            </p>
          </details>
          <details>
            <summary>Kan flera personer använda samma lista?</summary>
            <p>
              Ja. Skapa en grupp och bjud in familj eller vänner. Alla i gruppen
              kan se listan och ändringarna visas för de andra.
            </p>
          </details>
          <details>
            <summary>Kan jag ha listor som ingen annan ser?</summary>
            <p>
              Ja. Under Mina listor kan du skapa privata listor som bara tillhör
              ditt konto och syns på dina egna enheter.
            </p>
          </details>
          <details>
            <summary>Fungerar Bubbsun på telefon och dator?</summary>
            <p>
              Ja. Du kan använda Bubbsun direkt på webben och i Android-appen.
              Samma konto visar samma grupper och listor på dina enheter.
            </p>
          </details>
          <details>
            <summary>Kostar det att använda Bubbsun?</summary>
            <p>
              Nej, Bubbsuns viktiga funktioner är gratis. Du kan skapa privata
              och delade listor, använda grupper och hjälpas åt med familj och
              vänner utan att betala. Supporter är helt frivilligt och ger bara
              kosmetiska extraval, som särskilda teman, ikoner och dekorationer.
              Du behöver alltså inte vara supporter för att använda Bubbsun.
              Det är ett sätt för den som vill att stötta den fortsatta
              utvecklingen och hjälpa oss att hålla appen levande och bättre
              över tid – med några fina visuella tack på köpet.
            </p>
          </details>
        </div>

        <div className="login-about-cta">
          <p>Redo att få lite mer ordning i vardagen?</p>
          <button type="button" onClick={onLogin} disabled={busy}>
            <GoogleMark /> {busy ? "ANSLUTER…" : "BÖRJA MED GOOGLE"}
          </button>
        </div>
      </section>
    </main>
  );
}

function ActionButtonBridge(){
  useEffect(()=>{
    const classify=()=>document.querySelectorAll<HTMLButtonElement>("button").forEach(button=>{
      const text=(button.textContent||button.getAttribute("aria-label")||"").trim().replace(/\s+/g," ").toLocaleUpperCase("sv");
      button.classList.remove("bubbsun-action-confirm","bubbsun-action-cancel","bubbsun-action-danger","bubbsun-action-neutral");
      if(button.closest(".topbar")||button.matches(".calendar-card-close, .drag-handle, .item-drag-handle, [data-dnd-handle], .list-tools-card .item-action-edit, .list-tools-card .item-action-move"))return;
      const starts=(values:string[])=>values.some(value=>text===value||text.startsWith(`${value} `));
      if(starts(["MARKERA ALLA","AVMARKERA ALLT","SELECT ALL","DESELECT ALL"]))button.classList.add("bubbsun-action-neutral");
      else if(starts(["TA BORT","LÄMNA","DELETE","REMOVE","LEAVE"]))button.classList.add("bubbsun-action-danger");
      else if(starts(["AVBRYT","STÄNG","NEJ","CANCEL","CLOSE","NO"]))button.classList.add("bubbsun-action-cancel");
      else if(starts(["SPARA","SKAPA","KLAR","LÄGG TILL","GÅ MED","FLYTTA","REDIGERA","SAVE","CREATE","DONE","ADD","JOIN","MOVE","EDIT"])||text==="JA"||text==="YES")button.classList.add("bubbsun-action-confirm");
    });
    classify();
    const observer=new MutationObserver(classify);observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    return()=>observer.disconnect();
  },[]);
  return null;
}

function isAndroidMobile() {
  return /Android/i.test(navigator.userAgent);
}

/** Prevent an accidental backdrop click from discarding edits in any modal. */
function UnsavedModalGuard(){
  useEffect(()=>{
    const dirty=new WeakSet<Element>();
    const modalFor=(target:EventTarget|null)=>(target instanceof Element?target.closest(".modal-backdrop,.recipe-modal-backdrop"):null);
    const mark=(event:Event)=>{const modal=modalFor(event.target);if(modal)dirty.add(modal)};
    const markButton=(event:MouseEvent)=>{const button=event.target instanceof Element?event.target.closest("button"):null,modal=modalFor(button);if(!button||!modal)return;const label=(button.textContent||button.getAttribute("aria-label")||"").trim().toLocaleLowerCase("sv-SE");if(button.classList.contains("modal-close")||button.classList.contains("recipe-close")||/^(spara|skapa|skicka|avbryt|stäng|ta bort|radera)/.test(label)){dirty.delete(modal);return}dirty.add(modal)};
    const clearOnSubmit=(event:SubmitEvent)=>{const modal=modalFor(event.target);if(modal)dirty.delete(modal)};
    const protect=(event:PointerEvent)=>{const modal=modalFor(event.target);if(!modal||event.target!==modal||!dirty.has(modal))return;if(modal.classList.contains("chat-backdrop")&&!modal.querySelector<HTMLTextAreaElement>("textarea")?.value.trim()){dirty.delete(modal);return}event.preventDefault();event.stopImmediatePropagation()};
    document.addEventListener("input",mark,true);document.addEventListener("change",mark,true);document.addEventListener("click",markButton,true);document.addEventListener("submit",clearOnSubmit,true);document.addEventListener("pointerdown",protect,true);
    return()=>{document.removeEventListener("input",mark,true);document.removeEventListener("change",mark,true);document.removeEventListener("click",markButton,true);document.removeEventListener("submit",clearOnSubmit,true);document.removeEventListener("pointerdown",protect,true)};
  },[]);
  return null;
}

const ANDROID_APP_URL =
  "https://github.com/finalworld/Bubbsun/releases/download/v0.702/Bubbsun-v0.702-Web-Edition.apk";

function Header({
  onMenu,
  onHome,
  onAdd,
  onManage,
  mode,
  supporterTitle,
  glow,
  glowColor,
  tabTitle,
  onlineCount,
  reportCount,
  notificationCount,
  chatUnreadCount,
  onOpenAdmin,
  onOpenReports,
  language,
  wallet,
}: {
  onMenu: () => void;
  onHome: () => void;
  onAdd: () => void;
  onManage: () => void;
  mode: "add" | "manage" | "none" | "calculator";
  supporterTitle?: string;
  glow?: boolean;
  glowColor?: string;
  tabTitle?: string;
  onlineCount?: number;
  reportCount?: number;
  notificationCount: number;
  chatUnreadCount: number;
  onOpenAdmin?: () => void;
  onOpenReports?: () => void;
  language: string;
  wallet?: FrasseProgress | null;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const check = () => setScrolled(window.scrollY > 6);
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);
  return (
    <header className={`topbar text-topbar text-header-v2 ${scrolled ? "is-scrolled" : ""}`}>
      <div className="topbar-inner">
        <div className="header-left">
          <div className="header-menu-slot">
            <button
              className="icon-button"
              aria-label="Öppna meny"
              onClick={onMenu}
            >
              <Menu />
            </button>
            {notificationCount+chatUnreadCount>0&&<b className="menu-chat-badge">{notificationCount+chatUnreadCount>99?"99+":notificationCount+chatUnreadCount}</b>}
          </div>
        </div>
        <button
          className={`brand text-brand header-brand-v3 ${glow ? "brand-glow" : ""}`}
          style={{ "--supporter-glow": glowColor || "#ffb532" } as CSSProperties}
          aria-label="Gå till Mina listor"
          onClick={onHome}
        >
          <span className="header-brand-title">
            Bubbsun<span className="header-brand-suffix">.se</span>
          </span>
          <span className="header-brand-tagline">
            {(
              {
                sv: "LISTOR MED KARAKTÄR",
                en: "LISTS WITH CHARACTER",
                fi: "LISTAT LUONTEELLA",
                de: "LISTEN MIT CHARAKTER",
                es: "LISTAS CON CARÁCTER",
                fr: "LISTES AVEC DU CARACTÈRE",
                it: "LISTE CON CARATTERE",
                pl: "LISTY Z CHARAKTEREM",
                nl: "LIJSTEN MET KARAKTER",
                tlh: "TETLHEMEY TLHInGAN",
              } as Record<string, string>
            )[language] || "LISTS WITH CHARACTER"}
          </span>
          {supporterTitle && supporterTitle !== "none" && (
            <small className="supporter-title" data-title={supporterTitle}>
              {(
                {
                  lifetime: "♥ Lifetime Supporter ♥",
                  royal: "♛ LIFETIME SUPPORTER ♛",
                  band: "✦ SUPPORTER ✦",
                  signature: "Lifetime Supporter ♥",
                  founding: "♥ FOUNDING SUPPORTER",
                  cosmic: "✧ COSMIC SUPPORTER ✧",
                } as Record<string, string>
              )[supporterTitle] || "♥ Lifetime Supporter ♥"}
            </small>
          )}
        </button>
        {typeof onlineCount === "number" && typeof reportCount === "number" && <div className="header-admin-stats">
          <button type="button" onClick={onOpenAdmin} title="Visa användare som är online" aria-label={`${onlineCount} online`}><Users/><b>{onlineCount}</b></button>
          <i aria-hidden="true"/>
          <button type="button" onClick={onOpenReports} title="Visa nya rapporter" aria-label={`${reportCount} nya rapporter`}><Flag/><b>{reportCount}</b></button>
        </div>}
        {wallet ? <div className="header-game-wallet"><span><small>SALDO</small><strong>{wallet.balance.toLocaleString("sv-SE")} Bb</strong></span><span><small>VALV</small><strong>{wallet.vault.toLocaleString("sv-SE")} Bb</strong></span></div> : mode === "calculator" ? <div className="header-add-actions"><button className="theme-button header-add header-calculator" aria-label="Öppna miniräknaren" title="Miniräknare" onClick={onAdd}><Calculator/></button></div> : mode === "add" ? (
          <div className="header-add-actions"><button
            className="theme-button header-add"
            aria-label={tabTitle === "Kalender" ? "Ny händelse" : "Skapa en lista"}
            onClick={onAdd}
          >
            <Plus />
          </button></div>
        ) : mode === "manage" ? (
          <button
            className="theme-button header-manage"
            aria-label={tabTitle ? `Hantera ${tabTitle}` : "Hantera listan"}
            onClick={onManage}
          >
            <Wrench />
          </button>
        ) : (
          <span className="header-spacer" />
        )}
      </div>
    </header>
  );
}

function Drawer({
  open,
  onClose,
  account,
  userInfo,
  groups,
  memberships,
  activePrivate,
  onPrivate,
  onGroup,
  onPage,
  onLogout,
  onInvite,
  unreadChats,
  onChat,
  notificationCount,
  onNotifications,
}: {
  open: boolean;
  onClose: () => void;
  account: Account;
  groups: Record<string, Group>;
  memberships: Membership[];
  userInfo: User;
  activePrivate: boolean;
  onPrivate: () => void;
  onGroup: (id: string) => void;
  onPage: (page: Page) => void;
  onLogout: () => void;
  onInvite: () => void;
  unreadChats: number;
  onChat: () => void;
  notificationCount: number;
  onNotifications: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const activeGroup = groups[account.activeGroupId];
  const activeMembership = memberships.find(
    (x) => x.groupId === account.activeGroupId,
  );
  return (
    <>
      <div
        className={`drawer-backdrop ${open ? "visible" : ""}`}
        onClick={onClose}
      />
      <aside className={`drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="drawer-title">
          <div className="drawer-hero" aria-hidden="true" />
          <button
            className="drawer-invite"
            aria-label="Bjud in en vän"
            onClick={onInvite}
          >
            <img src="/assets/invite-friend-sign.png" alt="" />
          </button>
          <button aria-label="Stäng meny" onClick={onClose}>
            <img src="/assets/menu-note-close.png" alt="" />
          </button>
          <button className="drawer-notifications" aria-label={`${notificationCount} nya händelser`} title="Notiser" onClick={onNotifications}><img src="/assets/menu-note-notifications.png" alt=""/><span>{notificationCount}</span></button>
          <button className="drawer-chat" aria-label={`${unreadChats} nya meddelanden`} onClick={onChat}><img src="/assets/menu-note-chat.png" alt=""/>{unreadChats>0&&<b>{unreadChats>99?"99+":unreadChats}</b>}</button>
        </div>
        <div className="drawer-scroll">
          <button
            className="profile-card"
            onClick={() => setExpanded(!expanded)}
          >
            <div
              className="avatar"
              style={{
                background: rgbaHex(activeMembership?.color || 0xff9b72cf),
              }}
            >
              {account.displayName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <strong>
                {account.displayName}
                {account.founder ? " 👑" : ""}
              </strong>
              <em>
                {account.globalTitle ||
                  (activePrivate
                    ? "Mina privata listor"
                    : activeMembership?.role || "Medlem")}
              </em>
              <small>
                {activePrivate ? (
                  <>
                    <LockKeyhole /> Mina listor
                  </>
                ) : activeGroup ? (
                  <>
                    <GroupIcon id={activeGroup.iconId} />
                    {activeGroup.name}
                  </>
                ) : (
                  "Ingen grupp vald"
                )}
              </small>
            </div>
            <ChevronDown className={expanded ? "turn" : ""} />
          </button>
          {expanded && (
            <div className="group-picker drawer-group-submenu">
              {memberships.map((m) => (
                <button
                  className={
                    !activePrivate && m.groupId === account.activeGroupId
                      ? "selected"
                      : ""
                  }
                  key={m.groupId}
                  onClick={() => onGroup(m.groupId)}
                >
                  <GroupIcon id={groups[m.groupId]?.iconId} />
                  <span>{groups[m.groupId]?.name || "Grupp"}</span>
                  {!activePrivate && m.groupId === account.activeGroupId ? (
                    <Check />
                  ) : (
                    <ChevronRight />
                  )}
                </button>
              ))}
            </div>
          )}
          <nav>
            <button onClick={() => onPage("lists")}>
              <Home />
              <span>Listor</span>
              <ChevronRight />
            </button>
            <button className="drawer-recipe-heading" type="button" tabIndex={-1} aria-disabled="true">
              <CalendarDays />
              <span>Planering</span>
            </button>
            <div className="drawer-recipe-submenu drawer-calendar-submenu"><button onClick={()=>onPage("calendar")}><CalendarDays/><span>Kalender</span><ChevronRight/></button><button onClick={()=>onPage("meal-planner")}><NotebookPen/><span>Veckans måltider</span><ChevronRight/></button></div>
            <button className="drawer-recipe-heading" type="button" tabIndex={-1} aria-disabled="true">
              <BookOpen />
              <span>Recept</span>
            </button>
            <div className="drawer-recipe-submenu"><button onClick={()=>onPage("recipes")}><BookOpen/><span>Kokboken</span><ChevronRight/></button><button onClick={()=>onPage("recipe-discover")}><Compass/><span>Upptäck</span><ChevronRight/></button></div>
            <button onClick={() => onPage("budget")}>
              <WalletCards />
              <span>Budget</span>
              <ChevronRight />
            </button>
            <button onClick={() => onPage("people")}>
              <Users />
              <span>Användare & grupper</span>
              <ChevronRight />
            </button>
            <button onClick={() => onPage("settings")}>
              <Settings />
              <span>Inställningar</span>
              <ChevronRight />
            </button>
            <button className="support-nav" onClick={() => onPage("support")}>
              <span>♥</span>
              <span>Stöd Bubbsun</span>
              <ChevronRight />
            </button>
            <div className="drawer-split">
              <button onClick={() => onPage("about")}>
                <span>ⓘ</span>
                <span>Om</span>
              </button>
              <button onClick={() => onPage("help")}>
                <ListChecks />
                <span>Hjälp</span>
              </button>
            </div>
            {(account.megaSuperBoss || account.founder) && (
              <button onClick={() => onPage("admin")}>
                <span>👑</span>
                <span>MegaSuperBoss</span>
                <ChevronRight />
              </button>
            )}
          </nav>
          <a
            className="drawer-facebook"
            href="https://www.facebook.com/profile.php?id=61592148376494"
            target="_blank"
            rel="noreferrer"
          >
            <b>f</b>
            <span>
              <small>Följ oss på</small>
              <strong>Facebook</strong>
            </span>
          </a>
        </div>
        <div className="drawer-footer">
          <div className="drawer-account">
            <img
              src={userInfo.photoURL || "/assets/android/about_man.png"}
              alt=""
            />
            <span>
              <strong>{account.displayName}</strong>
              <small>{userInfo.email}</small>
            </span>
            <button onClick={onLogout} aria-label="Logga ut">
              <LogOut />
              <small>Logga ut</small>
            </button>
          </div>
          {account.supporter && (
            <small className="drawer-supporter">
              ♥{" "}
              {account.supporterTitle === "founding"
                ? "FOUNDING SUPPORTER"
                : "SUPPORTER"}
            </small>
          )}
          <small className="drawer-version-text">
            Bubbsun v{bubbsunVersion} · {bubbsunEdition}
          </small>
        </div>
      </aside>
    </>
  );
}

function ListCard({
  list,
  members,
  privateColor,
  onOpen,
  onEdit,
  onDelete,
  onPin,
  followed = false,
  hasNew = false,
  canDrag,
}: {
  list: BubbsunList;
  members: Membership[];
  privateColor?: number;
  onOpen: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  followed?: boolean;
  hasNew?: boolean;
  canDrag: boolean;
}) {
  const done = list.items.filter((x) => x.completed).length;
  const type = listTypeInfo(list.listType);
  const creator = members.find((x) => x.uid === list.creatorId);
  const sortable = useSortable({ id: list.id, disabled: !canDrag });
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: PointerEvent) => {
      const card = (event.target as HTMLElement).closest("[data-list-card]");
      if (card?.getAttribute("data-list-card") !== list.id) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menuOpen, list.id]);
  const pointerMove = (event: ReactPointerEvent) => {
    if (!gesture.current) return;
    const dx = event.clientX - gesture.current.x,
      dy = event.clientY - gesture.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5) {
      swiped.current = true;
      offsetRef.current = Math.max(-130, Math.min(130, dx));
      setOffset(offsetRef.current);
    }
  };
  const pointerEnd = () => {
    if (offsetRef.current <= -95) onDelete?.();
    else if (offsetRef.current >= 95) onEdit?.();
    offsetRef.current = 0;
    setOffset(0);
    gesture.current = null;
    setTimeout(() => {
      swiped.current = false;
    }, 0);
  };
  return (
    <div
      ref={sortable.setNodeRef}
      data-list-card={list.id}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
      className={`list-card-shell ${sortable.isDragging ? "dragging" : ""}`}
    >
      <span
        className={`swipe-action swipe-edit ${offset >= 95 ? "ready" : ""}`}
      >
        <Pencil /> REDIGERA
      </span>
      <span
        className={`swipe-action swipe-delete ${offset <= -95 ? "ready" : ""}`}
      >
        <Trash2 /> TA BORT
      </span>
      <div
        className="list-card"
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("button")) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          gesture.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerMove={pointerMove}
        onPointerUp={pointerEnd}
        onPointerCancel={pointerEnd}
        onClick={() => {
          if (!swiped.current) onOpen();
        }}
      >
        <span
          className="list-icon"
          style={{
            background:
              typeof list.iconColor === "number"
                ? rgbaHex(list.iconColor)
                : String(list.iconColor),
          }}
        >
          <img src={iconSources[list.icon] || fallbackIcon} alt="" />
          {followed && (
            <Bell className="list-icon-follow-mark" aria-label="Du följer listan" />
          )}
        </span>
        <span
          className="creator-strip"
          style={{
            background: creator
              ? rgbaHex(creator.color)
              : privateColor !== undefined
                ? rgbaHex(privateColor)
                : "#888",
          }}
        />
        <span className="list-copy">
          <strong>
            {list.pinned && (
              <Pin className="private-pin-mark" aria-label="Pinnad" />
            )}
            {list.name}
            {hasNew&&<em className="new-badge">NYTT</em>}
          </strong>
          <small className="list-counts">
            <span className="list-count-summary">{list.items.length - done} kvar · {done} klara</span>
            <span className="list-type-mark" title={`Typ: ${type.label}`}>
              {type.icon} {type.label}
            </span>
          </small>
        </span>
        <span className="card-actions">
          <button
            className="drag-handle no-hover"
            aria-label="Flytta eller hantera listan"
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            {...sortable.attributes}
            {...sortable.listeners}
          >
            <GripVertical />
          </button>
          <ChevronRight className="chevron" />
        </span>
      </div>
      {menuOpen && (
        <div className="list-card-menu">
          {onPin && (
            <button
              className="pin-action"
              onClick={() => {
                setMenuOpen(false);
                onPin();
              }}
            >
              <Pin /> {list.pinned ? "Ta bort pin" : "Pinna överst"}
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => {
                setMenuOpen(false);
                onEdit();
              }}
            >
              <Pencil /> Redigera
            </button>
          )}
          {onDelete && (
            <button
              className="danger"
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
            >
              <Trash2 /> Ta bort
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ListEditor({
  title,
  initial,
  supporter,
  allowDelete = false,
  onCancel,
  onSupport,
  onSave,
  onDelete,
}: {
  title: string;
  initial?: Partial<BubbsunList>;
  supporter: boolean;
  allowDelete?: boolean;
  onCancel: () => void;
  onSupport: () => void;
  onSave: (values: { name: string; icon: string; iconColor: number; listType: string; packPeople:string[] }) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [icon, setIcon] = useState(initial?.icon || "list_cart");
  const [iconColor, setIconColor] = useState(
    typeof initial?.iconColor === "number"
      ? initial.iconColor
      : listColorOptions[0],
  );
  const [listType, setListType] = useState(initial?.listType || "other");
  const [packPeople,setPackPeople]=useState(initial?.packPeople||[]);
  const [packPerson,setPackPerson]=useState("");
  return (
    <div className="modal-backdrop">
      <form
        className="modal list-editor"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim())
            onSave({ name: name.trim().slice(0, 60), icon, iconColor, listType, packPeople });
        }}
      >
        <h2>{title}</h2>
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={60}
          placeholder="Skriv listans namn"
        />
        <h3>VÄLJ TYP</h3>
        <div className="list-type-picker">
          {listTypes.map((type) => (
            <button
              type="button"
              key={type.id}
              className={listType === type.id ? "selected" : ""}
              onClick={() => setListType(type.id)}
            >
              <i aria-hidden="true">{type.icon}</i>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
        {listType === "packing" && <section className="pack-people-editor"><h3>VEM SKA PACKA?</h3><p>Lägg till namnen på dem som ska ha saker med sig.</p><div><input value={packPerson} onChange={event=>setPackPerson(event.target.value)} placeholder="Till exempel Sanja" /><button type="button" onClick={()=>{const value=packPerson.trim();if(value&&!packPeople.includes(value))setPackPeople(old=>[...old,value]);setPackPerson("")}}>LÄGG TILL</button></div><div className="pack-person-chips">{packPeople.map(person=><button type="button" key={person} onClick={()=>setPackPeople(old=>old.filter(value=>value!==person))}>{person} <X /></button>)}</div></section>}
        <h3>VÄLJ FÄRG</h3>
        <div className="color-picker">
          {listColorOptions.map((color, index) => (
            <button
              type="button"
              key={color}
              className={iconColor === color ? "selected" : ""}
              onClick={() => setIconColor(color)}
              style={{ "--choice-color": rgbaHex(color) } as CSSProperties}
              aria-label={`Färg ${index + 1}`}
            />
          ))}
        </div>
        <h3>VÄLJ IKON</h3>
        <div className="icon-picker">
          {listIconOptions.map((id, index) => {
            const locked = index >= 12 && !supporter;
            return (
              <button
                type="button"
                key={id}
                className={`${icon === id ? "selected" : ""} ${locked ? "supporter-locked" : ""}`}
                aria-label={
                  locked
                    ? "Supporterikon – öppna Stöd Bubbsun"
                    : "Välj listikon"
                }
                onClick={() => (locked ? onSupport() : setIcon(id))}
              >
                <img src={iconSources[id]} alt="" />
                {locked && <small>🔒</small>}
              </button>
            );
          })}
        </div>
        {allowDelete && onDelete && (
          <button type="button" className="edit-delete-list" onClick={onDelete}>
            TA BORT HELA LISTAN
          </button>
        )}
        <div>
          <button type="button" className="cancel" onClick={onCancel}>
            AVBRYT
          </button>
          <button type="submit">SPARA</button>
        </div>
      </form>
    </div>
  );
}

function GlobalPinCard({
  pin,
  uid,
  onHide,
}: {
  pin: GlobalPin;
  uid: string;
  onHide: () => void;
}) {
  const [open, setOpen] = useState(false),
    [reacted, setReacted] = useState<Set<string>>(new Set()),
    [busy, setBusy] = useState("");
  const totalVotes = pin.items.reduce(
    (sum, item) => sum + item.reactionCount,
    0,
  );
  useEffect(() => {
    let live = true;
    void getGlobalPinReactions(
      pin.id,
      uid,
      pin.items.map((item) => item.id),
    ).then((items) => {
      if (live) setReacted(new Set([...items].slice(0, 1)));
    });
    return () => {
      live = false;
    };
  }, [pin.id, pin.revision, uid, pin.items]);
  const confirmHide = () => {
    const confirmed = window.confirm(
      "Vill du dölja detta meddelande? Det visas igen nästa gång Bubbsun publicerar en ny version.",
    );
    if (confirmed) onHide();
    return confirmed;
  };
  return (
    <>
      <article
        className="global-pin global-pin-live"
        onClick={() => setOpen(true)}
      >
        <span className="pin-icon">📣</span>
        <div>
          <small>FRÅN BUBBSUN</small>
          <strong>{pin.title}</strong>
          <span>
            {totalVotes} {totalVotes === 1 ? "röst" : "röster"} · tryck för att
            öppna
          </span>
        </div>
        <ChevronRight />
        <button
          aria-label="Göm meddelandet"
          onClick={(event) => {
            event.stopPropagation();
            confirmHide();
          }}
        >
          <X />
        </button>
      </article>
      {open && (
        <div className="modal-backdrop">
          <div className="modal global-pin-modal">
            <button
              className="global-pin-close"
              aria-label="Stäng"
              onClick={() => setOpen(false)}
            >
              <X />
            </button>
            <span className="global-pin-modal-icon">📣</span>
            <small>FRÅN BUBBSUN</small>
            <h2>{pin.title}</h2>
            {pin.infoText && <p>{pin.infoText}</p>}
            <div className="global-pin-options">
              {pin.items.map((item) => {
                const active = reacted.has(item.id);
                return (
                  <button
                    key={item.id}
                    className={active ? "reacted" : ""}
                    disabled={Boolean(busy)}
                    onClick={async () => {
                      setBusy(item.id);
                      try {
                        const next = await toggleGlobalPinReaction(
                          pin.id,
                          item.id,
                          uid,
                        );
                        setReacted(next ? new Set([item.id]) : new Set());
                      } finally {
                        setBusy("");
                      }
                    }}
                  >
                    <span>
                      <strong>{item.name}</strong>
                      {item.quantity && <small>{item.quantity}</small>}
                    </span>
                    <b>👍 {item.reactionCount}</b>
                  </button>
                );
              })}
            </div>
            <button
              className="global-pin-hide"
              onClick={() => {
                if (confirmHide()) setOpen(false);
              }}
            >
              GÖM FÖR MIG
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function NoteFollowButton({note,uid,groupId}:{note:BubbsunNote;uid:string;groupId:string}){
  const [following,setFollowing]=useState(false);
  useEffect(()=>watchFollowedNotes(uid,ids=>setFollowing(ids.has(note.id))),[uid,groupId,note.id]);
  const toggle=async()=>{const next=!following;if(next&&"Notification" in window&&Notification.permission==="default")await Notification.requestPermission();setFollowing(next);await setNoteFollowing(uid,groupId,note.id,next)};
  return <button type="button" className="note-follow-tool" onClick={()=>void toggle()}><Bell/><span><strong>{following?"SLUTA FÖLJA":"FÖLJ ANTECKNING"}</strong><small>Få en notis vid ändringar</small></span><ChevronRight/></button>;
}

function GroupSpaceTab({selected,groupName,groupIconId,activeGroupId,memberships,groups,onSelect,onSwitch}:{selected:boolean;groupName:string;groupIconId?:string;activeGroupId:string;memberships:Membership[];groups:Record<string,Group>;onSelect:()=>void;onSwitch:(groupId:string)=>void}){
  const [open,setOpen]=useState(false);
  const [counts,setCounts]=useState<Record<string,{lists:number;notes:number}>>({});
  const root=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(!open)return;const close=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false)};document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close)},[open]);
  useEffect(()=>{if(!selected)setOpen(false)},[selected]);
  useEffect(()=>{
    const unsubs=memberships.flatMap(membership=>[
      watchLists(membership.groupId,items=>setCounts(current=>({...current,[membership.groupId]:{lists:items.length,notes:current[membership.groupId]?.notes??0}}))),
      watchNotes(membership.groupId,items=>setCounts(current=>({...current,[membership.groupId]:{lists:current[membership.groupId]?.lists??0,notes:items.length}}))),
    ]);
    return()=>unsubs.forEach(unsubscribe=>unsubscribe());
  },[memberships]);
  return <div ref={root} className={`group-space-tab ${selected?"selected has-menu":"group-space-tab-static"} ${open?"menu-open":""}`}>
    <button type="button" className="group-space-main" aria-label={selected?"Byt grupp":"Öppna grupper"} aria-expanded={open} onClick={()=>{if(!memberships.length){setOpen(value=>!value);return}if(!selected){onSelect();return}setOpen(value=>!value)}}>{groupIconId?<GroupIcon id={groupIconId}/>:<Users/>}<span>GRUPP<small>{groupName}</small></span></button>
    {selected&&!!memberships.length&&<button type="button" className="group-space-trigger" aria-label="Byt grupp" aria-expanded={open} onClick={()=>setOpen(value=>!value)}><ChevronDown className={open?"turn":""}/></button>}
    {open&&<div className="group-space-menu" role="menu">{memberships.length?memberships.map(membership=>{const group=groups[membership.groupId],count=counts[membership.groupId]??{lists:0,notes:0};return <button type="button" role="menuitem" key={membership.groupId} className={membership.groupId===activeGroupId?"selected":""} onClick={()=>{setOpen(false);if(membership.groupId!==activeGroupId)onSwitch(membership.groupId)}}><span className="group-space-menu-icon">{group?.iconId?<GroupIcon id={group.iconId}/>:<Users/>}</span><strong>{group?.name||"Grupp"}</strong><span className="group-space-menu-counts"><span title={`${count.lists} listor`}><ListChecks/><b>{count.lists}</b></span><span title={`${count.notes} anteckningar`}><NotebookPen/><b>{count.notes}</b></span></span>{membership.groupId===activeGroupId&&<Check/>}</button>}):<button type="button" className="group-empty-state" onClick={()=>{setOpen(false);window.dispatchEvent(new CustomEvent("bubbsun:navigate",{detail:"people"}))}}><Users/><span><strong>Ingen grupp ännu</strong><small>Skapa en grupp eller gå med i en på sidan Användare &amp; grupper.</small><b>TILL ANVÄNDARE &amp; GRUPPER</b></span><ChevronRight/></button>}</div>}
  </div>
}

function NotesPage({notes,privateMode,groupName,groupIconId,activeGroupId,memberships,groups,resolveCreatorColor,followedNoteIds,onMode,onSwitchGroup,onLists,onHelp,onOpen,onReorder}:{notes:BubbsunNote[];privateMode:boolean;groupName:string;groupIconId?:string;activeGroupId:string;memberships:Membership[];groups:Record<string,Group>;resolveCreatorColor:(note:BubbsunNote)=>number;followedNoteIds:Set<string>;onMode:(value:boolean)=>void;onSwitchGroup:(groupId:string)=>void;onLists:()=>void;onHelp:()=>void;onOpen:(note:BubbsunNote)=>void;onReorder:(from:number,to:number)=>void}){
  const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:5}}),useSensor(TouchSensor,{activationConstraint:{delay:180,tolerance:8}}));
  const end=(event:DragEndEvent)=>{if(!event.over||event.active.id===event.over.id)return;const from=notes.findIndex(note=>note.id===event.active.id),to=notes.findIndex(note=>note.id===event.over?.id);if(from>=0&&to>=0)onReorder(from,to)};
  return <section className="content list-page notes-page"><div className="space-tabs space-tabs-refined"><button className={privateMode?"selected":""} onClick={()=>onMode(true)}><LockKeyhole/><span>PRIVAT</span></button><GroupSpaceTab selected={!privateMode} groupName={groupName} groupIconId={groupIconId} activeGroupId={activeGroupId} memberships={memberships} groups={groups} onSelect={()=>onMode(false)} onSwitch={onSwitchGroup}/></div><div className="content-tabs content-tabs-refined"><button onClick={onLists}><ListChecks/> LISTOR</button><button className="selected"><NotebookPen/> ANTECKNINGAR</button></div>{!notes.length&&<div className="empty-card"><NotebookPen/><strong>{privateMode?"Här är tomt än så länge":"Gruppen har inga anteckningar än"}</strong><span>{privateMode?"Skapa din första anteckning med plusknappen uppe till höger.":"Skapa gruppens första anteckning med plusknappen uppe till höger."}</span><button type="button" onClick={onHelp}><span>👋</span><span><b>NY HÄR?</b><small>Här kan du skriva idéer, planer och sådant du vill minnas.</small></span><ChevronRight/></button></div>}<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={end}><SortableContext items={notes.map(note=>note.id)} strategy={rectSortingStrategy}><div className="list-stack">{notes.map(note=><SortableNoteCard key={note.id} note={note} creatorColor={resolveCreatorColor(note)} followed={!privateMode&&followedNoteIds.has(note.id)} onOpen={()=>onOpen(note)}/>)}</div></SortableContext></DndContext></section>
}
const noteDateText=(note:BubbsunNote)=>{const changed=(note.history?.length||0)>1,timestamp=changed?(note.updatedAt||note.history?.[0]?.at):(note.createdAt||note.history?.[note.history.length-1]?.at),label=changed?"Ändrad":"Skapad";if(!timestamp)return `${label}: nyss`;const value=new Date(timestamp),today=new Date(),sameDay=value.getFullYear()===today.getFullYear()&&value.getMonth()===today.getMonth()&&value.getDate()===today.getDate();return `${label}: ${sameDay?`Idag ${new Intl.DateTimeFormat("sv-SE",{hour:"2-digit",minute:"2-digit"}).format(value)}`:new Intl.DateTimeFormat("sv-SE",{dateStyle:"short",timeStyle:"short"}).format(value)}`};
function SortableNoteCard({note,creatorColor,followed,onOpen}:{note:BubbsunNote;creatorColor:number;followed:boolean;onOpen:()=>void}){const sortable=useSortable({id:note.id});return <div ref={sortable.setNodeRef} style={{transform:CSS.Transform.toString(sortable.transform),transition:sortable.transition} as CSSProperties} className={`list-card-shell ${sortable.isDragging?"dragging":""}`}><div className="list-card note-list-card"><span className="list-icon" style={{background:rgbaHex(note.color)}}><img src={noteIconSource(note.icon)} alt=""/></span><span className="creator-strip" style={{background:rgbaHex(creatorColor)}}/><span className="list-copy"><strong>{note.title}</strong><small className="list-counts note-date-line">{followed&&<Bell className="followed-list-mark" aria-label="Du följer anteckningen"/>}<span>{noteDateText(note)}</span></small></span><button type="button" className="note-card-open" aria-label={`Öppna ${note.title}`} onClick={onOpen}/><span className="card-actions"><button className="drag-handle no-hover" data-dnd-handle aria-label="Flytta anteckning" onClick={event=>event.stopPropagation()} {...sortable.attributes} {...sortable.listeners}><GripVertical/></button></span></div></div>}
function NoteAppearancePicker({icon,color,onIcon,onColor}:{icon:string;color:number;onIcon:(icon:string)=>void;onColor:(color:number)=>void}){return <><div className="note-icon-picker">{noteIcons.map(value=><button type="button" key={value} className={icon===value?"selected":""} onClick={()=>onIcon(value)}><img src={noteIconSource(value)} alt=""/></button>)}</div><div className="color-picker">{listColorOptions.map(value=><button type="button" key={value} className={color===value?"selected":""} onClick={()=>onColor(value)} style={{"--choice-color":rgbaHex(value)} as CSSProperties}/>)}</div></>}
function NoteEditorPage({note,onSave,onBack,onDelete,follow,creator,toolsOpen,onToolsOpen}:{note:BubbsunNote;onSave:(note:BubbsunNote)=>Promise<boolean>;onBack:()=>void;onDelete:()=>void;follow?:{uid:string;groupId:string};creator?:{name:string;color:number};toolsOpen:boolean;onToolsOpen:(open:boolean)=>void}){
  const [title,setTitle]=useState(note.title),[text,setText]=useState(note.text),[icon,setIcon]=useState(note.icon),[color,setColor]=useState(note.color),[logOpen,setLogOpen]=useState(false),[appearanceOpen,setAppearanceOpen]=useState(false),[confirmDelete,setConfirmDelete]=useState(false),[saving,setSaving]=useState(false);
  useEffect(()=>{setTitle(note.title);setText(note.text);setIcon(note.icon);setColor(note.color)},[note.id,note.title,note.text,note.icon,note.color]);
  const handleTab=(event:ReactKeyboardEvent<HTMLTextAreaElement>)=>{
    if(event.key!=="Tab")return;
    event.preventDefault();
    const field=event.currentTarget,start=field.selectionStart,end=field.selectionEnd;
    if(start===end){
      if(event.shiftKey){
        const lineStart=text.lastIndexOf("\n",start-1)+1,before=text.slice(lineStart,start),match=before.match(/^(?:\t| {1,4})/);
        if(!match)return;
        const next=text.slice(0,lineStart)+text.slice(lineStart+match[0].length);
        setText(next);
        requestAnimationFrame(()=>field.setSelectionRange(Math.max(lineStart,start-match[0].length),Math.max(lineStart,end-match[0].length)));
        return;
      }
      setText(text.slice(0,start)+"\t"+text.slice(end));
      requestAnimationFrame(()=>field.setSelectionRange(start+1,start+1));
      return;
    }
    const blockStart=text.lastIndexOf("\n",start-1)+1,nextBreak=text.indexOf("\n",end),blockEnd=nextBreak<0?text.length:nextBreak;
    const lines=text.slice(blockStart,blockEnd).split("\n");
    let firstChange=0,totalChange=0;
    const changed=lines.map((line,index)=>{
      if(!event.shiftKey){firstChange=index===0?1:firstChange;totalChange+=1;return "\t"+line}
      const match=line.match(/^(?:\t| {1,4})/),removed=match?.[0].length??0;
      if(index===0)firstChange=-removed;
      totalChange-=removed;
      return line.slice(removed);
    }).join("\n");
    setText(text.slice(0,blockStart)+changed+text.slice(blockEnd));
    requestAnimationFrame(()=>field.setSelectionRange(Math.max(blockStart,start+firstChange),Math.max(blockStart,end+totalChange)));
  };
  const save=async()=>{if(!title.trim()||saving)return;setSaving(true);try{if(await onSave({...note,title:title.trim(),text,icon,color}))onBack()}finally{setSaving(false)}};
  return <section className="content note-editor-page">
    {toolsOpen&&<div className={`list-tools-card note-editor-tools ${follow?"has-follow":""}`}>
      <button className="note-appearance-button" onClick={()=>{setAppearanceOpen(true);onToolsOpen(false)}}><Palette/><span><strong>ÄNDRA UTSEENDE</strong><small>Välj ikon och färg</small></span><ChevronRight/></button>
      <button className="note-log-button" onClick={()=>{setLogOpen(true);onToolsOpen(false)}}><History/><span><strong>ÄNDRINGSLOGG</strong><small>Se vem som har ändrat</small></span><ChevronRight/></button>
      {follow&&<NoteFollowButton note={note} uid={follow.uid} groupId={follow.groupId}/>}
    </div>}
    <article>
      <header className="note-editor-heading">
        <span className="note-editor-icon" style={{background:rgbaHex(color)}}><img src={noteIconSource(icon)} alt=""/></span>
        <div className="note-editor-heading-copy">
          <input id="note-title" value={title} onChange={event=>setTitle(event.target.value)} maxLength={80} placeholder="Rubrik"/>
          <p className="note-created" style={(creator?.color??note.creatorColor)?{"--creator-color":rgbaHex(creator?.color??note.creatorColor!)} as CSSProperties:undefined}>Skapad av <strong>{creator?.name||note.creatorName||"Bubbsun"}</strong></p>
        </div>
      </header>
      <label className="note-body-label" htmlFor="note-body">ANTECKNING</label>
      <textarea id="note-body" value={text} onChange={event=>setText(event.target.value)} onKeyDown={handleTab} placeholder="Skriv din anteckning här…"/>
      <div className="note-editor-actions"><button className="danger" onClick={()=>setConfirmDelete(true)}><Trash2/> TA BORT</button><span/><button className="cancel" onClick={onBack}>AVBRYT</button><button disabled={saving||!title.trim()} onClick={()=>void save()}>{saving?"SPARAR…":"SPARA"}</button></div>
    </article>
    {appearanceOpen&&<div className="modal-backdrop"><div className="modal note-appearance-modal"><div className="note-log-head"><h2>ÄNDRA UTSEENDE</h2><button className="modal-close" onClick={()=>setAppearanceOpen(false)} aria-label="Stäng"><X/></button></div><NoteAppearancePicker icon={icon} color={color} onIcon={setIcon} onColor={setColor}/><div className="modal-actions"><button className="cancel" onClick={()=>setAppearanceOpen(false)}>KLAR</button></div></div></div>}
    {confirmDelete&&<div className="modal-backdrop"><div className="modal confirm-delete-modal"><h2>TA BORT ANTECKNINGEN?</h2><p>Anteckningen “{note.title}” försvinner.</p><div className="modal-actions"><button className="cancel" onClick={()=>setConfirmDelete(false)}>AVBRYT</button><button className="danger" onClick={()=>onDelete()}>TA BORT</button></div></div></div>}
    {logOpen&&<div className="modal-backdrop"><div className="modal note-log-modal"><div className="note-log-head"><h2>ÄNDRINGSLOGG</h2><button className="modal-close" onClick={()=>setLogOpen(false)} aria-label="Stäng"><X/></button></div>{note.history?.length?<ul>{note.history.map((entry,index)=><li key={`${entry.at}-${index}`}><strong>{entry.name}</strong><small>{new Date(entry.at).toLocaleString("sv-SE")}</small></li>)}</ul>:<p>Ingen har sparat några ändringar ännu.</p>}</div></div>}
  </section>
}
function NewNoteEditor({onCancel,onSave}:{onCancel:()=>void;onSave:(note:BubbsunNote)=>void}){const [title,setTitle]=useState(""),[icon,setIcon]=useState("idea"),[color,setColor]=useState(listColorOptions[0]);return <div className="modal-backdrop"><form className="modal note-new-editor" onSubmit={event=>{event.preventDefault();if(title.trim())onSave({id:crypto.randomUUID(),title:title.trim(),text:"",icon,color,order:Date.now(),creatorId:""})}}><h2>NY ANTECKNING</h2><input autoFocus value={title} onChange={event=>setTitle(event.target.value)} placeholder="Vad handlar den om?"/><NoteAppearancePicker icon={icon} color={color} onIcon={setIcon} onColor={setColor}/><div className="modal-actions"><button type="button" className="cancel" onClick={onCancel}>AVBRYT</button><button type="submit">SKAPA</button></div></form></div>}

function ListsPage({
  lists,
  privateLists,
  privateMode,
  members,
  globalPin,
  uid,
  personalColor,
  supporter,
  onHidePin,
  onOpen,
  onHelp,
  onNotes,
  onSupport,
  onMode,
  onReorder,
  onEdit,
  onDelete,
  onPin,
  followedListIds,
  listReadAt,
  groupId,
  groupName,
  groupIconId,
  activeGroupId,
  memberships,
  groups,
  onSwitchGroup,
  canReorder,
}: {
  lists: BubbsunList[];
  privateLists: BubbsunList[];
  privateMode: boolean;
  members: Membership[];
  globalPin: GlobalPin | null;
  uid: string;
  personalColor: number;
  onHidePin: () => void;
  supporter: boolean;
  onOpen: (list: BubbsunList, isPrivate: boolean) => void;
  onHelp: () => void;
  onNotes: () => void;
  onSupport: () => void;
  onMode: (value: boolean) => void;
  onReorder: (from: number, to: number) => void;
  onEdit: (
    list: BubbsunList,
    values: { name: string; icon: string; iconColor: number; listType: string; packPeople:string[] },
  ) => void;
  onDelete: (list: BubbsunList) => void;
  onPin: (list: BubbsunList) => void;
  followedListIds: Set<string>;
  listReadAt: Map<string,number>;
  groupId: string;
  groupName: string;
  groupIconId?: string;
  activeGroupId: string;
  memberships: Membership[];
  groups: Record<string,Group>;
  onSwitchGroup: (groupId:string) => void;
  canReorder: boolean;
}) {
  const baseShown = privateMode
    ? [...privateLists].sort(
        (a, b) =>
          Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
          a.order - b.order,
      )
    : lists;
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const shown =
    typeFilter === "all"
      ? baseShown
      : baseShown.filter((list) => (list.listType || "other") === typeFilter);
  const privatePinned = privateMode
    ? []
    : [...privateLists]
        .filter((list) => list.pinned)
        .sort((a, b) => a.order - b.order);
  const [editingList, setEditingList] = useState<BubbsunList | null>(null);
  const [deletingList, setDeletingList] = useState<BubbsunList | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
  );
  useEffect(() => {
    if (!categoryMenuOpen) return;
    const closeMenu = (event: PointerEvent) => {
      if (!(event.target as HTMLElement).closest(".desktop-list-tab")) {
        setCategoryMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, [categoryMenuOpen]);
  const activeType =
    typeFilter === "all"
      ? null
      : listTypes.find((type) => type.id === typeFilter);
  const activeTypeCount =
    typeFilter === "all"
      ? baseShown.length
      : baseShown.filter(
          (list) => (list.listType || "other") === typeFilter,
        ).length;
  const dragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return;
    const from = shown.findIndex((x) => x.id === event.active.id),
      to = shown.findIndex((x) => x.id === event.over?.id);
    if (from >= 0 && to >= 0) onReorder(from, to);
  };
  return (
    <section className="content list-page">
      <div className="space-tabs space-tabs-refined">
        <button
          className={privateMode ? "selected" : ""}
          onClick={() => onMode(true)}
        >
          <LockKeyhole /> <span>PRIVAT</span>
        </button>
        <GroupSpaceTab selected={!privateMode} groupName={groupName} groupIconId={groupIconId} activeGroupId={activeGroupId} memberships={memberships} groups={groups} onSelect={()=>onMode(false)} onSwitch={onSwitchGroup}/>
      </div>
      <div className="content-tabs content-tabs-refined">
        <div className="desktop-list-tab selected">
          <button type="button" className="content-tab-main">
            <ListChecks /> LISTOR
          </button>
          <button
            type="button"
            className="desktop-category-trigger"
            aria-label="Välj listkategori"
            aria-expanded={categoryMenuOpen}
            onClick={() => setCategoryMenuOpen((open) => !open)}
          >
            <span>{activeType?.icon || ""}</span>
            <b>{activeType?.label || "Alla listor"}</b>
            <small>{activeTypeCount}</small>
            <ChevronDown className={categoryMenuOpen ? "turn" : ""} />
          </button>
          {categoryMenuOpen && (
            <div className="desktop-category-menu" role="menu">
              <button
                type="button"
                className={typeFilter === "all" ? "selected" : ""}
                onClick={() => {
                  setTypeFilter("all");
                  setCategoryMenuOpen(false);
                }}
              >
                <span aria-hidden="true" /><b>Alla listor</b>
                <small>{baseShown.length}</small>
                {typeFilter === "all" && <Check />}
              </button>
              {listTypes.map((type) => {
                const count = baseShown.filter(
                  (list) => (list.listType || "other") === type.id,
                ).length;
                return (
                  <button
                    type="button"
                    key={type.id}
                    className={typeFilter === type.id ? "selected" : ""}
                    onClick={() => {
                      setTypeFilter(type.id);
                      setCategoryMenuOpen(false);
                    }}
                  >
                    <span>{type.icon}</span><b>{type.label}</b><small>{count}</small>
                    {typeFilter === type.id && <Check />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button onClick={onNotes}><NotebookPen /> ANTECKNINGAR</button>
      </div>
      <div className="list-type-filters" aria-label="Filtrera listor efter typ">
        <button
          className={typeFilter === "all" ? "selected" : ""}
          onClick={() => setTypeFilter("all")}
        >
          ALLA <small>{baseShown.length}</small>
        </button>
        {listTypes.map((type) => {
          const count = baseShown.filter(
            (list) => (list.listType || "other") === type.id,
          ).length;
          return (
            <button
              key={type.id}
              className={typeFilter === type.id ? "selected" : ""}
              onClick={() => setTypeFilter(type.id)}
            >
              <i aria-hidden="true">{type.icon}</i> {type.label}
              {count > 0 && <small>{count}</small>}
            </button>
          );
        })}
      </div>
      <InstallLauncher place="banner" />
      {!privateMode && globalPin && (
        <GlobalPinCard pin={globalPin} uid={uid} onHide={onHidePin} />
      )}
      {privatePinned.length > 0 && (
        <div className="private-pinned-shortcuts">
          <div className="private-pinned-heading">
            <Pin />
            <span>
              <strong>MINA PINNADE LISTOR</strong>
              <small>Privata · syns bara för dig</small>
            </span>
          </div>
          <div className="list-stack">
            {privatePinned.map((list) => (
              <div
                className="private-pinned-card"
                key={`private-pin-${list.id}`}
              >
                <ListCard
                  list={list}
                  members={[]}
                  privateColor={personalColor}
                  canDrag={false}
                  onOpen={() => onOpen(list, true)}
                  onPin={() => onPin(list)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      {shown.length === 0 && (
        <div className="empty-card empty-first-list">
          <ListChecks />
          <strong>Här är tomt än så länge</strong>
          <span>Skapa din första lista med plusknappen uppe till höger.</span>
          <button type="button" onClick={onHelp}>
            <span>👋</span>
            <span>
              <b>NY HÄR?</b>
              <small>Öppna Hjälp & guider</small>
            </span>
            <ChevronRight />
          </button>
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={dragEnd}
      >
        <SortableContext
          items={shown.map((x) => x.id)}
          strategy={rectSortingStrategy}
        >
          <div className="list-stack">
            {shown.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                members={members}
                privateColor={privateMode ? personalColor : undefined}
                followed={
                  !privateMode && followedListIds.has(`${groupId}_${list.id}`)
                }
                hasNew={!privateMode&&list.items.some(item=>item.ownerId!==uid&&item.createdAt>(listReadAt.get(`${groupId}_${list.id}`)??NEW_BADGE_EPOCH))}
                canDrag={canReorder && typeFilter === "all"}
                onOpen={() => onOpen(list, privateMode)}
                onPin={privateMode ? () => onPin(list) : undefined}
                onEdit={() => setEditingList(list)}
                onDelete={() => setDeletingList(list)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {editingList && (
        <ListEditor
          title="REDIGERA LISTA"
          initial={editingList}
          supporter={supporter}
          onSupport={() => {
            setEditingList(null);
            onSupport();
          }}
          onCancel={() => setEditingList(null)}
          onSave={(values) => {
            onEdit(editingList, values);
            setEditingList(null);
          }}
        />
      )}
      {deletingList && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>TA BORT LISTAN?</h2>
            <p>Alla poster i “{deletingList.name}” försvinner.</p>
            <div>
              <button className="cancel" onClick={() => setDeletingList(null)}>AVBRYT</button>
              <button
                className="danger"
                onClick={() => {
                  onDelete(deletingList);
                  setDeletingList(null);
                }}
              >
                TA BORT
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function SortableItemRow({
  item,
  owner,
  uid,
  canDrag,
  selecting,
  selected,
  onSelect,
  onToggle,
  onPatch,
  onMenu,
  expanded,
  flashUnsaved,
  onRequestExpand,
  onDirtyChange,
  onCloseEditor,
  isNew,
  listType,
  packPeople,
  members,
}: {
  item: ListItem;
  owner?: Membership;
  uid: string;
  canDrag: boolean;
  selecting: boolean;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onPatch: (updater: (item: ListItem) => ListItem) => void;
  onMenu: () => void;
  expanded: boolean;
  flashUnsaved: boolean;
  onRequestExpand: () => void;
  onDirtyChange: (dirty:boolean) => void;
  onCloseEditor: () => void;
  isNew: boolean;
  listType?: string;
  packPeople?: string[];
  members: Membership[];
}) {
  const sortable = useSortable({ id: item.id, disabled: !canDrag });
  const liked = item.likedBy.includes(uid);
  const [draftName,setDraftName]=useState(item.name);
  const [draftQuantity,setDraftQuantity]=useState(item.quantity);
  const [draftNote,setDraftNote]=useState(item.note||"");
  const [draftAssignedTo,setDraftAssignedTo]=useState(item.assignedTo||"");
  const [draftAssigneeId,setDraftAssigneeId]=useState(item.assigneeId||members.find(member=>member.displayName===(item.assigneeName||item.assignedTo))?.uid||"");
  const [draftStatus,setDraftStatus]=useState(item.status||"");
  const [draftPriority,setDraftPriority]=useState(item.priority||"Normal");
  const [draftRoom,setDraftRoom]=useState(item.room||"");
  const [draftRecurrence,setDraftRecurrence]=useState(item.recurrence||"");
  const [draftDueDate,setDraftDueDate]=useState(item.dueDate||"");
  const [draftTaskType,setDraftTaskType]=useState(item.taskType||"");
  const swipeStart=useRef<{x:number;y:number;pointerId:number}|null>(null);
  const suppressSwipeClick=useRef(false);
  const [swipeOffset,setSwipeOffset]=useState(0);
  const [swiping,setSwiping]=useState(false);
  useEffect(()=>{setDraftName(item.name);setDraftQuantity(item.quantity);setDraftNote(item.note||"");setDraftAssignedTo(item.assignedTo||"");setDraftAssigneeId(item.assigneeId||members.find(member=>member.displayName===(item.assigneeName||item.assignedTo))?.uid||"");setDraftStatus(item.status||"");setDraftPriority(item.priority||"Normal");setDraftRoom(item.room||"");setDraftRecurrence(item.recurrence||"");setDraftDueDate(item.dueDate||"");setDraftTaskType(item.taskType||"");},[item.name,item.quantity,item.note,item.assignedTo,item.assigneeId,item.assigneeName,item.status,item.priority,item.room,item.recurrence,item.dueDate,item.taskType,members]);
  const startSwipe=(event:ReactPointerEvent<HTMLDivElement>)=>{
    if(event.pointerType!=="touch"||selecting||expanded)return;
    const target=event.target as HTMLElement;
    if(target.closest(".check-button,.like-button,.item-combined-handle"))return;
    swipeStart.current={x:event.clientX,y:event.clientY,pointerId:event.pointerId};
    suppressSwipeClick.current=false;
  };
  const moveSwipe=(event:ReactPointerEvent<HTMLDivElement>)=>{
    const start=swipeStart.current;
    if(!start||start.pointerId!==event.pointerId)return;
    const dx=event.clientX-start.x,dy=event.clientY-start.y;
    if(!swiping&&Math.abs(dy)>Math.abs(dx)+8){swipeStart.current=null;setSwipeOffset(0);return;}
    if(Math.abs(dx)<10||Math.abs(dx)<Math.abs(dy)*1.2)return;
    if(!swiping){setSwiping(true);event.currentTarget.setPointerCapture(event.pointerId);}
    suppressSwipeClick.current=true;
    setSwipeOffset(Math.max(-92,Math.min(92,dx)));
  };
  const endSwipe=(event:ReactPointerEvent<HTMLDivElement>)=>{
    const start=swipeStart.current;
    if(!start||start.pointerId!==event.pointerId)return;
    const dx=event.clientX-start.x,dy=event.clientY-start.y;
    if(event.type==="pointerup"&&Math.abs(dx)>=70&&Math.abs(dx)>Math.abs(dy)*1.2)onToggle();
    swipeStart.current=null;
    setSwiping(false);
    setSwipeOffset(0);
    window.setTimeout(()=>{suppressSwipeClick.current=false},0);
  };
  return (
    <div className={`item-row-wrap ${expanded?"expanded":""}`}>
    <div
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
        "--item-swipe-x":`${swipeOffset}px`,
      }}
      className={`item-row ${item.completed ? "done" : ""} ${sortable.isDragging ? "dragging" : ""} ${swiping ? "swiping" : ""} ${Math.abs(swipeOffset)>=70 ? "swipe-ready" : ""}`}
      onPointerDown={startSwipe}
      onPointerMove={moveSwipe}
      onPointerUp={endSwipe}
      onPointerCancel={endSwipe}
      onClickCapture={event=>{if(suppressSwipeClick.current){event.preventDefault();event.stopPropagation()}}}
    >
      <span
        className="item-owner"
        style={{ background: owner ? rgbaHex(owner.color) : "#888" }}
      />
      <button
        className={`check-button ${selecting && selected ? "selected-for-delete" : ""}`}
        onClick={selecting ? onSelect : onToggle}
      >
        {(selecting ? selected : item.completed) && <Check />}
      </button>
      <button className="item-copy" onClick={()=>!selecting&&onRequestExpand()} aria-expanded={expanded}>
        <span className="item-title-line">{item.note&&<NotebookPen className="item-note-marker" aria-label="Har anteckning" />}<strong>{item.name}</strong>{isNew&&<em className="new-badge item-new-badge">NYTT</em>}</span>
        {(item.quantity||item.assignedTo||item.assigneeName||item.status||item.room||item.recurrence||item.taskType||item.dueDate||((listType==="wishlist"||listType==="home")&&item.priority)) && <small>{[item.quantity,item.room&&(listType==="home"?`Plats: ${item.room}`:`Rum: ${item.room}`),item.taskType&&`Typ: ${item.taskType}`,(item.assigneeName||item.assignedTo)&&(listType==="cleaning"||listType==="home"?`Ansvarig: ${item.assigneeName||item.assignedTo}`:`Till: ${item.assignedTo}`),item.recurrence&&`Upprepas: ${item.recurrence}`,item.status,(listType==="wishlist"||listType==="home")&&item.priority&&`Prioritet: ${item.priority}`,item.dueDate&&`Senast ${shortDate(item.dueDate)}`].filter(Boolean).join(" · ")}</small>}
      </button>
      {!selecting && (
        <>
          <button
            className={`like-button flame-button no-hover ${item.likedBy.length ? "has-votes" : ""} ${liked ? "liked" : ""}`}
            aria-label={liked ? "Ta bort din eld" : "Ge en eld"}
            title={liked ? "Ta bort din eld" : "Ge en eld"}
            onClick={() =>
              onPatch((x) => ({
                ...x,
                likedBy: liked
                  ? x.likedBy.filter((value) => value !== uid)
                  : [...x.likedBy, uid],
              }))
            }
          >
            <span aria-hidden="true" />
            <small>{item.likedBy.length || ""}</small>
          </button>
          <button
            className="item-drag-handle item-combined-handle no-hover"
            aria-label="Flytta eller hantera posten"
            title={
              canDrag ? "Dra för ordning · klicka för meny" : "Klicka för meny"
            }
            onClick={onMenu}
            {...(canDrag ? sortable.attributes : {})}
            {...(canDrag ? sortable.listeners : {})}
          >
            <GripVertical />
          </button>
        </>
      )}
    </div>
    {expanded&&!selecting&&<div id={`item-editor-${item.id}`} className={`item-inline-editor ${flashUnsaved?"flash-unsaved":""}`}>
      <label>Namn<input value={draftName} onChange={event=>{setDraftName(event.target.value);onDirtyChange(true)}} /></label>
      <label>Mängd (valfritt)<input value={draftQuantity} onChange={event=>{setDraftQuantity(event.target.value);onDirtyChange(true)}} /></label>
      <label className="item-note-field">Anteckning (valfritt)<textarea value={draftNote} onChange={event=>{setDraftNote(event.target.value);onDirtyChange(true)}} placeholder="Skriv en anteckning…" /></label>
      {listType==="packing"&&<label>Vem ska ha med den?<select value={draftAssignedTo} onChange={event=>{setDraftAssignedTo(event.target.value);onDirtyChange(true)}}><option value="">Alla</option>{(packPeople||[]).map(person=><option key={person}>{person}</option>)}</select></label>}
      {listType==="home"&&<label>Status<select value={draftStatus} onChange={event=>{setDraftStatus(event.target.value);onDirtyChange(true)}}><option value="">Att göra</option><option>Att göra</option><option>Pågår</option><option>Klart</option></select></label>}
      {listType==="orders"&&<label>Status<select value={draftStatus} onChange={event=>{setDraftStatus(event.target.value);onDirtyChange(true)}}><option value="">Välj status</option><option>Beställt</option><option>På gång</option><option>Skickat</option><option>Levererat</option><option>Klart</option></select></label>}
      {listType==="wishlist"&&<label>Önskas mest?<select value={draftPriority} onChange={event=>{setDraftPriority(event.target.value);onDirtyChange(true)}}><option>Låg</option><option>Normal</option><option>Hög</option><option>Dröm</option></select></label>}
      {listType==="cleaning"&&<><label>Rum<select value={draftRoom} onChange={event=>{setDraftRoom(event.target.value);onDirtyChange(true)}}><option value="">Välj rum</option>{cleaningRooms.map(room=><option key={room}>{room}</option>)}</select></label><label>Ansvarig<select value={draftAssigneeId} onChange={event=>{setDraftAssigneeId(event.target.value);onDirtyChange(true)}}><option value="">Ingen särskild</option>{members.map(member=><option key={member.uid} value={member.uid}>{member.displayName}</option>)}</select></label><label>Upprepas<select value={draftRecurrence} onChange={event=>{setDraftRecurrence(event.target.value);onDirtyChange(true)}}><option value="">Ingen upprepning</option>{cleaningRecurrences.map(value=><option key={value}>{value}</option>)}</select></label></>}
      {listType==="home"&&<><label>Plats<select value={draftRoom} onChange={event=>{setDraftRoom(event.target.value);onDirtyChange(true)}}><option value="">Välj plats</option>{homeFixPlaces.map(place=><option key={place}>{place}</option>)}</select></label><label>Ansvarig<select value={draftAssigneeId} onChange={event=>{setDraftAssigneeId(event.target.value);onDirtyChange(true)}}><option value="">Ingen särskild</option>{members.map(member=><option key={member.uid} value={member.uid}>{member.displayName}</option>)}</select></label><label>Prioritet<select value={draftPriority} onChange={event=>{setDraftPriority(event.target.value);onDirtyChange(true)}}>{homeFixPriorities.map(value=><option key={value}>{value}</option>)}</select></label><label>Typ av jobb<select value={draftTaskType} onChange={event=>{setDraftTaskType(event.target.value);onDirtyChange(true)}}><option value="">Välj typ</option>{homeFixTypes.map(value=><option key={value}>{value}</option>)}</select></label><label>Deadline (valfritt)<input type="date" value={draftDueDate} onChange={event=>{setDraftDueDate(event.target.value);onDirtyChange(true)}} /></label></>}
      <div><button className="cancel" onClick={()=>{setDraftName(item.name);setDraftQuantity(item.quantity);setDraftNote(item.note||"");setDraftAssignedTo(item.assignedTo||"");setDraftAssigneeId(item.assigneeId||"");setDraftRoom(item.room||"");setDraftRecurrence(item.recurrence||"");setDraftDueDate(item.dueDate||"");setDraftTaskType(item.taskType||"");onDirtyChange(false);onCloseEditor()}}>AVBRYT</button><button onClick={()=>{const clean=draftName.trim();if(!clean)return;const assignee=members.find(member=>member.uid===draftAssigneeId);onPatch(value=>({...value,name:clean,quantity:draftQuantity.trim(),note:draftNote.trim(),assignedTo:listType==="packing"?draftAssignedTo:undefined,assigneeId:listType==="cleaning"||listType==="home"?assignee?.uid:undefined,assigneeName:listType==="cleaning"||listType==="home"?assignee?.displayName:undefined,status:listType==="home"||listType==="orders"?draftStatus:undefined,priority:listType==="wishlist"||listType==="home"?draftPriority:undefined,room:listType==="cleaning"||listType==="home"?draftRoom:undefined,recurrence:listType==="cleaning"?draftRecurrence:undefined,dueDate:listType==="home"?draftDueDate:undefined,taskType:listType==="home"?draftTaskType:undefined}));onDirtyChange(false);onCloseEditor()}}>SPARA</button></div>
    </div>}
    </div>
  );
}

function ListPage({
  list,
  siblingLists,
  members,
  uid,
  supporter,
  isPrivate,
  canManage,
  groupId,
  toolsOpen,
  onToolsOpen,
  onBack,
  onSupport,
  onChange,
  onMoveItem,
  onMoveItems,
  onDelete,
  unreadAfter,
}: {
  list: BubbsunList;
  members: Membership[];
  uid: string;
  isPrivate: boolean;
  onBack: () => void;
  onSupport: () => void;
  siblingLists: BubbsunList[];
  supporter: boolean;
  canManage: boolean;
  groupId: string;
  toolsOpen: boolean;
  onToolsOpen: (open: boolean) => void;
  onChange: (next: BubbsunList) => void;
  onMoveItem: (item: ListItem, targetId: string) => Promise<void>;
  onMoveItems: (items: ListItem[], targetId: string) => Promise<void>;
  onDelete: () => void;
  unreadAfter: number;
}) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [newItemNote,setNewItemNote]=useState("");
  const [showNewItemNote,setShowNewItemNote]=useState(false);
  const [assignedTo,setAssignedTo]=useState("");
  const [itemStatus,setItemStatus]=useState("");
  const [priority,setPriority]=useState("Normal");
  const [cleaningRoom,setCleaningRoom]=useState("");
  const [cleaningAssignee,setCleaningAssignee]=useState("");
  const [cleaningRecurrence,setCleaningRecurrence]=useState("");
  const [homeFixPlace,setHomeFixPlace]=useState("");
  const [homeFixPriority,setHomeFixPriority]=useState("Normal");
  const [search, setSearch] = useState("");
  const [showDone, setShowDone] = useState(() => {
    try {
      return localStorage.getItem("bubbsun-show-completed") !== "false";
    } catch {
      return true;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("bubbsun-show-completed", String(showDone));
    } catch {
      // The preference is optional when storage is unavailable.
    }
  }, [showDone]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteItems,setConfirmDeleteItems]=useState<ListItem[]|null>(null);
  const [editing, setEditing] = useState(false);
  const [selectMode, setSelectMode] = useState<"" | "delete" | "move">("");
  const selecting = Boolean(selectMode);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const allItemsSelected = list.items.length > 0 && selectedIds.size === list.items.length;
  const [itemMenu, setItemMenu] = useState<ListItem | null>(null);
  const [moveItem, setMoveItem] = useState<ListItem | null>(null);
  const [moveMany, setMoveMany] = useState(false);
  const [moving, setMoving] = useState(false);
  const [following, setFollowing] = useState(false);
  const [expandedItemId,setExpandedItemId]=useState<string|null>(null);
  const [dirtyItemId,setDirtyItemId]=useState<string|null>(null);
  const [flashUnsavedId,setFlashUnsavedId]=useState<string|null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [shareOpen,setShareOpen]=useState(false);
  const [shareNotes,setShareNotes]=useState(false);
  const [sharing, setSharing] = useState(false);
  const [printOpen,setPrintOpen]=useState(false);
  const [printScope,setPrintScope]=useState<"pending"|"all"|"done">("pending");
  const [printNotes,setPrintNotes]=useState(false);
  useEffect(
    () =>
      isPrivate
        ? undefined
        : watchFollowedLists(uid, (ids) =>
            setFollowing(ids.has(`${groupId}_${list.id}`)),
          ),
    [uid, groupId, list.id, isPrivate],
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
  );
  const sortItems = (items: ListItem[]) => {
    const next = [...items];
    if (list.sortMode === "az")
      next.sort((a, b) => a.name.localeCompare(b.name, "sv"));
    if (list.sortMode === "za")
      next.sort((a, b) => b.name.localeCompare(a.name, "sv"));
    if (list.sortMode === "newest")
      next.sort((a, b) => b.createdAt - a.createdAt);
    if (list.sortMode === "oldest")
      next.sort((a, b) => a.createdAt - b.createdAt);
    return next;
  };
  const pending = sortItems(
    list.items.filter(
      (x) =>
        !x.completed && x.name.toLowerCase().includes(search.toLowerCase()),
    ),
  );
  const done = sortItems(
    list.items.filter(
      (x) => x.completed && x.name.toLowerCase().includes(search.toLowerCase()),
    ),
  );
  const normalized = (value: string) =>
    value.trim().replace(/\s+/g, " ").toLocaleLowerCase("sv");
  const suggestionQuery = normalized(name);
  const itemSuggestions = suggestionQuery.length >= 3
    ? Array.from(
        new Map(
          [list, ...siblingLists]
            .flatMap((source) => source.items.map((item) => item.name.trim()))
            .filter(Boolean)
            .map((value) => [normalized(value), value] as const),
        ).values(),
      )
        .filter((value) => normalized(value).includes(suggestionQuery))
        .sort((a, b) => {
          const aStarts = normalized(a).startsWith(suggestionQuery);
          const bStarts = normalized(b).startsWith(suggestionQuery);
          return aStarts === bStarts ? a.localeCompare(b, "sv") : aStarts ? -1 : 1;
        })
        .slice(0, 6)
    : [];
  const add = (suggestedName?: string) => {
    const cleanName = (suggestedName ?? name).trim().replace(/\s+/g, " ");
    if (!cleanName) return;
    const existing = list.items.find(
      (item) => normalized(item.name) === normalized(cleanName),
    );
    if (existing) {
      if (existing.completed) {
        const restored = {
          ...existing,
          completed: false,
          completedAt: null,
          quantity: quantity.trim() || existing.quantity,
          note: newItemNote.trim() || existing.note,
        };
        onChange({
          ...list,
          items: [
            restored,
            ...list.items.filter((item) => item.id !== existing.id),
          ],
        });
      }
      setName("");
      setQuantity("");
      setNewItemNote("");
      setShowNewItemNote(false);
      return;
    }
    const item: ListItem = {
      id: crypto.randomUUID(),
      name: cleanName,
      quantity: quantity.trim(),
      ownerId: uid,
      completed: false,
      createdAt: Date.now(),
      completedAt: null,
      likedBy: [],
      ...(newItemNote.trim()?{note:newItemNote.trim()}:{}),
      ...(list.listType==="packing"&&assignedTo?{assignedTo}:{}),
      ...((list.listType==="home"||list.listType==="orders")&&itemStatus?{status:itemStatus}:{}),
      ...(list.listType==="wishlist"?{priority}:{}),
      ...(list.listType==="cleaning"&&cleaningRoom?{room:cleaningRoom}:{}),
      ...(list.listType==="cleaning"&&cleaningAssignee?{assigneeId:cleaningAssignee,assigneeName:members.find(member=>member.uid===cleaningAssignee)?.displayName||""}:{}),
      ...(list.listType==="cleaning"&&cleaningRecurrence?{recurrence:cleaningRecurrence}:{}),
      ...(list.listType==="home"&&homeFixPlace?{room:homeFixPlace}:{}),
      ...(list.listType==="home"?{priority:homeFixPriority}:{}),
    };
    onChange({ ...list, items: [item, ...list.items] });
    setName("");
    setQuantity("");
    setNewItemNote("");
    setShowNewItemNote(false);
    setAssignedTo("");setItemStatus("");setPriority("Normal");setCleaningRoom("");setCleaningAssignee("");setCleaningRecurrence("");setHomeFixPlace("");setHomeFixPriority("Normal");
  };
  const patchItem = (id: string, updater: (x: ListItem) => ListItem) =>
    onChange({
      ...list,
      items: list.items.map((x) => (x.id === id ? updater(x) : x)),
    });
  const toggleCompleted = (item: ListItem) => {
    const changed = {
      ...item,
      completed: !item.completed,
      completedAt: !item.completed ? Date.now() : null,
    };
    const rest = list.items.filter((value) => value.id !== item.id);
    const firstSameState = rest.findIndex(
      (value) => value.completed === changed.completed,
    );
    const insertAt = firstSameState < 0 ? rest.length : firstSameState;
    const next = [...rest];
    next.splice(insertAt, 0, changed);
    onChange({ ...list, items: next });
  };
  const requestItemEditor=(itemId:string)=>{
    if(expandedItemId&&dirtyItemId===expandedItemId&&expandedItemId!==itemId){
      setFlashUnsavedId(null);
      requestAnimationFrame(()=>{setFlashUnsavedId(expandedItemId);document.getElementById(`item-editor-${expandedItemId}`)?.scrollIntoView({behavior:"smooth",block:"center"});});
      return;
    }
    if(expandedItemId===itemId){
      if(dirtyItemId===itemId){setFlashUnsavedId(null);requestAnimationFrame(()=>setFlashUnsavedId(itemId));return;}
      setExpandedItemId(null);return;
    }
    setFlashUnsavedId(null);setExpandedItemId(itemId);
  };
  const itemRow = (item: ListItem) => (
    <SortableItemRow
      key={item.id}
      item={item}
      owner={members.find((x) => x.uid === item.ownerId)}
      uid={uid}
      canDrag={!selecting && canManage && list.sortMode === "custom" && !search}
      selecting={selecting}
      selected={selectedIds.has(item.id)}
      onSelect={() =>
        setSelectedIds((old) => {
          const next = new Set(old);
          if (next.has(item.id)) next.delete(item.id);
          else next.add(item.id);
          return next;
        })
      }
      onToggle={() => toggleCompleted(item)}
      onPatch={(updater) => patchItem(item.id, updater)}
      onMenu={() => setItemMenu(item)}
      expanded={expandedItemId===item.id}
      flashUnsaved={flashUnsavedId===item.id}
      onRequestExpand={()=>requestItemEditor(item.id)}
      onDirtyChange={dirty=>setDirtyItemId(dirty?item.id:null)}
      onCloseEditor={()=>{setExpandedItemId(null);setFlashUnsavedId(null)}}
      isNew={!isPrivate&&item.ownerId!==uid&&item.createdAt>unreadAfter}
      listType={list.listType}
      packPeople={list.packPeople}
      members={members}
    />
  );
  const dragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return;
    const active = list.items.find((x) => x.id === event.active.id),
      over = list.items.find((x) => x.id === event.over?.id);
    if (!active || !over || active.completed !== over.completed) return;
    const section = list.items.filter((x) => x.completed === active.completed),
      from = section.findIndex((x) => x.id === active.id),
      to = section.findIndex((x) => x.id === over.id);
    if (from < 0 || to < 0) return;
    const reordered = arrayMove(section, from, to),
      iterator = reordered[Symbol.iterator]();
    onChange({
      ...list,
      items: list.items.map((item) =>
        item.completed === active.completed
          ? (iterator.next().value ?? item)
          : item,
      ),
    });
  };
  const toggleFollow = async () => {
    if (isPrivate) return;
    const next = !following;
    if (
      next &&
      "Notification" in window &&
      Notification.permission === "default"
    )
      await Notification.requestPermission();
    setFollowing(next);
    await setListFollowing(uid, groupId, list.id, next);
  };
  return (
    <section className="content detail-page">
      <div
        className="detail-title hanging-list-tab"
        role="button"
        tabIndex={0}
        onClick={onBack}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") onBack();
        }}
        aria-label="Till listorna"
      >
        <span
          className="detail-list-icon"
          style={{
            background:
              typeof list.iconColor === "number"
                ? rgbaHex(list.iconColor)
                : String(list.iconColor),
          }}
        >
          <img src={iconSources[list.icon] || fallbackIcon} alt="" />
        </span>
        <h1>{list.name}</h1>
      </div>
      {toolsOpen && (
        <div className="list-tools-card">
          <button
            className="item-action-share"
            disabled={sharing}
            onClick={() => {setShareOpen(true);setShareUrl("");onToolsOpen(false);}}
          >
            <Share2 />
            <span><strong>DELA LISTA</strong><small>Skapa en skrivskyddad länk</small></span>
            <ChevronRight />
          </button>
          <button className="item-action-print" onClick={()=>{setPrintOpen(true);onToolsOpen(false)}}>
            <Printer />
            <span><strong>SKRIV UT</strong><small>Välj vilka poster som ska skrivas ut</small></span>
            <ChevronRight />
          </button>
          {!isPrivate && (
            <button onClick={() => void toggleFollow()}>
              <Bell />
              <span>
                <strong>
                  {following ? "SLUTA FÖLJA LISTA" : "FÖLJ LISTA"}
                </strong>
                <small>Få en notis när någon annan ändrar listan</small>
              </span>
              <ChevronRight />
            </button>
          )}
          {canManage && (
            <>
              <button
                className="item-action-edit"
                onClick={() => {
                  setEditing(true);
                  onToolsOpen(false);
                }}
              >
                <Pencil />
                <span>
                  <strong>REDIGERA LISTA</strong>
                  <small>Ändra listans namn och inställningar</small>
                </span>
                <ChevronRight />
              </button>
              <button
                className="item-action-move"
                disabled={siblingLists.length === 0}
                onClick={() => {
                  setSelectMode("move");
                  setSelectedIds(new Set());
                  onToolsOpen(false);
                }}
              >
                <MoveRight />
                <span>
                  <strong>FLYTTA POSTER</strong>
                  <small>Markera flera och välj en annan lista</small>
                </span>
                <ChevronRight />
              </button>
              <button
                className="danger"
                onClick={() => {
                  setSelectMode("delete");
                  setSelectedIds(new Set());
                  onToolsOpen(false);
                }}
              >
                <Trash2 />
                <span>
                  <strong>TA BORT POSTER</strong>
                  <small>Markera flera poster samtidigt</small>
                </span>
                <ChevronRight />
              </button>
            </>
          )}
        </div>
      )}
      {shareOpen && (
        <div className="modal-backdrop">
          <div className="modal share-list-modal">
            <button className="modal-close" onClick={()=>setShareOpen(false)} aria-label="Stäng"><X /></button>
            <Share2 className="share-modal-icon" />
            <h2>{shareUrl?"LISTAN ÄR REDO ATT DELAS":"DELA LISTA"}</h2>
            <p>Alla med länken kan läsa listan, men ingen kan ändra den.</p>
            {!shareUrl&&<><label className="share-notes-choice"><input type="checkbox" checked={shareNotes} onChange={event=>setShareNotes(event.target.checked)} /><span><strong>Visa anteckningar</strong><small>Avstängt som standard</small></span></label><button disabled={sharing} onClick={async()=>{setSharing(true);try{const code=await createPublicListShare(list,uid,shareNotes);const slug=list.name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"lista";setShareUrl(`https://www.bubbsun.se/list/${slug}-${code}`);}finally{setSharing(false);}}}>{sharing?"SKAPAR…":"SKAPA DELNINGSLÄNK"}</button></>}
            {shareUrl&&<><input readOnly value={shareUrl} onFocus={event=>event.currentTarget.select()} />
            <div>
              <button onClick={async()=>{await navigator.clipboard.writeText(shareUrl);}}>KOPIERA LÄNK</button>
              {typeof navigator.share === "function" && <button onClick={()=>void navigator.share({title:list.name,url:shareUrl})}>DELA</button>}
            </div></>}
          </div>
        </div>
      )}
      {printOpen&&<div className="modal-backdrop"><div className="modal print-list-modal">
        <button className="modal-close" onClick={()=>setPrintOpen(false)} aria-label="Stäng"><X /></button>
        <Printer className="share-modal-icon"/><h2>SKRIV UT LISTA</h2>
        <div className="print-scope-options">
          <button className={printScope==="pending"?"selected":""} onClick={()=>setPrintScope("pending")}>BARA KVAR</button>
          <button className={printScope==="all"?"selected":""} onClick={()=>setPrintScope("all")}>ALLA</button>
          <button className={printScope==="done"?"selected":""} onClick={()=>setPrintScope("done")}>BARA KLARA</button>
        </div>
        <label className="share-notes-choice"><input type="checkbox" checked={printNotes} onChange={event=>setPrintNotes(event.target.checked)}/><span><strong>Ta med anteckningar</strong><small>Avstängt som standard</small></span></label>
        <button onClick={()=>{
          const chosen=list.items.filter(item=>printScope==="all"||(printScope==="pending"?!item.completed:item.completed));
          const escape=(value:string)=>value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]||char));
          const popup=window.open("","_blank","noopener,noreferrer");if(!popup)return;
          popup.document.write(`<!doctype html><html lang="sv"><head><title>${escape(list.name)}</title><style>body{max-width:760px;margin:35px auto;padding:0 24px;color:#24170f;font-family:Arial,sans-serif}h1{font:800 38px Georgia,serif;border-bottom:3px solid #587556;padding-bottom:12px}ul{list-style:none;padding:0;display:grid;gap:10px}li{display:grid;grid-template-columns:25px 1fr auto;gap:10px;align-items:start;padding:12px 4px;border-bottom:1px solid #cbb89f}.box{width:18px;height:18px;border:2px solid #587556;border-radius:4px}.done .box:after{content:'✓';display:block;text-align:center;line-height:16px}.done strong{text-decoration:line-through;color:#777}small{color:#69584d}.note{grid-column:2/-1;margin:5px 0 0;padding:8px;background:#f3eadc;border-radius:6px;white-space:pre-wrap}@media print{body{margin:0}}</style></head><body><h1>${escape(list.name)}</h1><ul>${chosen.map(item=>`<li class="${item.completed?"done":""}"><span class="box"></span><strong>${escape(item.name)}</strong><small>${escape(item.quantity)}</small>${printNotes&&item.note?`<p class="note">${escape(item.note)}</p>`:""}</li>`).join("")}</ul><script>window.onload=()=>window.print()<\/script></body></html>`);popup.document.close();setPrintOpen(false);
        }}>ÖPPNA UTSKRIFT</button>
      </div></div>}
      <div className={`add-panel ${["wishlist","packing","orders"].includes(list.listType||"") ? "add-panel-stacked-select" : ""} ${list.listType==="cleaning" ? "add-panel-cleaning" : ""} ${list.listType==="home" ? "add-panel-homefix" : ""}`}>
        <h2>LÄGG TILL</h2>
        <div className={showNewItemNote?"has-add-note":""}>
          <span className="autocomplete-wrap">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Namn"
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                add();
              }}
            />
            {itemSuggestions.length > 0 && (
              <span className="suggestions">
                {itemSuggestions.map((value) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => add(value)}
                    >
                      {value}
                    </button>
                  ))}
              </span>
            )}
          </span>
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              add();
            }}
            placeholder="Mängd (valfritt)"
          />
          {list.listType==="packing"&&<select value={assignedTo} onChange={event=>setAssignedTo(event.target.value)}><option value="">För alla</option>{(list.packPeople||[]).map(person=><option key={person}>{person}</option>)}</select>}
          {list.listType==="home"&&<div className="homefix-quick-fields"><select aria-label="Plats" value={homeFixPlace} onChange={event=>setHomeFixPlace(event.target.value)}><option value="">Välj plats</option>{homeFixPlaces.map(place=><option key={place}>{place}</option>)}</select><select aria-label="Prioritet" value={homeFixPriority} onChange={event=>setHomeFixPriority(event.target.value)}>{homeFixPriorities.map(value=><option key={value}>{value}</option>)}</select></div>}
          {list.listType==="orders"&&<select value={itemStatus} onChange={event=>setItemStatus(event.target.value)}><option value="">Status</option><option>Beställt</option><option>På gång</option><option>Skickat</option><option>Levererat</option><option>Klart</option></select>}
          {list.listType==="wishlist"&&<select value={priority} onChange={event=>setPriority(event.target.value)}><option>Låg</option><option>Normal</option><option>Hög</option><option>Dröm</option></select>}
          {list.listType==="cleaning"&&<div className="cleaning-quick-fields"><select aria-label="Rum" value={cleaningRoom} onChange={event=>setCleaningRoom(event.target.value)}><option value="">Välj rum</option>{cleaningRooms.map(room=><option key={room}>{room}</option>)}</select><select aria-label="Ansvarig" value={cleaningAssignee} onChange={event=>setCleaningAssignee(event.target.value)}><option value="">Ingen särskild</option>{members.map(member=><option key={member.uid} value={member.uid}>{member.displayName}</option>)}</select><select aria-label="Upprepas" value={cleaningRecurrence} onChange={event=>setCleaningRecurrence(event.target.value)}><option value="">Ingen upprepning</option>{cleaningRecurrences.map(value=><option key={value}>{value}</option>)}</select></div>}
          {showNewItemNote&&<textarea className="new-item-note" value={newItemNote} onChange={event=>setNewItemNote(event.target.value)} placeholder="Skriv en anteckning (valfritt)…" autoFocus/>}
          <span className="add-panel-actions">
            <button type="button" className={showNewItemNote?"active":""} aria-label={showNewItemNote?"Dölj anteckning":"Lägg till anteckning"} aria-pressed={showNewItemNote} onClick={()=>setShowNewItemNote(value=>!value)}><NotebookPen/></button>
            <button type="button" aria-label="Lägg till" onClick={() => add()}><Check /></button>
          </span>
        </div>
      </div>
      {selecting && (
        <div
          className={`bulk-delete-bar ${selectMode === "move" ? "bulk-move-bar" : ""}`}
        >
          <button
            onClick={() => setSelectedIds(
              allItemsSelected
                ? new Set()
                : new Set(list.items.map((item) => item.id)),
            )}
          >
            {allItemsSelected ? "AVMARKERA ALLT" : "MARKERA ALLA"}
          </button>
          <strong>{selectedIds.size} VALDA</strong>
          {selectMode === "move" ? (
            <button
              disabled={selectedIds.size === 0}
              onClick={() => setMoveMany(true)}
            >
              <MoveRight /> FLYTTA VALDA
            </button>
          ) : (
            <button
              className="danger"
              disabled={selectedIds.size === 0}
              onClick={() => {
                setConfirmDeleteItems(list.items.filter(item=>selectedIds.has(item.id)));
              }}
            >
              TA BORT VALDA
            </button>
          )}
          <button
            className="cancel"
            onClick={() => {
              setSelectMode("");
              setSelectedIds(new Set());
            }}
          >
            AVBRYT
          </button>
        </div>
      )}
      <label className="search-box">
        <Search />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök i listan"
        />
      </label>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={dragEnd}
      >
        <SortableContext
          items={pending.map((x) => x.id)}
          strategy={rectSortingStrategy}
        >
          <div className="items-list">{pending.map(itemRow)}</div>
        </SortableContext>
      </DndContext>
      <button className="done-toggle" onClick={() => setShowDone(!showDone)}>
        KLART ({done.length}) <ChevronDown className={showDone ? "turn" : ""} />
      </button>
      {showDone && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={dragEnd}
        >
          <SortableContext
            items={done.map((x) => x.id)}
            strategy={rectSortingStrategy}
          >
            <div className="items-list done-list">{done.map(itemRow)}</div>
          </SortableContext>
        </DndContext>
      )}
      {confirmDelete && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>TA BORT LISTAN?</h2>
            <p>Alla poster i “{list.name}” försvinner.</p>
            <div>
              <button className="cancel" onClick={() => setConfirmDelete(false)}>AVBRYT</button>
              <button className="danger" onClick={onDelete}>
                TA BORT
              </button>
            </div>
          </div>
        </div>
      )}
      {itemMenu && (
        <div className="modal-backdrop">
          <div className="modal item-actions-modal">
            <h2>{itemMenu.name}</h2>
            <div className="item-action-buttons">
              <button
                className="item-action-move"
                disabled={siblingLists.length === 0}
                onClick={() => {
                  setMoveItem(itemMenu);
                  setItemMenu(null);
                }}
              >
                <MoveRight /> FLYTTA
              </button>
              <button
                className="danger"
                onClick={() => {
                  setConfirmDeleteItems([itemMenu]);
                  setItemMenu(null);
                }}
              >
                <Trash2 /> TA BORT
              </button>
            </div>
            <button
              className="item-action-cancel item-action-cancel-neutral cancel"
              onClick={() => setItemMenu(null)}
            >
              AVBRYT
            </button>
          </div>
        </div>
      )}
      {confirmDeleteItems&&(
        <div className="modal-backdrop">
          <div className="modal confirm-delete-modal">
            <h2>{confirmDeleteItems.length===1?"TA BORT POSTEN?":`TA BORT ${confirmDeleteItems.length} POSTER?`}</h2>
            <p>{confirmDeleteItems.length===1?`“${confirmDeleteItems[0].name}” försvinner från listan.`:"De markerade posterna försvinner från listan."}</p>
            <div className="modal-actions">
              <button className="cancel" onClick={()=>setConfirmDeleteItems(null)}>AVBRYT</button>
              <button className="danger" onClick={()=>{const ids=new Set(confirmDeleteItems.map(item=>item.id));onChange({...list,items:list.items.filter(item=>!ids.has(item.id))});setConfirmDeleteItems(null);setSelectMode("");setSelectedIds(new Set())}}>TA BORT</button>
            </div>
          </div>
        </div>
      )}
      {moveItem && (
        <div className="modal-backdrop">
          <div className="modal move-item-modal">
            <h2>FLYTTA POST</h2>
            <p>Välj vilken lista ”{moveItem.name}” ska flyttas till.</p>
            <div className="move-target-list">
              {siblingLists.map((target) => (
                <button
                  disabled={moving}
                  key={target.id}
                  onClick={async () => {
                    setMoving(true);
                    try {
                      await onMoveItem(moveItem, target.id);
                      setMoveItem(null);
                    } finally {
                      setMoving(false);
                    }
                  }}
                >
                  <span
                    className="move-target-icon"
                    style={{
                      background:
                        typeof target.iconColor === "number"
                          ? rgbaHex(target.iconColor)
                          : String(target.iconColor),
                    }}
                  >
                    <img
                      src={iconSources[target.icon] || fallbackIcon}
                      alt=""
                    />
                  </span>
                  <strong>{target.name}</strong>
                  <ChevronRight />
                </button>
              ))}
            </div>
            <button
              className="item-action-cancel cancel"
              disabled={moving}
              onClick={() => setMoveItem(null)}
            >
              AVBRYT
            </button>
          </div>
        </div>
      )}
      {moveMany && (
        <div className="modal-backdrop">
          <div className="modal move-item-modal">
            <h2>FLYTTA {selectedIds.size} POSTER</h2>
            <p>Välj vilken lista de markerade posterna ska flyttas till.</p>
            <div className="move-target-list">
              {siblingLists.map((target) => (
                <button
                  disabled={moving}
                  key={target.id}
                  onClick={async () => {
                    setMoving(true);
                    try {
                      await onMoveItems(
                        list.items.filter((item) => selectedIds.has(item.id)),
                        target.id,
                      );
                      setMoveMany(false);
                      setSelectMode("");
                      setSelectedIds(new Set());
                    } finally {
                      setMoving(false);
                    }
                  }}
                >
                  <span
                    className="move-target-icon"
                    style={{
                      background:
                        typeof target.iconColor === "number"
                          ? rgbaHex(target.iconColor)
                          : String(target.iconColor),
                    }}
                  >
                    <img
                      src={iconSources[target.icon] || fallbackIcon}
                      alt=""
                    />
                  </span>
                  <strong>{target.name}</strong>
                  <ChevronRight />
                </button>
              ))}
            </div>
            <button
              className="item-action-cancel cancel"
              disabled={moving}
              onClick={() => setMoveMany(false)}
            >
              AVBRYT
            </button>
          </div>
        </div>
      )}
      {editing && (
        <ListEditor
          title="REDIGERA LISTA"
          initial={list}
          supporter={supporter}
          allowDelete
          onSupport={() => {
            setEditing(false);
            onSupport();
          }}
          onCancel={() => setEditing(false)}
          onDelete={() => {
            setEditing(false);
            setConfirmDelete(true);
          }}
          onSave={(values) => {
            onChange({ ...list, ...values });
            setEditing(false);
          }}
        />
      )}
      {isPrivate && (
        <p className="local-note">
          🔒 Privat lista · synkas mellan dina enheter.
        </p>
      )}
    </section>
  );
}

function ProfileEditor({
  account,
  membership,
  members,
  group,
  onClose,
}: {
  account: Account;
  membership?: Membership;
  members: Membership[];
  group?: Group;
  onClose: () => void;
}) {
  const [name, setName] = useState(account.displayName),
    [color, setColor] = useState(
      membership?.color || account.personalColor || colorOptions[0],
    );
  const used = new Set(
    members
      .filter((item) => item.uid !== account.uid)
      .map((item) => item.color),
  );
  return (
    <div className="modal-backdrop">
      <form
        className="modal profile-editor"
        onSubmit={async (event) => {
          event.preventDefault();
          await updateProfile(account.uid, name);
          if (group && membership)
            await updateMembership(group.id, account.uid, {
              displayName: name,
              color,
            });
          else await savePreferences(account.uid, { personalColor: color });
          onClose();
        }}
      >
        <h2>MIN PROFIL</h2>
        <label>
          <span>Visningsnamn</span>
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={35}
          />
        </label>
        <h3>MIN FÄRG</h3>
        <div className="color-picker">
          {colorOptions.map((value) => (
            <button
              type="button"
              key={value}
              disabled={used.has(value)}
              className={`${color === value ? "selected" : ""} ${used.has(value) ? "unavailable" : ""}`}
              style={{ "--choice-color": rgbaHex(value) } as CSSProperties}
              onClick={() => setColor(value)}
            >
              {used.has(value) && <X />}
            </button>
          ))}
        </div>
        <div className="modal-actions">
          <button type="button" className="cancel" onClick={onClose}>
            AVBRYT
          </button>
          <button>SPARA</button>
        </div>
      </form>
    </div>
  );
}
function GroupEditor({
  group,
  onClose,
}: {
  group: Group;
  onClose: () => void;
}) {
  const [name, setName] = useState(group.name),
    [iconId, setIcon] = useState(normalizedGroupIcon(group.iconId)),
    [color, setColor] = useState(group.color);
  return (
    <div className="modal-backdrop">
      <form
        className="modal group-editor"
        onSubmit={async (event) => {
          event.preventDefault();
          await updateGroup(group.id, { name: name.trim(), iconId, color });
          onClose();
        }}
      >
        <h2>REDIGERA GRUPP</h2>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={40}
        />
        <h3>GRUPPFÄRG</h3>
        <div className="color-picker">
          {colorOptions.map((value) => (
            <button
              type="button"
              key={value}
              className={color === value ? "selected" : ""}
              style={{ "--choice-color": rgbaHex(value) } as CSSProperties}
              onClick={() => setColor(value)}
            />
          ))}
        </div>
        <h3>GRUPPIKON</h3>
        <div className="group-icon-picker">
          {groupIconOptions.map((value) => (
            <button
              type="button"
              key={value}
              className={iconId === value ? "selected" : ""}
              onClick={() => setIcon(value)}
            >
              <GroupIcon id={value} />
            </button>
          ))}
        </div>
        <div className="modal-actions">
          <button type="button" className="cancel" onClick={onClose}>
            AVBRYT
          </button>
          <button>SPARA</button>
        </div>
      </form>
    </div>
  );
}

type CalendarRange="today"|"7"|"30"|"agenda";
const calendarDateKey=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
const calendarDayLabel=(value:string)=>{const date=new Date(`${value}T12:00:00`),now=new Date(),today=calendarDateKey(now),tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);if(value===today)return"IDAG";if(value===calendarDateKey(tomorrow))return"IMORGON";return new Intl.DateTimeFormat("sv-SE",{weekday:"long",day:"numeric",month:"long",...(date.getFullYear()!==now.getFullYear()?{year:"numeric" as const}:{})}).format(date).toLocaleUpperCase("sv-SE")};

const calendarCategories=[{id:"",label:"Ingen kategori",icon:""},{id:"birthday",label:"Födelsedag",icon:"🎂"},{id:"meeting",label:"Möte",icon:"👥"},{id:"appointment",label:"Tid / besök",icon:"📍"},{id:"activity",label:"Aktivitet",icon:"⚽"},{id:"reminder",label:"Påminnelse",icon:"🔔"},{id:"work",label:"Jobb",icon:"💼"},{id:"school",label:"Skola",icon:"🎓"},{id:"travel",label:"Resa",icon:"🚗"},{id:"family",label:"Familj",icon:"🏠"},{id:"celebration",label:"Högtid / Fest",icon:"🎉"},{id:"healthcare",label:"Vård",icon:"🩺"},{id:"other",label:"Annat",icon:"✨"}];
const calendarCategory=(id?:string)=>calendarCategories.find(value=>value.id===id)||calendarCategories[0];
type CalendarOccurrence=CalendarEvent&{occurrenceDate:string};
const calendarBirthdayAge=(event:CalendarEvent,date:string)=>event.category==="birthday"&&event.birthYear&&Number(date.slice(0,4))>=event.birthYear?Number(date.slice(0,4))-event.birthYear:null;
const calendarDisplayTitle=(event:CalendarEvent,date:string)=>{const age=calendarBirthdayAge(event,date);return age===null?event.title:`${event.title} · ${age} år`};
const expandCalendarEvents=(events:CalendarEvent[],from:string,to:string):CalendarOccurrence[]=>events.flatMap(event=>{const days=event.recurrenceDays||[],excluded=new Set(event.excludedDates||[]);if(event.recurrenceType==="yearly"){const source=new Date(`${event.date}T12:00:00`),values:CalendarOccurrence[]=[];for(let year=Number(from.slice(0,4));year<=Number(to.slice(0,4));year++){const cursor=new Date(year,source.getMonth(),source.getDate(),12);if(cursor.getMonth()!==source.getMonth()||cursor.getDate()!==source.getDate())continue;const key=calendarDateKey(cursor);if(key>=event.date&&key>=from&&key<=to&&!excluded.has(key))values.push({...event,occurrenceDate:key})}return values}if(!days.length)return event.date>=from&&event.date<=to&&!excluded.has(event.date)?[{...event,occurrenceDate:event.date}]:[];const start=new Date(`${event.date}T12:00:00`),fromDate=new Date(`${from}T12:00:00`);if(start<fromDate)start.setTime(fromDate.getTime());const until=event.recurrenceForever||!event.recurrenceUntil?to:event.recurrenceUntil<to?event.recurrenceUntil:to,values:CalendarOccurrence[]=[];for(const cursor=new Date(start);calendarDateKey(cursor)<=until;cursor.setDate(cursor.getDate()+1)){const key=calendarDateKey(cursor);if(days.includes(cursor.getDay())&&!excluded.has(key))values.push({...event,occurrenceDate:key})}return values});

function CalendarPage({events,lists,privateMode,account,memberships,groups,members,creating,onCreating,onMode,onSwitchGroup,onSave,onDelete,onOpenList,openEventId,onEventOpened}:{events:CalendarEvent[];lists:BubbsunList[];privateMode:boolean;account:Account;memberships:Membership[];groups:Record<string,Group>;members:Membership[];creating:boolean;onCreating:(value:boolean)=>void;onMode:(value:boolean)=>void;onSwitchGroup:(id:string)=>void;onSave:(event:CalendarEvent,targetLocations?:string[],previousLocations?:string[])=>Promise<void>;onDelete:(event:CalendarEvent)=>Promise<void>;onOpenList:(list:BubbsunList)=>void;openEventId?:string;onEventOpened?:()=>void}){
  const [range,setRange]=useState<CalendarRange>(()=>(localStorage.getItem("bubbsun-calendar-range") as CalendarRange)||"7"),[spaceOpen,setSpaceOpen]=useState(false),[viewing,setViewing]=useState<CalendarOccurrence|null>(null),[editing,setEditing]=useState<CalendarEvent|null>(null),[createDate,setCreateDate]=useState(calendarDateKey(new Date())),[weekOffset,setWeekOffset]=useState(0),[monthOffset,setMonthOffset]=useState(0),[selectedMonthDate,setSelectedMonthDate]=useState(calendarDateKey(new Date())),[agendaLimit,setAgendaLimit]=useState(20);const agendaLoader=useRef<HTMLDivElement>(null),calendarWeekRef=useRef<HTMLDivElement>(null),calendarMonthRef=useRef<HTMLDivElement>(null),weekSwipeStart=useRef<{x:number;y:number;dragging:boolean}|null>(null),swipeSuppressUntil=useRef(0),weekAnimating=useRef(false),monthSwipeStart=useRef<{x:number;y:number;dragging:boolean}|null>(null),monthAnimating=useRef(false);
  const weekSwipeHandled={get current(){return Date.now()<swipeSuppressUntil.current}};
  useEffect(()=>localStorage.setItem("bubbsun-calendar-range",range),[range]);
  useEffect(()=>{if(!openEventId)return;const event=events.find(value=>value.id===openEventId);if(!event)return;setViewing({...event,occurrenceDate:event.date});onEventOpened?.()},[openEventId,events,onEventOpened]);
  useEffect(()=>{setAgendaLimit(20)},[range,privateMode,account.activeGroupId]);
  useEffect(()=>{const loader=agendaLoader.current;if(range!=="agenda"||!loader)return;const observer=new IntersectionObserver(entries=>{if(entries[0]?.isIntersecting)setAgendaLimit(value=>value+20)},{rootMargin:"220px"});observer.observe(loader);return()=>observer.disconnect()},[range,agendaLimit]);
  const today=calendarDateKey(new Date()),weekStart=new Date(`${today}T12:00:00`);weekStart.setDate(weekStart.getDate()-((weekStart.getDay()+6)%7)+(weekOffset*7));const weekDates=Array.from({length:7},(_,index)=>{const date=new Date(weekStart);date.setDate(date.getDate()+index);return calendarDateKey(date)}),monthAnchor=new Date(`${today}T12:00:00`);monthAnchor.setDate(1);monthAnchor.setMonth(monthAnchor.getMonth()+monthOffset);const monthGridStart=new Date(monthAnchor);monthGridStart.setDate(monthGridStart.getDate()-((monthGridStart.getDay()+6)%7));const monthDates=Array.from({length:42},(_,index)=>{const date=new Date(monthGridStart);date.setDate(date.getDate()+index);return calendarDateKey(date)}),monthKey=`${monthAnchor.getFullYear()}-${String(monthAnchor.getMonth()+1).padStart(2,"0")}`,rangeStart=range==="7"?weekDates[0]:range==="30"?monthDates[0]:today,end=new Date(`${rangeStart}T12:00:00`);end.setDate(end.getDate()+(range==="today"?0:range==="7"?6:range==="30"?41:3650));const endKey=calendarDateKey(end);
  const visible=expandCalendarEvents(events,rangeStart,endKey).sort((a,b)=>`${a.occurrenceDate} ${a.time||"00:00"}`.localeCompare(`${b.occurrenceDate} ${b.time||"00:00"}`));
  const shown=range==="agenda"?visible.slice(0,agendaLimit):visible;
  const grouped=shown.reduce<Record<string,CalendarOccurrence[]>>((all,event)=>{(all[event.occurrenceDate]??=[]).push(event);return all},{});
  const activeGroup=groups[account.activeGroupId];
  const settleCarousel=async(element:HTMLDivElement|null,direction:-1|1,update:()=>void,lock:{current:boolean})=>{if(lock.current)return;if(!element){update();return}lock.current=true;element.style.transition="transform 220ms cubic-bezier(.2,.72,.2,1)";element.style.transform=direction>0?"translate3d(-66.666667%,0,0)":"translate3d(0,0,0)";await new Promise(resolve=>window.setTimeout(resolve,225));update();await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));element.style.transition="none";element.style.transform="translate3d(-33.333333%,0,0)";lock.current=false};
  const changeWeek=(direction:-1|1)=>settleCarousel(calendarWeekRef.current,direction,()=>setWeekOffset(value=>value+direction),weekAnimating);
  const changeMonth=(direction:-1|1)=>settleCarousel(calendarMonthRef.current,direction,()=>{const next=new Date(monthAnchor);next.setMonth(next.getMonth()+direction);setSelectedMonthDate(calendarDateKey(next));setMonthOffset(value=>value+direction)},monthAnimating);
  const moveCarousel=(start:{x:number;y:number;dragging:boolean}|null,element:HTMLDivElement|null,x:number,y:number)=>{if(!start||!element)return;const dx=x-start.x,dy=y-start.y;if(!start.dragging){if(Math.hypot(dx,dy)<14)return;if(Math.abs(dy)>=Math.abs(dx)*.85){start.x=Number.NaN;return}start.dragging=true;swipeSuppressUntil.current=Number.POSITIVE_INFINITY}if(Number.isNaN(start.x)||!start.dragging)return;element.style.transition="none";element.style.transform=`translate3d(calc(-33.333333% + ${dx}px),0,0)`};
  const finishCarousel=(start:{x:number;y:number;dragging:boolean}|null,element:HTMLDivElement|null,x:number,y:number,change:(direction:-1|1)=>Promise<void>)=>{if(!start||!element||Number.isNaN(start.x)||!start.dragging)return;const dx=x-start.x,dy=y-start.y,changesPeriod=Math.abs(dx)>=55&&Math.abs(dx)>=Math.abs(dy)*1.15;swipeSuppressUntil.current=Date.now()+(changesPeriod?245:100);if(changesPeriod)void change(dx<0?1:-1);else{element.style.transition="transform 180ms ease-out";element.style.transform="translate3d(-33.333333%,0,0)"}};
  const editor=editing||creating?editing||{id:crypto.randomUUID(),title:"",date:createDate,time:"",endTime:"",allDay:false,category:"",color:account.personalColor??colorOptions[0],note:"",creatorId:account.uid,creatorName:account.displayName,createdAt:Date.now(),updatedAt:Date.now()}:null;
  const eventCard=(event:CalendarOccurrence,compact=false)=>{const creator=privateMode?null:members.find(member=>member.uid===event.creatorId),color=rgbaHex(event.color||creator?.color||account.personalColor||colorOptions[0]),creatorColor=rgbaHex(privateMode?(account.personalColor||colorOptions[0]):(creator?.color||account.personalColor||colorOptions[0])),category=calendarCategory(event.category),birthday=event.category==="birthday",displayTitle=calendarDisplayTitle(event,event.occurrenceDate),recurring=event.recurrenceType==="yearly"||Boolean(event.recurrenceDays?.length),timeLabel=event.allDay||!event.time?"HELA DAGEN":event.endTime?`${event.time}–${event.endTime}`:event.time,style={"--event-color":color,"--creator-color":creatorColor} as CSSProperties,key=`${event.id}-${event.occurrenceDate}`,linked=(event.linkedListIds||[]).map(id=>lists.find(list=>list.id===id)).filter((list):list is BubbsunList=>Boolean(list)),open=(click:{stopPropagation:()=>void})=>{click.stopPropagation();if(compact&&weekSwipeHandled.current)return;setViewing(event)};if(compact)return <button className={`calendar-event compact${birthday?" birthday":""}`} key={key} style={style} onClick={open}><span className="calendar-compact-meta">{category.icon&&<b>{category.icon}</b>}<time>{timeLabel}</time>{linked.length>0&&<small>🔗{linked.length}</small>}{recurring&&<small className="calendar-repeat">↻</small>}</span><strong className="calendar-compact-title">{displayTitle}</strong></button>;return <div role="button" tabIndex={0} className={`calendar-event agenda-card${birthday?" birthday":""}`} key={key} style={style} onClick={open} onKeyDown={e=>{if(e.key==="Enter")open(e)}}><i/><span className="calendar-agenda-content"><span className="calendar-agenda-meta">{category.icon&&<b>{category.icon}</b>}<time>{timeLabel}</time></span><strong className="calendar-agenda-title">{displayTitle}</strong>{event.note&&<small>{event.note}</small>}{linked.length>0&&<span className="calendar-linked-lists">{linked.map(list=><button key={list.id} onClick={click=>{click.stopPropagation();onOpenList(list)}}>🔗 {list.name}</button>)}</span>}</span>{recurring&&<small className="calendar-agenda-repeat" aria-label="Återkommande">↻</small>}</div>};
  const eventsOn=(date:string)=>expandCalendarEvents(events,date,date).sort((a,b)=>(a.time||"00:00").localeCompare(b.time||"00:00"));
  const weekDatesAt=(delta:number)=>{const start=new Date(weekStart);start.setDate(start.getDate()+delta*7);return Array.from({length:7},(_,index)=>{const date=new Date(start);date.setDate(date.getDate()+index);return calendarDateKey(date)})};
  const renderWeekPane=(delta:number)=>{const dates=weekDatesAt(delta);return <div className="calendar-week">{dates.map(date=>{const day=new Date(`${date}T12:00:00`).getDay();return <section key={date} className={`${date===today?"today ":""}${day===0||day===6?"weekend":""}`.trim()}><h2><button className="calendar-week-mobile-add" aria-label={`Lägg till post ${date}`} onClick={click=>{click.stopPropagation();if(delta)return;setCreateDate(date);onCreating(true)}}><Plus/></button><strong>{new Intl.DateTimeFormat("sv-SE",{weekday:"short"}).format(new Date(`${date}T12:00:00`))}</strong><b>{Number(date.slice(-2))}</b></h2><div onClick={()=>{if(delta||weekSwipeHandled.current)return;setCreateDate(date);onCreating(true)}}>{eventsOn(date).map(event=>eventCard(event,true))}</div></section>})}</div>};
  const monthDataAt=(delta:number)=>{const anchor=new Date(monthAnchor);anchor.setMonth(anchor.getMonth()+delta);anchor.setDate(1);const start=new Date(anchor);start.setDate(start.getDate()-((start.getDay()+6)%7));return{anchor,key:`${anchor.getFullYear()}-${String(anchor.getMonth()+1).padStart(2,"0")}`,dates:Array.from({length:42},(_,index)=>{const date=new Date(start);date.setDate(date.getDate()+index);return calendarDateKey(date)})}};
  const renderMonthPane=(delta:number)=>{const data=monthDataAt(delta);return <div className="calendar-month"><div className="calendar-month-weekdays">{["MÅN","TIS","ONS","TORS","FRE","LÖR","SÖN"].map(day=><b key={day}>{day}</b>)}</div><div className="calendar-month-grid">{data.dates.map(date=>{const dateValue=new Date(`${date}T12:00:00`),day=dateValue.getDay(),items=eventsOn(date),outside=!date.startsWith(data.key);return <section key={date} className={`${outside?"outside ":""}${date===today?"today ":""}${day===0||day===6?"weekend ":""}${delta===0&&date===selectedMonthDate?"selected":""}`.trim()} onClick={()=>{if(delta)return;if(window.innerWidth<=700)setSelectedMonthDate(date);else{setCreateDate(date);onCreating(true)}}}><time>{dateValue.getDate()}</time><div>{items.slice(0,3).map(event=>{const creator=privateMode?null:members.find(member=>member.uid===event.creatorId),style={"--event-color":rgbaHex(event.color||account.personalColor||colorOptions[0]),"--creator-color":rgbaHex(privateMode?(account.personalColor||colorOptions[0]):(creator?.color||account.personalColor||colorOptions[0]))} as CSSProperties;return <button key={`${event.id}-${date}`} className={event.category==="birthday"?"birthday":""} style={style} onClick={click=>{click.stopPropagation();if(!delta&&!weekSwipeHandled.current)setViewing(event)}}><i/>{calendarCategory(event.category).icon&&<span>{calendarCategory(event.category).icon}</span>}<strong>{event.title}</strong></button>})}{items.length>3&&<button className="calendar-month-more" onClick={click=>{click.stopPropagation();if(!delta)setSelectedMonthDate(date)}}>+{items.length-3} till</button>}</div></section>})}</div></div>};
  const weekThursday=new Date(weekStart);weekThursday.setDate(weekThursday.getDate()+3);const yearStart=new Date(weekThursday.getFullYear(),0,1),weekNumber=Math.ceil((((weekThursday.getTime()-yearStart.getTime())/86400000)+yearStart.getDay()+1)/7),weekMonths=Array.from(new Set([weekDates[0],weekDates[6]].map(value=>new Intl.DateTimeFormat("sv-SE",{month:"long"}).format(new Date(`${value}T12:00:00`))))).map(value=>value.charAt(0).toUpperCase()+value.slice(1)).join(" / "),monthLabel=new Intl.DateTimeFormat("sv-SE",{month:"long",year:"numeric"}).format(monthAnchor).replace(/^./,value=>value.toLocaleUpperCase("sv-SE"));
  return <section className="content calendar-page">
    <div className="calendar-controls"><div className="calendar-ranges">{([["today","IDAG"],["7","7 DAGAR"],["30","30 DAGAR"],["agenda","AGENDA"]] as const).map(([value,label])=><button key={value} className={range===value?"selected":""} onClick={()=>{setRange(value);if(value==="7")setWeekOffset(0);if(value==="30"){setMonthOffset(0);setSelectedMonthDate(today)}}}>{label}</button>)}</div><div className="calendar-space-wrap"><button className="calendar-space-button" onClick={()=>setSpaceOpen(value=>!value)}>{privateMode?<LockKeyhole/>:<GroupIcon id={activeGroup?.iconId}/>}<span><small>{privateMode?"PRIVAT":"GRUPP"}</small><strong>{privateMode?"Bara jag":activeGroup?.name||"Välj grupp"}</strong></span><ChevronDown/></button>{spaceOpen&&<div className="calendar-space-menu"><button className={privateMode?"selected":""} onClick={()=>{onMode(true);setSpaceOpen(false)}}><LockKeyhole/><strong>Privat</strong>{privateMode&&<Check/>}</button>{memberships.map(item=><button key={item.groupId} className={!privateMode&&item.groupId===account.activeGroupId?"selected":""} onClick={()=>{onSwitchGroup(item.groupId);setSpaceOpen(false)}}><GroupIcon id={groups[item.groupId]?.iconId}/><strong>{groups[item.groupId]?.name||"Grupp"}</strong>{!privateMode&&item.groupId===account.activeGroupId&&<Check/>}</button>)}{!memberships.length&&<button type="button" className="group-empty-state" onClick={()=>{setSpaceOpen(false);window.dispatchEvent(new CustomEvent("bubbsun:navigate",{detail:"people"}))}}><Users/><span><strong>Ingen grupp ännu</strong><small>Skapa en grupp eller gå med i en på sidan Användare &amp; grupper.</small><b>TILL ANVÄNDARE &amp; GRUPPER</b></span><ChevronRight/></button>}</div>}</div></div>
    {range==="7"&&<div className="calendar-week-nav"><button aria-label="Föregående vecka" onClick={()=>void changeWeek(-1)}><ChevronLeft/></button><strong>Vecka {weekNumber} – {weekMonths}</strong><button aria-label="Nästa vecka" onClick={()=>void changeWeek(1)}><ChevronRight/></button></div>}
    {range==="30"&&<div className="calendar-week-nav calendar-month-nav"><button aria-label="Föregående månad" onClick={()=>void changeMonth(-1)}><ChevronLeft/></button><strong>{monthLabel}</strong><button aria-label="Nästa månad" onClick={()=>void changeMonth(1)}><ChevronRight/></button></div>}
    {range==="7"?<div className="calendar-swipe-viewport" onTouchStart={touch=>{if(window.innerWidth<=700){const point=touch.touches[0];weekSwipeStart.current=point?{x:point.clientX,y:point.clientY,dragging:false}:null}}} onTouchMove={touch=>{const point=touch.touches[0];if(point)moveCarousel(weekSwipeStart.current,calendarWeekRef.current,point.clientX,point.clientY)}} onTouchEnd={touch=>{const start=weekSwipeStart.current,point=touch.changedTouches[0];weekSwipeStart.current=null;if(point)finishCarousel(start,calendarWeekRef.current,point.clientX,point.clientY,changeWeek)}}><div ref={calendarWeekRef} className="calendar-swipe-track">{[-1,0,1].map(delta=><div className="calendar-swipe-pane" key={delta}>{renderWeekPane(delta)}</div>)}</div></div>:range==="30"?<><div className="calendar-swipe-viewport" onTouchStart={touch=>{if(window.innerWidth<=700){const point=touch.touches[0];monthSwipeStart.current=point?{x:point.clientX,y:point.clientY,dragging:false}:null}}} onTouchMove={touch=>{const point=touch.touches[0];if(point)moveCarousel(monthSwipeStart.current,calendarMonthRef.current,point.clientX,point.clientY)}} onTouchEnd={touch=>{const start=monthSwipeStart.current,point=touch.changedTouches[0];monthSwipeStart.current=null;if(point)finishCarousel(start,calendarMonthRef.current,point.clientX,point.clientY,changeMonth)}}><div ref={calendarMonthRef} className="calendar-swipe-track">{[-1,0,1].map(delta=><div className="calendar-swipe-pane" key={delta}>{renderMonthPane(delta)}</div>)}</div></div><div className="calendar-month-mobile-day"><h2>{calendarDayLabel(selectedMonthDate)}</h2>{eventsOn(selectedMonthDate).map(event=>eventCard(event))}{!eventsOn(selectedMonthDate).length&&<span className="calendar-month-empty-label">Inget planerat</span>}<button className="calendar-month-add" onClick={()=>{setCreateDate(selectedMonthDate);onCreating(true)}}><Plus/> LÄGG TILL</button></div></>:!visible.length?<div className="calendar-empty"><CalendarDays/><strong>Inget planerat här</strong><span>Skönt — eller dags att lägga till något?</span><button onClick={()=>{setCreateDate(today);onCreating(true)}}><Plus/> LÄGG TILL</button></div>:<div className="calendar-agenda">{Object.entries(grouped).map(([date,items])=><section key={date}><h2>{calendarDayLabel(date)}</h2>{items.map(event=>eventCard(event))}</section>)}{range==="agenda"&&agendaLimit<visible.length&&<div ref={agendaLoader} className="calendar-loader">LADDAR FLER…</div>}</div>}
    {viewing&&<CalendarEventCard event={viewing} lists={lists} members={members} privateMode={privateMode} account={account} onClose={()=>setViewing(null)} onOpenList={onOpenList} onEdit={()=>{setEditing(viewing);setViewing(null)}}/>}
    {editor&&<CalendarEditor
      event={editor}
      lists={lists}
      account={account}
      memberships={memberships}
      groups={groups}
      currentLocation={privateMode?"private":account.activeGroupId}
      existing={Boolean(editing)}
      onClose={()=>{setEditing(null);setCreateDate(today);onCreating(false)}}
      onSave={async(next,targetLocations,previousLocations)=>{await onSave(next,targetLocations,previousLocations);setEditing(null);setCreateDate(today);onCreating(false)}}
      onDelete={editing?async mode=>{const occurrence=editing as CalendarOccurrence;if(mode==="single"&&occurrence.occurrenceDate&&(editing.recurrenceType==="yearly"||Boolean(editing.recurrenceDays?.length))){await onSave({...editing,excludedDates:Array.from(new Set([...(editing.excludedDates||[]),occurrence.occurrenceDate])),updatedAt:Date.now()});}else await onDelete(editing);setEditing(null)}:undefined}
    />}
  </section>;
}

const mealTypes=["Frukost","Mellanmål","Lunch","Fika","Middag","Kvällsmål","Annat"];
const budgetCategories={expense:["Mat","Boende","Räkningar","Försäkring","Transport","Shopping","Nöje","Barn","Husdjur","Hälsa","Resor","Presenter","Studier","Övrigt"],income:["Lön","Bidrag","Försäljning","Återbetalning","Bonus","Pension","Gåva","Övrigt"]} as const;
const budgetCategoryIcons:Record<string,string>={Mat:"🛒",Boende:"🏠",Räkningar:"🧾",Försäkring:"🛡️",Transport:"🚗",Shopping:"🛍️",Nöje:"🎉",Barn:"🧸",Husdjur:"🐾",Hälsa:"❤️",Resor:"✈️",Presenter:"🎁",Studier:"🎓",Lön:"💰",Bidrag:"🤝",Försäljning:"🏷️",Återbetalning:"↩️",Bonus:"✨",Pension:"🌿",Gåva:"🎁",Övrigt:"•••"};
const budgetBillTypes=["Hyra/avgift","El","Mobil","Internet","Försäkring","Lån","Prenumeration","Annat"];
const budgetMoney=(value:number)=>new Intl.NumberFormat("sv-SE",{style:"currency",currency:"SEK",minimumFractionDigits:0,maximumFractionDigits:2}).format(value);
const budgetDecimalText=(value:string)=>/^-?\d*(?:[,.]\d{0,2})?$/.test(value)?value:null;
const budgetDecimalNumber=(value:string)=>Number(value.replace(",","."));
const budgetDecimalComplete=(value:string)=>value!==""&&value!=="-"&&!value.endsWith(",")&&!value.endsWith(".");
const budgetOccurrencePaid=(entry:BudgetEntry,occurrenceDate:string,today=calendarDateKey(new Date()))=>entry.type==="transfer"?occurrenceDate<=today:entry.status!=="planned"||(entry.autoPay===true&&occurrenceDate<=today);
const budgetStatusLabel=(entry:BudgetEntry,paid:boolean,overdue:boolean)=>overdue?"⚠ Försenad · ":!paid?entry.autoPay?(entry.type==="income"?"◷ Registreras automatiskt · ":"◷ Betalas automatiskt · "):(entry.type==="income"?"◷ Väntas · ":"◷ Planerad · "):entry.autoPay?(entry.type==="income"?"✓ Automatiskt mottagen · ":"✓ Automatiskt betald · "):(entry.type==="income"?"✓ Mottagen · ":"✓ Betald · ");
const budgetEasterSunday=(year:number)=>{const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;return new Date(year,month-1,day,12)};
const budgetDateOffset=(date:Date,days:number)=>{const value=new Date(date);value.setDate(value.getDate()+days);return value};
const budgetIsSwedishWorkday=(date:Date)=>{if(date.getDay()===0||date.getDay()===6)return false;const key=calendarDateKey(date),year=date.getFullYear(),easter=budgetEasterSunday(year),fixed=new Set([`${year}-01-01`,`${year}-01-06`,`${year}-05-01`,`${year}-06-06`,`${year}-12-24`,`${year}-12-25`,`${year}-12-26`,`${year}-12-31`,calendarDateKey(budgetDateOffset(easter,-2)),calendarDateKey(budgetDateOffset(easter,1)),calendarDateKey(budgetDateOffset(easter,39))]),midsummer=new Date(year,5,19,12);while(midsummer.getDay()!==5)midsummer.setDate(midsummer.getDate()+1);fixed.add(calendarDateKey(midsummer));return !fixed.has(key)};
const budgetAdjustedDate=(entry:BudgetEntry,date:Date)=>{if(entry.type!=="income"||!entry.businessDayAdjustment||budgetIsSwedishWorkday(date))return new Date(date);const adjusted=new Date(date),step=entry.businessDayAdjustment==="previous"?-1:1;do adjusted.setDate(adjusted.getDate()+step);while(!budgetIsSwedishWorkday(adjusted));return adjusted};
const budgetOccurrencesForMonth=(entry:BudgetEntry,targetDate:Date)=>{const key=`${targetDate.getFullYear()}-${String(targetDate.getMonth()+1).padStart(2,"0")}`,start=new Date(`${entry.date}T12:00:00`),values:Array<{entry:BudgetEntry;occurrenceDate:string}>=[],add=(candidate:Date)=>{if(candidate<start)return;const adjusted=budgetAdjustedDate(entry,candidate),occurrenceDate=calendarDateKey(adjusted);if(occurrenceDate.startsWith(key))values.push({entry,occurrenceDate})};if(entry.recurrence==="monthly"){for(const offset of [-1,0,1]){const anchor=new Date(targetDate.getFullYear(),targetDate.getMonth()+offset,1,12),day=Math.min(start.getDate(),new Date(anchor.getFullYear(),anchor.getMonth()+1,0).getDate());add(new Date(anchor.getFullYear(),anchor.getMonth(),day,12))}return values}if(entry.recurrence==="weekly"){const cursor=new Date(targetDate.getFullYear(),targetDate.getMonth(),-6,12),last=new Date(targetDate.getFullYear(),targetDate.getMonth()+1,7,12);while(cursor.getDay()!==start.getDay())cursor.setDate(cursor.getDate()+1);for(;cursor<=last;cursor.setDate(cursor.getDate()+7))add(new Date(cursor));return values}return entry.date.startsWith(key)?[{entry,occurrenceDate:entry.date}]:[]};
function BudgetDecimalInput({value,onValue,placeholder,ariaLabel}:{value:number;onValue:(value:number)=>void;placeholder?:string;ariaLabel?:string}){
  const [text,setText]=useState(value?String(value).replace(".",","):"");
  useEffect(()=>setText(value?String(value).replace(".",","):""),[value]);
  const change=(nextValue:string)=>{
    const next=budgetDecimalText(nextValue);
    if(next===null)return;
    setText(next);
    if(budgetDecimalComplete(next)){
      const parsed=budgetDecimalNumber(next);
      if(Number.isFinite(parsed))onValue(parsed);
    }else if(next==="")onValue(0);
  };
  const blur=()=>{
    const parsed=budgetDecimalNumber(text);
    if(Number.isFinite(parsed)){
      onValue(parsed);
      setText(parsed?String(parsed).replace(".",","):"");
    }else{
      onValue(0);
      setText("");
    }
  };
  return <input inputMode="decimal" value={text} placeholder={placeholder} aria-label={ariaLabel} onChange={event=>change(event.target.value)} onBlur={blur}/>;
}
function BudgetPage({entries,settings,privateMode,sharedAccountIds,account,memberships,groups,groupBudgetSettings,creating,onCreating,onMode,onSwitchGroup,onSave,onDelete,onSaveSettings,onReset,onClearMoney}:{entries:BudgetEntry[];settings:BudgetSettings;privateMode:boolean;sharedAccountIds:Set<string>;account:Account;memberships:Membership[];groups:Record<string,Group>;groupBudgetSettings:Record<string,BudgetSettings>;creating:boolean;onCreating:(value:boolean)=>void;onMode:(value:boolean)=>void;onSwitchGroup:(id:string)=>void;onSave:(entry:BudgetEntry)=>Promise<void>;onDelete:(entry:BudgetEntry)=>Promise<void>;onSaveSettings:(settings:BudgetSettings)=>Promise<void>;onReset:()=>Promise<void>;onClearMoney:()=>Promise<void>}){
  const now=new Date(),[monthOffset,setMonthOffset]=useState(0),[spaceOpen,setSpaceOpen]=useState(false),[settingsOpen,setSettingsOpen]=useState(false),[transferOpen,setTransferOpen]=useState(false),[editingTransfer,setEditingTransfer]=useState<BudgetEntry|undefined>(undefined),[selectedAccountId,setSelectedAccountId]=useState<string|undefined>(undefined),[editing,setEditing]=useState<BudgetEntry|null|undefined>(undefined),[confirmDelete,setConfirmDelete]=useState<BudgetEntry|null>(null),[lastDeleted,setLastDeleted]=useState<BudgetEntry|null>(null),[search,setSearch]=useState(""),[filter,setFilter]=useState<"all"|"income"|"expense"|"transfer"|"planned">("all"),[view,setView]=useState<"overview"|"recurring">("overview"),[createType,setCreateType]=useState<"income"|"expense">("expense");
  useEffect(()=>{const open=()=>setTransferOpen(true);window.addEventListener("bubbsun:new-budget-transfer",open);return()=>window.removeEventListener("bubbsun:new-budget-transfer",open)},[]);
  const monthDate=new Date(now.getFullYear(),now.getMonth()+monthOffset,1),monthKey=`${monthDate.getFullYear()}-${String(monthDate.getMonth()+1).padStart(2,"0")}`,monthNumber=monthDate.getFullYear()*12+monthDate.getMonth(),todayKey=calendarDateKey(now),expandMonth=(targetDate:Date)=>entries.flatMap(entry=>budgetOccurrencesForMonth(entry,targetDate)),monthEntries=expandMonth(monthDate).sort((a,b)=>new Date(`${b.occurrenceDate}T12:00:00`).getTime()-new Date(`${a.occurrenceDate}T12:00:00`).getTime()||(b.entry.createdAt||0)-(a.entry.createdAt||0)),paidEntries=monthEntries.filter(item=>budgetOccurrencePaid(item.entry,item.occurrenceDate,todayKey)),income=paidEntries.filter(item=>item.entry.type==="income").reduce((sum,item)=>sum+item.entry.amount,0),expense=paidEntries.filter(item=>item.entry.type==="expense").reduce((sum,item)=>sum+item.entry.amount,0),previousDate=new Date(monthDate.getFullYear(),monthDate.getMonth()-1,1),previousEntries=expandMonth(previousDate).filter(item=>budgetOccurrencePaid(item.entry,item.occurrenceDate,todayKey)),previousExpense=previousEntries.filter(item=>item.entry.type==="expense").reduce((sum,item)=>sum+item.entry.amount,0),visibleEntries=monthEntries.filter(({entry,occurrenceDate})=>(filter==="all"||(filter==="planned"?!budgetOccurrencePaid(entry,occurrenceDate,todayKey):entry.type===filter))&&`${entry.title} ${entry.category} ${entry.subcategory||""}`.toLocaleLowerCase("sv-SE").includes(search.trim().toLocaleLowerCase("sv-SE"))),activeGroup=groups[account.activeGroupId];
  const accountName=(id?:string,externalRecipient?:string)=>externalRecipient?`Utanför Bubbsun · ${externalRecipient}`:id===budgetUnassignedAccountId?"Ej placerat":settings.banks.flatMap(bank=>bank.accounts.map(item=>({id:item.id,label:`${bank.name} · ${item.name}`}))).find(item=>item.id===id)?.label||"Ej valt konto";
  const budgetAccounts=settings.banks.flatMap(bank=>bank.accounts),budgetAccountIds=new Set(budgetAccounts.map(item=>item.id)),totalOnAccounts=paidEntries.reduce((sum,{entry})=>entry.type==="transfer"?sum+(budgetAccountIds.has(entry.toAccountId||"")?entry.amount:0)-(budgetAccountIds.has(entry.fromAccountId||"")?entry.amount:0):budgetAccountIds.has(entry.accountId||"")?sum+(entry.type==="income"?entry.amount:-entry.amount):sum,budgetAccounts.reduce((sum,item)=>sum+(item.openingBalance||0),0));
  const upcomingItems=monthEntries.filter(item=>!budgetOccurrencePaid(item.entry,item.occurrenceDate,todayKey)),upcomingExpenses=upcomingItems.filter(item=>item.entry.type==="expense"),upcomingIncomes=upcomingItems.filter(item=>item.entry.type==="income"),upcomingTransfers=upcomingItems.filter(item=>item.entry.type==="transfer");
  const searchQuery=search.trim().toLocaleLowerCase("sv-SE"),matchesBudgetFilter=(entry:BudgetEntry,date:string)=>filter==="all"||(filter==="planned"?!budgetOccurrencePaid(entry,date,todayKey):entry.type===filter),searchMonths=Array.from({length:37},(_,index)=>new Date(now.getFullYear(),now.getMonth()+index-12,1)),allSearchEntries=searchQuery?entries.filter(entry=>`${entry.title} ${entry.category} ${entry.subcategory||""} ${entry.note||""} ${entry.externalRecipient||""}`.toLocaleLowerCase("sv-SE").includes(searchQuery)).flatMap(entry=>entry.recurrence?searchMonths.flatMap(date=>budgetOccurrencesForMonth(entry,date)):[{entry,occurrenceDate:entry.date}]).filter(item=>matchesBudgetFilter(item.entry,item.occurrenceDate)):[],searchGroups=Object.entries(allSearchEntries.reduce<Record<string,Array<{entry:BudgetEntry;occurrenceDate:string}>>>((groups,item)=>{(groups[item.occurrenceDate.slice(0,7)]??=[]).push(item);return groups},{})).sort(([a],[b])=>{const aPast=a<todayKey.slice(0,7),bPast=b<todayKey.slice(0,7);return aPast===bPast?(aPast?b.localeCompare(a):a.localeCompare(b)):aPast?1:-1});
  const renderBudgetRow=({entry,occurrenceDate}:{entry:BudgetEntry;occurrenceDate:string})=>{const paid=budgetOccurrencePaid(entry,occurrenceDate,todayKey),overdue=!paid&&occurrenceDate<todayKey;return <button key={`${entry.id}-${occurrenceDate}`} className={`budget-row ${!paid?"planned":""} ${overdue?"overdue":""}`} onClick={()=>{if(entry.type==="transfer"){setEditingTransfer(entry);setTransferOpen(true)}else setEditing(entry)}}><span className={entry.type}>{entry.type==="transfer"?"⇄":budgetCategoryIcons[entry.category]||(entry.type==="income"?"+":"−")}</span><span><strong>{entry.title}</strong><small>{budgetStatusLabel(entry,paid,overdue)}{entry.type==="transfer"?`${accountName(entry.fromAccountId)} → ${accountName(entry.toAccountId,entry.externalRecipient)}`:<>{entry.category}{entry.subcategory?` · ${entry.subcategory}`:""} · {accountName(entry.accountId)}</>} · {new Intl.DateTimeFormat("sv-SE",{day:"numeric",month:"short"}).format(new Date(`${occurrenceDate}T12:00:00`))}{!privateMode&&<> · {entry.creatorName}</>}</small></span><b className={entry.type}>{entry.type==="income"?"+ ":entry.type==="expense"?"− ":""}{budgetMoney(entry.amount)}</b><ChevronRight/></button>};
  return <section className="content budget-page">
    <nav className="budget-tabs" aria-label="Budgetmeny"><div className="budget-tab-links"><button className={view==="overview"?"selected":""} onClick={()=>setView("overview")}><WalletCards/>ÖVERSIKT</button><button onClick={()=>{setCreateType("income");setEditing(undefined);onCreating(true)}}><b>+</b> INKOMST</button><button onClick={()=>{setCreateType("expense");setEditing(undefined);onCreating(true)}}><b>−</b> UTGIFT</button><button onClick={()=>{setEditingTransfer(undefined);setTransferOpen(true)}}><ArrowLeftRight/> ÖVERFÖR</button><button className={view==="recurring"?"selected":""} onClick={()=>setView("recurring")}><History/> ÅTERKOMMANDE</button></div><div className="budget-tab-tools"><div className="calendar-space-wrap budget-space"><button className="calendar-space-button" onClick={()=>setSpaceOpen(value=>!value)}>{privateMode?<LockKeyhole/>:<GroupIcon id={activeGroup?.iconId}/>}<span><small>{privateMode?"PRIVAT":"GRUPP"}</small><strong>{privateMode?"Bara jag":activeGroup?.name||"Välj grupp"}</strong></span><ChevronDown/></button>{spaceOpen&&<div className="calendar-space-menu"><button className={privateMode?"selected":""} onClick={()=>{onMode(true);setSpaceOpen(false)}}><LockKeyhole/><strong>Privat</strong>{privateMode&&<Check/>}</button>{memberships.map(item=><button key={item.groupId} className={!privateMode&&item.groupId===account.activeGroupId?"selected":""} onClick={()=>{onSwitchGroup(item.groupId);setSpaceOpen(false)}}><GroupIcon id={groups[item.groupId]?.iconId}/><strong>{groups[item.groupId]?.name||"Grupp"}</strong>{!privateMode&&item.groupId===account.activeGroupId&&<Check/>}</button>)}</div>}</div><button className="budget-settings-trigger" aria-label="Budgetinställningar" title="Budgetinställningar" onClick={()=>setSettingsOpen(true)}><Settings/></button></div></nav>
    {view==="overview"?<>
    <nav className="budget-month-nav"><button onClick={()=>setMonthOffset(value=>value-1)} aria-label="Föregående månad"><ChevronLeft/></button><strong>{new Intl.DateTimeFormat("sv-SE",{month:"long",year:"numeric"}).format(monthDate)}</strong><button onClick={()=>setMonthOffset(value=>value+1)} aria-label="Nästa månad"><ChevronRight/></button></nav>
    <div className="budget-summary"><article><small>INKOMSTER</small><strong className="income">+ {budgetMoney(income)}</strong></article><article><small>UTGIFTER</small><strong className="expense">− {budgetMoney(expense)}</strong></article><article className="balance"><small>KVAR PÅ KONTON</small><strong className={totalOnAccounts<0?"expense":"income"}>{budgetMoney(totalOnAccounts)}</strong></article></div>
    <section className="budget-insights"><article><small>JÄMFÖRT MED FÖRRA MÅNADEN</small><strong className={expense>previousExpense?"expense":"income"}>{expense===previousExpense?"Samma utgifter":`${budgetMoney(Math.abs(expense-previousExpense))} ${expense>previousExpense?"mer":"mindre"}`}</strong></article><article><small>KOMMANDE DENNA MÅNAD</small><strong className="expense">{upcomingExpenses.length} {upcomingExpenses.length===1?"utgift":"utgifter"} · − {budgetMoney(upcomingExpenses.reduce((sum,item)=>sum+item.entry.amount,0))}</strong><span className="income">{upcomingIncomes.length} {upcomingIncomes.length===1?"inkomst":"inkomster"} · + {budgetMoney(upcomingIncomes.reduce((sum,item)=>sum+item.entry.amount,0))}</span>{upcomingTransfers.length>0&&<em>{upcomingTransfers.length} {upcomingTransfers.length===1?"överföring":"överföringar"}</em>}</article></section>
    {Object.values(settings.categoryBudgets||{}).some(Boolean)&&<section className="budget-category-progress"><h2>KATEGORIBUDGET</h2>{Object.entries(settings.categoryBudgets||{}).filter(([,limit])=>limit>0).map(([category,limit])=>{const spent=paidEntries.filter(item=>item.entry.type==="expense"&&item.entry.category===category).reduce((sum,item)=>sum+item.entry.amount,0),percent=Math.min(100,Math.round(spent/limit*100));return <article key={category}><span><b>{budgetCategoryIcons[category]} {category}</b><small>{budgetMoney(spent)} av {budgetMoney(limit)}</small></span><progress max="100" value={percent}/>{spent>limit&&<em>Över budget med {budgetMoney(spent-limit)}</em>}</article>})}</section>}
    {!!settings.savingsGoals?.length&&<section className="budget-goals"><h2>SPARMÅL</h2>{settings.savingsGoals.map(goal=><article key={goal.id}><span><b>🎯 {goal.name}</b><small>{budgetMoney(goal.saved)} av {budgetMoney(goal.target)}</small></span><progress max={goal.target||1} value={goal.saved}/></article>)}</section>}
    <BudgetAccountOverview settings={settings} entries={paidEntries.map(item=>item.entry)} sharedAccountIds={sharedAccountIds} onSelect={setSelectedAccountId}/><section className={`budget-list${searchQuery?" budget-global-search":""}`}><header className="budget-list-tools"><h2>{searchQuery?"SÖKRESULTAT":"MÅNADENS POSTER"}</h2><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Sök i hela budgeten…"/><select value={filter} onChange={event=>setFilter(event.target.value as typeof filter)}><option value="all">Alla</option><option value="income">Inkomster</option><option value="expense">Utgifter</option><option value="transfer">Överföringar</option><option value="planned">Planerade</option></select></header>{searchQuery?(searchGroups.length?searchGroups.map(([key,items])=><section className="budget-search-month" key={key}><header><strong>{new Intl.DateTimeFormat("sv-SE",{month:"long",year:"numeric"}).format(new Date(`${key}-01T12:00:00`))}</strong><small>{items.length} {items.length===1?"träff":"träffar"}</small></header>{items.sort((a,b)=>a.occurrenceDate.localeCompare(b.occurrenceDate)).map(renderBudgetRow)}</section>):<div className="budget-empty"><WalletCards/><h3>Inga poster matchar</h3><p>Sökningen gäller alla månader.</p></div>):(visibleEntries.length?visibleEntries.map(renderBudgetRow):<div className="budget-empty"><WalletCards/><h3>Inga poster matchar</h3></div>)}</section></>:<section className="budget-list budget-recurring-list"><header><div><small>AUTOMATISKA POSTER</small><h2>ÅTERKOMMANDE</h2></div><b>{entries.filter(entry=>Boolean(entry.recurrence)).length} st</b></header>{entries.filter(entry=>Boolean(entry.recurrence)).sort((a,b)=>a.date.localeCompare(b.date)).map(entry=><button key={entry.id} className="budget-row" onClick={()=>{if(entry.type==="transfer"){setEditingTransfer(entry);setTransferOpen(true)}else setEditing(entry)}}><span className={entry.type}>{entry.type==="transfer"?"⇄":budgetCategoryIcons[entry.category]||(entry.type==="income"?"+":"−")}</span><span><strong>{entry.title}</strong><small>{entry.type==="transfer"?"Överföring":entry.category} · {entry.recurrence==="weekly"?`varje ${new Intl.DateTimeFormat("sv-SE",{weekday:"long"}).format(new Date(`${entry.date}T12:00:00`))}`:`varje månad den ${Number(entry.date.slice(-2))}:e`}{entry.autoPay?" · betalas automatiskt":""}{!privateMode&&<> · {entry.creatorName}</>}</small></span><b className={entry.type}>{entry.type==="income"?"+ ":entry.type==="expense"?"− ":""}{budgetMoney(entry.amount)}</b><ChevronRight/></button>)}{!entries.some(entry=>Boolean(entry.recurrence))&&<div className="budget-empty"><History/><h3>Inga återkommande poster</h3><p>Markera “Återkommande post” när du skapar en post.</p></div>}</section>}
    {selectedAccountId&&<BudgetAccountDetail accountId={selectedAccountId} settings={settings} entries={paidEntries} privateMode={privateMode} onClose={()=>setSelectedAccountId(undefined)}/>}
    {transferOpen&&<BudgetTransferEditor entry={editingTransfer} settings={settings} entries={monthEntries.map(item=>item.entry)} monthKey={monthKey} account={account} onClose={()=>{setTransferOpen(false);setEditingTransfer(undefined)}} onDelete={editingTransfer?()=>{setConfirmDelete(editingTransfer);setTransferOpen(false);setEditingTransfer(undefined)}:undefined} onSave={async entry=>{await onSave(entry);setTransferOpen(false);setEditingTransfer(undefined)}}/>}
    {(creating||(editing!==undefined&&editing?.type!=="transfer"))&&<BudgetEditor entry={editing||undefined} initialType={createType} settings={settings} entries={monthEntries.map(item=>item.entry)} monthKey={monthKey} account={account} onClose={()=>{setEditing(undefined);onCreating(false)}} onSave={async entry=>{await onSave(entry);setEditing(undefined);onCreating(false)}} onDelete={editing?()=>setConfirmDelete(editing):undefined}/>} {settingsOpen&&<BudgetSettingsEditor settings={settings} privateMode={privateMode} groups={groups} groupBudgetSettings={groupBudgetSettings} onClose={()=>setSettingsOpen(false)} onSave={async value=>{await onSaveSettings(value);setSettingsOpen(false)}} onReset={async()=>{await onReset();setSettingsOpen(false)}} onClearMoney={async()=>{await onClearMoney();setSettingsOpen(false)}}/>}
    {confirmDelete&&<div className="modal-backdrop"><div className="modal confirm-delete-modal"><Trash2/><h2>TA BORT BUDGETPOSTEN?</h2><p>“{confirmDelete.title}” tas bort. Du kan ångra direkt efteråt.</p><div className="modal-actions"><button onClick={()=>setConfirmDelete(null)}>AVBRYT</button><button className="danger" onClick={async()=>{const removed=confirmDelete;await onDelete(removed);setLastDeleted(removed);setConfirmDelete(null);setEditing(undefined)}}>TA BORT</button></div></div></div>}
    {lastDeleted&&<aside className="budget-undo">Posten “{lastDeleted.title}” togs bort.<button onClick={async()=>{await onSave(lastDeleted);setLastDeleted(null)}}>ÅNGRA</button><button aria-label="Stäng" onClick={()=>setLastDeleted(null)}><X/></button></aside>}
  </section>;
}
function BudgetAccountOverview({settings,entries,sharedAccountIds,onSelect}:{settings:BudgetSettings;entries:BudgetEntry[];sharedAccountIds:Set<string>;onSelect:(id:string)=>void}){if(!settings.banks.length)return null;const accountTotal=(id:string)=>{const account=settings.banks.flatMap(bank=>bank.accounts).find(item=>item.id===id);return entries.reduce((sum,entry)=>entry.type==="transfer"?sum+(entry.toAccountId===id?entry.amount:0)-(entry.fromAccountId===id?entry.amount:0):entry.accountId===id?sum+(entry.type==="income"?entry.amount:-entry.amount):sum,account?.openingBalance||0)};return <section className="budget-accounts-overview"><header><span><small>DIN MÅNADSÖVERSIKT</small><h2>BANKER & KONTON</h2></span></header><div>{settings.banks.map(bank=><article key={bank.id}><header><span>▣</span><strong>{bank.name}</strong><b>{budgetMoney(bank.accounts.reduce((sum,item)=>sum+accountTotal(item.id),0))}</b></header><div>{bank.accounts.map(account=>{const total=accountTotal(account.id),shared=Boolean(account.linkedGroupId)||sharedAccountIds.has(account.id);return <button type="button" key={account.id} onClick={()=>onSelect(account.id)}><span><i>{budgetAccountIcon(account.icon)}</i><strong>{account.name}</strong>{shared&&<small className="budget-account-shared" title={account.linkedGroupId?"Samma konto visas även i en grupp":"Samma konto visas även i din privata budget"} aria-label="Delat konto"><Link2/></small>}</span><b className={total<0?"expense":"income"}>{budgetMoney(total)}</b><ChevronRight/></button>})}</div></article>)}</div></section>}
function BudgetAccountDetail({accountId,settings,entries,privateMode,onClose}:{accountId:string;settings:BudgetSettings;entries:Array<{entry:BudgetEntry;occurrenceDate:string}>;privateMode:boolean;onClose:()=>void}){const match=settings.banks.flatMap(bank=>bank.accounts.map(account=>({bank:bank.name,account}))).find(item=>item.account.id===accountId);if(!match)return null;const relevant=entries.filter(({entry})=>entry.type==="transfer"?entry.fromAccountId===accountId||entry.toAccountId===accountId:entry.accountId===accountId),signed=(entry:BudgetEntry)=>entry.type==="transfer"?(entry.toAccountId===accountId?entry.amount:-entry.amount):entry.type==="income"?entry.amount:-entry.amount,total=relevant.reduce((sum,{entry})=>sum+signed(entry),match.account.openingBalance||0),accountLabel=(id?:string)=>settings.banks.flatMap(bank=>bank.accounts.map(account=>({id:account.id,label:`${bank.name} · ${account.name}`}))).find(item=>item.id===id)?.label||(id===budgetUnassignedAccountId?"Ej placerat":"Okänt konto");return <div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}><section className="modal budget-account-detail"><button className="modal-x" onClick={onClose}><X/></button><header><i>{budgetAccountIcon(match.account.icon)}</i><span><small>{match.bank}</small><h2>{match.account.name}</h2></span><b className={total<0?"expense":"income"}>{budgetMoney(total)}</b></header><div className="budget-account-detail-summary"><span>BERÄKNAT KONTOBELOPP</span><strong>Ingående {budgetMoney(match.account.openingBalance||0)} · {relevant.length} {relevant.length===1?"händelse":"händelser"}</strong></div><div className="budget-account-detail-list">{relevant.map(({entry,occurrenceDate})=>{const value=signed(entry);return <article key={`${entry.id}-${occurrenceDate}`}><i className={value<0?"expense":"income"}>{entry.type==="transfer"?"⇄":value>0?"+":"−"}</i><span><strong>{entry.title}</strong><small>{entry.type==="transfer"?`${accountLabel(entry.fromAccountId)} → ${entry.externalRecipient||accountLabel(entry.toAccountId)}`:entry.category} · {new Intl.DateTimeFormat("sv-SE",{day:"numeric",month:"short"}).format(new Date(`${occurrenceDate}T12:00:00`))}{!privateMode&&<> · {entry.creatorName}</>}</small></span><b className={value<0?"expense":"income"}>{value>0?"+ ":"− "}{budgetMoney(Math.abs(value))}</b></article>})}{!relevant.length&&<div className="budget-empty"><WalletCards/><h3>Inga händelser denna månad</h3></div>}</div><p className="budget-account-detail-note">Beloppet är ingående saldo plus betalda poster på kontot. Planerade poster påverkar inte saldot förrän de markeras som betalda.</p></section></div>}
const budgetAccountIcons=[{id:"wallet",icon:"👛",label:"Betalkonto"},{id:"card",icon:"💳",label:"Bankkort"},{id:"bills",icon:"🧾",label:"Räkningar"},{id:"savings",icon:"🐷",label:"Sparkonto"},{id:"buffer",icon:"🔒",label:"Buffert"},{id:"salary",icon:"💰",label:"Lön"},{id:"cash",icon:"💵",label:"Kontanter"},{id:"home",icon:"🏠",label:"Boende"},{id:"food",icon:"🛒",label:"Mat"},{id:"car",icon:"🚗",label:"Bil"},{id:"travel",icon:"✈️",label:"Resor"},{id:"invest",icon:"📈",label:"Investeringar"},{id:"art",icon:"🎨",label:"Konst & hobby"},{id:"shopping",icon:"🛍️",label:"Shopping"},{id:"children",icon:"🧸",label:"Barn"},{id:"pets",icon:"🐾",label:"Husdjur"},{id:"health",icon:"🩺",label:"Hälsa"},{id:"study",icon:"🎓",label:"Studier"},{id:"phone",icon:"📱",label:"Abonnemang"},{id:"energy",icon:"⚡",label:"El & energi"},{id:"gift",icon:"🎁",label:"Presenter"},{id:"personal",icon:"👤",label:"Personligt"}];
const budgetAccountIcon=(id?:string)=>budgetAccountIcons.find(item=>item.id===id)?.icon||"👛";
function BudgetCalculator({onClose}:{onClose:()=>void}){
  const [display,setDisplay]=useState("0"),[stored,setStored]=useState<number|null>(null),[operator,setOperator]=useState<"+"|"−"|"×"|"÷"|null>(null),[fresh,setFresh]=useState(true);
  const numberValue=()=>Number(display.replace(/\s/g,"").replace(",","."))||0,format=(value:number)=>Number.isFinite(value)?new Intl.NumberFormat("sv-SE",{maximumFractionDigits:10}).format(value):"Fel",calculate=(left:number,right:number,op:typeof operator)=>op==="+"?left+right:op==="−"?left-right:op==="×"?left*right:op==="÷"?(right===0?Number.NaN:left/right):right;
  const digit=(value:string)=>{if(display==="Fel"||fresh){setDisplay(value);setFresh(false)}else if(display.replace(/[^0-9]/g,"").length<12)setDisplay(display==="0"?value:display+value)};
  const choose=(next:typeof operator)=>{const current=numberValue(),base=stored!==null&&operator?calculate(stored,current,operator):current;setStored(base);setDisplay(format(base));setOperator(next);setFresh(true)};
  const equals=()=>{if(stored===null||!operator)return;const result=calculate(stored,numberValue(),operator);setDisplay(format(result));setStored(null);setOperator(null);setFresh(true)};
  return <div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}><section className="modal budget-calculator"><button className="modal-x" onClick={onClose}><X/></button><header><Calculator/><div><small>BUDGETVERKTYG</small><h2>MINIRÄKNARE</h2></div></header><output aria-live="polite">{display}</output><div className="budget-calculator-grid"><button className="clear" onClick={()=>{setDisplay("0");setStored(null);setOperator(null);setFresh(true)}}>C</button><button onClick={()=>setDisplay(value=>value.startsWith("-")?value.slice(1):value==="0"?value:`-${value}`)}>±</button><button onClick={()=>setDisplay(format(numberValue()/100))}>%</button><button className={operator==="÷"?"active":""} onClick={()=>choose("÷")}>÷</button>{["7","8","9"].map(value=><button key={value} onClick={()=>digit(value)}>{value}</button>)}<button className={operator==="×"?"active":""} onClick={()=>choose("×")}>×</button>{["4","5","6"].map(value=><button key={value} onClick={()=>digit(value)}>{value}</button>)}<button className={operator==="−"?"active":""} onClick={()=>choose("−")}>−</button>{["1","2","3"].map(value=><button key={value} onClick={()=>digit(value)}>{value}</button>)}<button className={operator==="+"?"active":""} onClick={()=>choose("+")}>+</button><button className="zero" onClick={()=>digit("0")}>0</button><button onClick={()=>{if(fresh||display.includes(","))return;setDisplay(`${display},`);setFresh(false)} }>,</button><button className="equals" onClick={equals}>=</button></div></section></div>
}
function BudgetSettingsEditor({settings,privateMode,groups,groupBudgetSettings,onClose,onSave,onReset,onClearMoney}:{settings:BudgetSettings;privateMode:boolean;groups:Record<string,Group>;groupBudgetSettings:Record<string,BudgetSettings>;onClose:()=>void;onSave:(settings:BudgetSettings)=>Promise<void>;onReset:()=>Promise<void>;onClearMoney:()=>Promise<void>}){
  const [banks,setBanks]=useState(settings.banks),[defaultAccountId,setDefaultAccountId]=useState(settings.defaultAccountId||""),[categoryBudgets,setCategoryBudgets]=useState(settings.categoryBudgets||{}),[goals,setGoals]=useState(settings.savingsGoals||[]),[resetStep,setResetStep]=useState(0),[resetText,setResetText]=useState(""),[moneyResetStep,setMoneyResetStep]=useState(0),[privateAccountValue,setPrivateAccountValue]=useState(""),[linkValue,setLinkValue]=useState("");
  const updateAccount=(bankId:string,accountId:string,patch:Record<string,unknown>)=>setBanks(old=>old.map(bank=>bank.id===bankId?{...bank,accounts:bank.accounts.map(account=>account.id===accountId?{...account,...patch}:account)}:bank));
  const linkOptions=Object.entries(groupBudgetSettings).flatMap(([groupId,value])=>value.banks.flatMap(bank=>bank.accounts.map(account=>({groupId,account,label:`${groups[groupId]?.name||"Grupp"} · ${bank.name} · ${account.name}`}))));
  const privateAccountOptions=banks.flatMap(bank=>bank.accounts.filter(account=>!account.linkedGroupId).map(account=>({id:account.id,label:`${bank.name} · ${account.name}`})));
  const addLinkedAccount=()=>{const [groupId,accountId]=linkValue.split("::"),source=linkOptions.find(item=>item.groupId===groupId&&item.account.id===accountId);if(!source||!privateAccountValue||banks.some(bank=>bank.accounts.some(item=>item.linkedGroupId===groupId&&item.linkedAccountId===accountId)))return;setBanks(old=>old.map(bank=>({...bank,accounts:bank.accounts.map(account=>account.id===privateAccountValue?{...account,linkedGroupId:groupId,linkedAccountId:accountId}:account)})));setPrivateAccountValue("");setLinkValue("")};
  const unlinkAccount=(bankId:string,accountId:string)=>updateAccount(bankId,accountId,{linkedGroupId:undefined,linkedAccountId:undefined});
  return <div className="modal-backdrop"><section className="modal budget-settings-editor"><button className="modal-x" onClick={onClose}><X/></button><header><Settings/><h2>BUDGETINSTÄLLNINGAR</h2></header>
    <div className="budget-settings-explanation"><strong>Startsaldo – ett fast utgångsvärde</strong><p>Skriv hur mycket pengar kontot innehöll när du började använda Bubbget. Startsaldot är <b>inte en ny insättning</b>: om du öppnar inställningarna och sparar igen läggs pengarna inte till en gång till.</p><small>Ändra bara startsaldot om utgångsvärdet blev fel.</small></div>
    {privateMode&&<section className="budget-link-account"><span><Link2/><strong>KOPPLA IHOP TVÅ BEFINTLIGA KONTON</strong></span><p>Välj exakt ett konto i din privata budget och exakt ett konto i gruppen. Bara dessa två kopplas ihop.</p><div className="budget-link-pair"><label>MITT PRIVATA KONTO<select value={privateAccountValue} onChange={event=>setPrivateAccountValue(event.target.value)}><option value="">Välj privat konto…</option>{privateAccountOptions.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}</select></label><b>↔</b><label>GRUPPENS KONTO<select value={linkValue} onChange={event=>setLinkValue(event.target.value)}><option value="">Välj gruppkonto…</option>{linkOptions.map(option=><option key={`${option.groupId}-${option.account.id}`} value={`${option.groupId}::${option.account.id}`}>{option.label}</option>)}</select></label></div><button disabled={!privateAccountValue||!linkValue} onClick={addLinkedAccount}><Link2/> KOPPLA IHOP KONTONA</button></section>}
    <h3>BANKER, KONTON & SALDON</h3><section className="budget-settings-block budget-main-account"><h3>⭐ HUVUDKONTO</h3><p>Det här kontot väljs automatiskt när du skapar en betalning, inkomst eller överföring.</p><select value={defaultAccountId} onChange={event=>setDefaultAccountId(event.target.value)}><option value="">Inget huvudkonto</option>{banks.flatMap(bank=>bank.accounts.map(account=><option key={account.id} value={account.id}>{bank.name} · {account.name||"Namnlöst konto"}</option>))}</select></section><div className="budget-bank-editor">{banks.map(bank=><section key={bank.id}><div><input value={bank.name} placeholder="Namn på bank" onChange={event=>setBanks(old=>old.map(item=>item.id===bank.id?{...item,name:event.target.value}:item))}/><button onClick={()=>setBanks(old=>old.filter(item=>item.id!==bank.id))}><Trash2/></button></div>{bank.accounts.map(account=><div className={`budget-account-edit budget-account-edit-full${account.linkedGroupId?" is-linked":""}`} key={account.id}><select aria-label="Kontoikon" value={account.icon||"wallet"} onChange={event=>updateAccount(bank.id,account.id,{icon:event.target.value})}>{budgetAccountIcons.map(item=><option value={item.id} key={item.id}>{item.icon} {item.label}</option>)}</select><input value={account.name} placeholder="Namn på konto" onChange={event=>updateAccount(bank.id,account.id,{name:event.target.value})}/><label>STARTSALDO (FAST VÄRDE)<BudgetDecimalInput value={account.openingBalance||0} placeholder="0,00 kr" onValue={value=>updateAccount(bank.id,account.id,{openingBalance:value,reconciledBalance:undefined,reconciledAt:undefined})}/></label><button aria-label={`Ta bort kontot ${account.name}`} title="Ta bort konto" onClick={()=>setBanks(old=>old.map(item=>item.id===bank.id?{...item,accounts:item.accounts.filter(value=>value.id!==account.id)}:item))}><Trash2/></button>{account.linkedGroupId&&<><button type="button" className="budget-unlink-account" aria-label={`Sluta dela ${account.name}`} title="Sluta dela kontot" onClick={()=>unlinkAccount(bank.id,account.id)}><Unlink2/></button><small className="budget-linked-badge"><span><Link2/> DELAT MED {groups[account.linkedGroupId]?.name||"GRUPP"}</span></small></>}</div>)}<button className="add-account" onClick={()=>setBanks(old=>old.map(item=>item.id===bank.id?{...item,accounts:[...item.accounts,{id:crypto.randomUUID(),name:"",icon:"wallet",openingBalance:0}]}:item))}><Plus/> LÄGG TILL KONTO</button></section>)}</div><button className="add-bank" onClick={()=>setBanks(old=>[...old,{id:crypto.randomUUID(),name:"",accounts:[]}])}><Plus/> LÄGG TILL BANK</button>
    <section className="budget-settings-block"><h3>KATEGORIBUDGETAR</h3><div className="budget-settings-explanation"><strong>Så fungerar det</strong><p>Skriv hur mycket du högst vill spendera i varje kategori per månad. På översikten ser du hur mycket som använts och får en varning om gränsen passeras. Endast betalda utgifter räknas – planerade poster räknas först när de markeras som betalda.</p><small>Lämna ett fält tomt om kategorin inte ska ha någon gräns.</small></div><div className="budget-limit-grid">{budgetCategories.expense.map(category=><label key={category}><span>{budgetCategoryIcons[category]} {category}</span><span className="budget-limit-input"><BudgetDecimalInput value={categoryBudgets[category]||0} placeholder="Ingen gräns" ariaLabel={`${category}, kronor per månad`} onValue={value=>setCategoryBudgets(old=>({...old,[category]:value}))}/></span></label>)}</div></section>
    <section className="budget-settings-block"><h3>SPARMÅL</h3>{goals.map(goal=><div className="budget-goal-edit" key={goal.id}><input value={goal.name} placeholder="Till exempel Semester" onChange={event=>setGoals(old=>old.map(item=>item.id===goal.id?{...item,name:event.target.value}:item))}/><BudgetDecimalInput value={goal.saved||0} placeholder="Sparat" onValue={value=>setGoals(old=>old.map(item=>item.id===goal.id?{...item,saved:value}:item))}/><BudgetDecimalInput value={goal.target||0} placeholder="Mål" onValue={value=>setGoals(old=>old.map(item=>item.id===goal.id?{...item,target:value}:item))}/><button onClick={()=>setGoals(old=>old.filter(item=>item.id!==goal.id))}><Trash2/></button></div>)}<button className="add-account" onClick={()=>setGoals(old=>[...old,{id:crypto.randomUUID(),name:"",saved:0,target:0}])}><Plus/> LÄGG TILL SPARMÅL</button></section>
    <section className="budget-money-reset"><h3>NOLLSTÄLL PENGAR – TEST</h3><p>Tar bort alla poster och sätter kontonas saldon till 0 kr. Banker, konton, ikoner, kategoribudgetar och sparmål finns kvar.</p>{moneyResetStep===0?<button className="danger" onClick={()=>setMoneyResetStep(1)}>NOLLSTÄLL BARA PENGARNA</button>:<><strong>Vill du verkligen nollställa alla belopp och poster?</strong><button className="danger" onClick={onClearMoney}>JA, NOLLSTÄLL PENGARNA</button><button onClick={()=>setMoneyResetStep(0)}>AVBRYT</button></>}</section>
    <section className="budget-reset-zone"><h3>ÅTERSTÄLL HELA BUDGETEN</h3><p>Alla poster, konton, mål och inställningar tas bort permanent.</p>{resetStep===0?<button className="danger" onClick={()=>setResetStep(1)}>ÅTERSTÄLL ALLT</button>:resetStep===1?<><p>Är du helt säker?</p><button className="danger" onClick={()=>setResetStep(2)}>JA, FORTSÄTT</button><button onClick={()=>setResetStep(0)}>AVBRYT</button></>:<><label>Skriv <b>ÅTERSTÄLL</b><input value={resetText} onChange={event=>setResetText(event.target.value)}/></label><button className="danger" disabled={resetText!=="ÅTERSTÄLL"} onClick={onReset}>RADERA HELA BUDGETEN</button><button onClick={()=>{setResetStep(0);setResetText("")}}>AVBRYT</button></>}</section>
    <footer><button onClick={onClose}>AVBRYT</button><button onClick={()=>{const accountIds=new Set(banks.flatMap(bank=>bank.accounts.map(account=>account.id)));onSave({banks,defaultAccountId:accountIds.has(defaultAccountId)?defaultAccountId:undefined,categoryBudgets,savingsGoals:goals.filter(goal=>goal.name.trim()&&goal.target>0),updatedAt:Date.now()})}}>SPARA</button></footer></section></div>
}
const budgetUnassignedAccountId="__unassigned__";
const budgetExternalRecipientId="__external_recipient__";
type BudgetTransferOption={id:string;bank:string;name:string;icon:string;balance:number;external?:boolean};
function BudgetTransferAccountPicker({label,value,options,onChange}:{label:string;value:string;options:BudgetTransferOption[];onChange:(id:string)=>void}){const [open,setOpen]=useState(false),pickerRef=useRef<HTMLDivElement|null>(null),selected=options.find(item=>item.id===value)||options[0];useEffect(()=>{if(!open)return;const close=(event:PointerEvent)=>{if(!pickerRef.current?.contains(event.target as Node))setOpen(false)};document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close)},[open]);return <div className="budget-transfer-account-field"><strong>{label}</strong><div ref={pickerRef} className={`budget-transfer-account-picker${open?" open":""}`}><button type="button" className="budget-transfer-account-trigger" aria-expanded={open} onClick={()=>setOpen(current=>!current)}><i>{selected?.icon}</i><span><small>{selected?.bank}</small><b>{selected?.name}</b></span>{!selected?.external&&<em className={(selected?.balance||0)<0?"expense":"income"}>{budgetMoney(selected?.balance||0)}</em>}<ChevronDown/></button>{open&&<div className="budget-transfer-account-menu">{options.map(option=><button type="button" className={option.id===value?"selected":""} key={option.id} onClick={()=>{onChange(option.id);setOpen(false)}}><i>{option.icon}</i><span><small>{option.bank}</small><b>{option.name}</b></span>{!option.external&&<em className={option.balance<0?"expense":"income"}>{budgetMoney(option.balance)}</em>}{option.id===value&&<Check/>}</button>)}</div>}</div></div>}
function BudgetTransferEditor({entry,settings,entries,monthKey,account,onClose,onSave,onDelete}:{entry?:BudgetEntry;settings:BudgetSettings;entries:BudgetEntry[];monthKey:string;account:Account;onClose:()=>void;onSave:(entry:BudgetEntry)=>Promise<void>;onDelete?:()=>void}){
  const balance=(id:string)=>entries.reduce((sum,value)=>value.status==="planned"?sum:value.type==="transfer"?sum+(value.toAccountId===id?value.amount:0)-(value.fromAccountId===id?value.amount:0):(id===budgetUnassignedAccountId?!value.accountId:value.accountId===id)?sum+(value.type==="income"?value.amount:-value.amount):sum,settings.banks.flatMap(bank=>bank.accounts).find(item=>item.id===id)?.openingBalance||0),accounts:BudgetTransferOption[]=[{id:budgetUnassignedAccountId,bank:"UTAN KONTO",name:"Ej placerat",icon:"💰",balance:balance(budgetUnassignedAccountId)},...settings.banks.flatMap(bank=>bank.accounts.map(item=>({id:item.id,bank:bank.name,name:item.name,icon:budgetAccountIcon(item.icon),balance:balance(item.id)})))],destinationAccounts:BudgetTransferOption[]=[...accounts,{id:budgetExternalRecipientId,bank:"UTANFÖR BUBBSUN",name:"Annat konto eller person",icon:"↗",balance:0,external:true}],defaultFromId=settings.defaultAccountId&&accounts.some(item=>item.id===settings.defaultAccountId)?settings.defaultAccountId:accounts[0]?.id||"",[fromAccountId,setFrom]=useState(entry?.fromAccountId||defaultFromId),[toAccountId,setTo]=useState(entry?.externalRecipient?budgetExternalRecipientId:entry?.toAccountId||accounts.find(item=>item.id!==defaultFromId)?.id||budgetExternalRecipientId),[externalRecipient,setExternalRecipient]=useState(entry?.externalRecipient||""),[amount,setAmount]=useState(entry?String(entry.amount).replace(".",","):""),[date,setDate]=useState(entry?.date||calendarDateKey(new Date())),[title,setTitle]=useState(entry?.title||""),[recurring,setRecurring]=useState(Boolean(entry?.recurrence)),[frequency,setFrequency]=useState<"monthly"|"weekly">(entry?.recurrence||"monthly"),[busy,setBusy]=useState(false),parsedAmount=budgetDecimalNumber(amount),isExternal=toAccountId===budgetExternalRecipientId;
  return <div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}><section className="modal budget-transfer-editor"><button className="modal-x" onClick={onClose}><X/></button><header><span>⇄</span><div><small>{entry?"ÖVERFÖRING":"BUDGET"}</small><h2>{entry?"REDIGERA ÖVERFÖRING":"NY ÖVERFÖRING"}</h2></div></header><p>Flytta pengar mellan dina konton eller skicka dem till någon utanför Bubbsun.</p><label>VAD GÄLLER DET?<input value={title} onChange={event=>setTitle(event.target.value)} placeholder="Till exempel Månadssparande"/></label><div className="budget-transfer-route"><BudgetTransferAccountPicker label="FRÅN" value={fromAccountId} options={accounts} onChange={setFrom}/><b>→</b><BudgetTransferAccountPicker label="TILL" value={toAccountId} options={destinationAccounts} onChange={setTo}/></div>{isExternal&&<label className="budget-external-recipient">MOTTAGARE<input autoFocus value={externalRecipient} onChange={event=>setExternalRecipient(event.target.value)} placeholder="Till exempel Mor"/><small>Pengarna lämnar Bubbsun och dras bara från frånkontot.</small></label>}<div className="budget-editor-grid"><label>BELOPP (KR)<input inputMode="decimal" value={amount} onChange={event=>{const next=budgetDecimalText(event.target.value);if(next!==null)setAmount(next)}} placeholder="500,00"/></label><label>{recurring?"FÖRSTA DATUM":"DATUM"}<input type="date" value={date} onChange={event=>setDate(event.target.value)}/></label></div>{parsedAmount>balance(fromAccountId)&&<p className="budget-balance-warning">⚠ Överföringen är {budgetMoney(parsedAmount-balance(fromAccountId))} större än saldot på frånkontot.</p>}<label className="budget-recurring"><input type="checkbox" checked={recurring} onChange={event=>setRecurring(event.target.checked)}/><span><strong>Återkommande överföring</strong><small>Flyttas automatiskt på varje valt datum.</small></span></label>{recurring&&<label>HUR OFTA?<select value={frequency} onChange={event=>setFrequency(event.target.value as "monthly"|"weekly")}><option value="monthly">Varje månad</option><option value="weekly">Varje vecka</option></select><small>{frequency==="weekly"?`Sker varje ${new Intl.DateTimeFormat("sv-SE",{weekday:"long"}).format(new Date(`${date}T12:00:00`))}.`:"Sker samma datum varje månad."}</small></label>}<footer>{onDelete&&<button className="danger" onClick={onDelete}>TA BORT</button>}<button className="cancel" onClick={onClose}>AVBRYT</button><button disabled={busy||!fromAccountId||(!isExternal&&fromAccountId===toAccountId)||(isExternal&&!externalRecipient.trim())||!date||!Number.isFinite(parsedAmount)||parsedAmount<=0} onClick={async()=>{setBusy(true);try{await onSave({id:entry?.id||crypto.randomUUID(),type:"transfer",title:title.trim()||(isExternal?externalRecipient.trim():"Överföring"),amount:parsedAmount,category:"Överföring",fromAccountId,toAccountId:isExternal?undefined:toAccountId,externalRecipient:isExternal?externalRecipient.trim():undefined,date,recurrence:recurring?frequency:undefined,status:"paid",paidAt:entry?.paidAt||Date.now(),creatorId:entry?.creatorId||account.uid,creatorName:entry?.creatorName||account.displayName,createdAt:entry?.createdAt||Date.now(),updatedAt:Date.now(),sourceGroupId:entry?.sourceGroupId})}finally{setBusy(false)}}}>{busy?"SPARAR…":entry?"SPARA ÄNDRINGAR":"SPARA ÖVERFÖRING"}</button></footer></section></div>
}
function BudgetCategoryPicker({type,value,onChange}:{type:"expense"|"income";value:string;onChange:(value:string)=>void}){const [open,setOpen]=useState(false),pickerRef=useRef<HTMLDivElement|null>(null);useEffect(()=>{if(!open)return;const close=(event:PointerEvent)=>{if(!pickerRef.current?.contains(event.target as Node))setOpen(false)};document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close)},[open]);return <div ref={pickerRef} className={`budget-category-picker${open?" open":""}`}><button type="button" className="budget-category-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={()=>setOpen(current=>!current)}><span><i>{budgetCategoryIcons[value]}</i><strong>{value}</strong></span><ChevronDown/></button>{open&&<div className="budget-category-menu" role="listbox">{budgetCategories[type].map(option=><button type="button" role="option" aria-selected={option===value} className={option===value?"selected":""} key={option} onClick={()=>{onChange(option);setOpen(false)}}><i>{budgetCategoryIcons[option]}</i><span>{option}</span>{option===value&&<Check/>}</button>)}</div>}</div>}
function BudgetEditor({
  entry,
  initialType="expense",
  settings,
  entries,
  monthKey,
  account,
  onClose,
  onSave,
  onDelete,
}: {
  entry?: BudgetEntry;
  initialType?: "income" | "expense";
  settings: BudgetSettings;
  entries: BudgetEntry[];
  monthKey: string;
  account: Account;
  onClose: () => void;
  onSave: (entry: BudgetEntry) => Promise<void>;
  onDelete?: () => void;
}) {
  const initialBank =
      settings.banks.find((bank) =>
        bank.accounts.some((item) => item.id === entry?.accountId),
      )?.id || settings.banks.find(bank=>bank.accounts.some(item=>item.id===settings.defaultAccountId))?.id ||
      settings.banks[0]?.id ||
      "",
    [bankId, setBankId] = useState(initialBank),
    bankAccounts =
      settings.banks.find((bank) => bank.id === bankId)?.accounts || [],
    [type, setType] = useState<"income" | "expense">(
      entry?.type === "income" ? "income" : entry?.type === "expense" ? "expense" : initialType,
    ),
    [title, setTitle] = useState(entry?.title || ""),
    [amount, setAmount] = useState(entry ? String(entry.amount).replace(".", ",") : ""),
    [category, setCategory] = useState(entry?.category || "Mat"),
    [subcategory, setSubcategory] = useState(
      entry?.subcategory || "Hyra/avgift",
    ),
    [accountId, setAccountId] = useState(
      entry?.accountId || (bankAccounts.some(item=>item.id===settings.defaultAccountId)?settings.defaultAccountId:undefined) || bankAccounts[0]?.id || "",
    ),
    [date, setDate] = useState(entry?.date || calendarDateKey(new Date())),
    [recurring, setRecurring] = useState(Boolean(entry?.recurrence)),
    [frequency, setFrequency] = useState<"monthly" | "weekly">(entry?.recurrence || "monthly"),
    [businessDayAdjustment, setBusinessDayAdjustment] = useState<"" | "previous" | "next">(entry?.businessDayAdjustment || ""),
    [status, setStatus] = useState<"planned" | "paid">(entry?.status || "paid"),
    [autoPay, setAutoPay] = useState(entry?.autoPay === true),
    [note, setNote] = useState(entry?.note || ""),
    [busy, setBusy] = useState(false);
  const accountBalance=(id:string)=>entries.reduce((sum,value)=>value.status==="planned"?sum:value.type==="transfer"?sum+(value.toAccountId===id?value.amount:0)-(value.fromAccountId===id?value.amount:0):(id===""?!value.accountId:value.accountId===id)?sum+(value.type==="income"?value.amount:-value.amount):sum,settings.banks.flatMap(bank=>bank.accounts).find(item=>item.id===id)?.openingBalance||0),accountOptions:BudgetTransferOption[]=[{id:"",bank:"UTAN KONTO",name:"Ej placerat",icon:"💰",balance:accountBalance("")},...settings.banks.flatMap(bank=>bank.accounts.map(item=>({id:item.id,bank:bank.name,name:item.name,icon:budgetAccountIcon(item.icon),balance:accountBalance(item.id)})))];
  useEffect(() => {
    const options = budgetCategories[type];
    if (!options.includes(category as never)) setCategory(options[0]);
  }, [type, category]);
  const parsedAmount = budgetDecimalNumber(amount);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="modal budget-editor">
        <button
          className="modal-x budget-editor-x"
          onClick={onClose}
          aria-label="Stäng"
        >
          <X />
        </button>
        <header>
          <WalletCards />
          <div>
            <small>{entry ? "BUDGETPOST" : "LÄGG TILL"}</small>
            <h2>{entry ? "REDIGERA POST" : "NY BUDGETPOST"}</h2>
          </div>
        </header>
        <div className="budget-type">
          <button
            type="button"
            className={type === "expense" ? "selected expense" : ""}
            onClick={() => setType("expense")}
          >
            − UTGIFT
          </button>
          <button
            type="button"
            className={type === "income" ? "selected income" : ""}
            onClick={() => setType("income")}
          >
            + INKOMST
          </button>
        </div>
        <label>
          VAD GÄLLER DET?
          <input
            autoFocus
            value={title}
            maxLength={80}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={
              type === "income" ? "Till exempel lön" : "Till exempel matbutiken"
            }
          />
        </label>
        <div className="budget-editor-grid budget-primary-fields">
          <label>
            BELOPP (KR)
            <input
              inputMode="decimal"
              value={amount}
              onChange={(event) => {const next=budgetDecimalText(event.target.value);if(next!==null)setAmount(next)}}
              placeholder="0,00"
            />
          </label>
          <label>
            {recurring ? "FÖRSTA DATUM" : "DATUM"}
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
        </div>
        <div className="budget-editor-grid budget-category-fields">
          <div className="budget-category-field"><span>KATEGORI</span><BudgetCategoryPicker type={type} value={category} onChange={setCategory}/></div>
          {type === "expense" && category === "Räkningar" && (
            <label>
              TYP AV RÄKNING
              <select
                value={subcategory}
                onChange={(event) => setSubcategory(event.target.value)}
              >
                {budgetBillTypes.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="budget-entry-account-picker"><BudgetTransferAccountPicker label="KONTO" value={accountId} options={accountOptions} onChange={setAccountId}/></div>
        {type==="expense"&&status==="paid"&&parsedAmount>accountBalance(accountId)&&<p className="budget-balance-warning">⚠ Utgiften är {budgetMoney(parsedAmount-accountBalance(accountId))} större än det beräknade saldot på kontot.</p>}
        <div className="budget-status-picker"><button type="button" className={status==="paid"?"selected":""} onClick={()=>setStatus("paid")}>✓ {type==="income"?"MOTTAGEN":"BETALD"}</button><button type="button" className={status==="planned"?"selected":""} onClick={()=>setStatus("planned")}>◷ {type==="income"?"VÄNTAS":"PLANERAD"}</button></div>
        <label className="budget-recurring">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(event) => setRecurring(event.target.checked)}
          />
          <span>
            <strong>Återkommande post</strong>
            <small>Samma post läggs in automatiskt från valt datum.</small>
          </span>
        </label>
        {recurring&&<label className="budget-frequency">HUR OFTA?<select value={frequency} onChange={event=>setFrequency(event.target.value as "monthly"|"weekly")}><option value="monthly">Varje månad</option><option value="weekly">Varje vecka</option></select><small>{frequency==="weekly"?`Sker varje ${new Intl.DateTimeFormat("sv-SE",{weekday:"long"}).format(new Date(`${date}T12:00:00`))}.`:"Sker samma datum varje månad."}</small></label>}
        {recurring&&type==="income"&&<label className="budget-frequency">OM DATUMET INTE ÄR EN ARBETSDAG<select value={businessDayAdjustment} onChange={event=>setBusinessDayAdjustment(event.target.value as ""|"previous"|"next")}><option value="">Behåll datumet</option><option value="previous">Flytta till föregående arbetsdag</option><option value="next">Flytta till nästa arbetsdag</option></select><small>Tar hänsyn till helger och svenska röda dagar.</small></label>}
        {recurring&&status==="planned"&&<label className="budget-recurring budget-auto-pay"><input type="checkbox" checked={autoPay} onChange={event=>setAutoPay(event.target.checked)}/><span><strong>{type==="income"?"Registrera automatiskt på datumet":"Genomför automatiskt på datumet"}</strong><small>{type==="income"?"Inkomsten räknas som mottagen och saldot ändras automatiskt den dagen.":"Posten räknas som betald och saldot ändras automatiskt den dagen."}</small></span></label>}
        {Boolean(entry?.recurrence) && (
          <p className="budget-series-note">
            Ändringar här gäller hela den återkommande serien.
          </p>
        )}
        <label>
          ANTECKNING <small>(valfritt)</small>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Något att komma ihåg?"
          />
        </label>
        <footer>
          {onDelete && (
            <button className="danger" onClick={onDelete}>
              <Trash2 /> TA BORT
            </button>
          )}
          <button className="cancel" onClick={onClose}>
            AVBRYT
          </button>
          <button
            disabled={
              busy ||
              !title.trim() ||
              !date ||
              !Number.isFinite(parsedAmount) ||
              parsedAmount <= 0
            }
            onClick={async () => {
              setBusy(true);
              try {
                await onSave({
                  id: entry?.id || crypto.randomUUID(),
                  type,
                  title: title.trim(),
                  amount: parsedAmount,
                  category,
                  subcategory:
                    type === "expense" && category === "Räkningar"
                      ? subcategory
                      : "",
                  accountId,
                  date,
                  recurrence: recurring ? frequency : undefined,
                  businessDayAdjustment: recurring && type === "income" ? businessDayAdjustment || undefined : undefined,
                  status,
                  autoPay: recurring && status === "planned" && autoPay,
                  paidAt: status === "paid" ? (entry?.paidAt || Date.now()) : undefined,
                  note: note.trim(),
                  creatorId: entry?.creatorId || account.uid,
                  creatorName: entry?.creatorName || account.displayName,
                  createdAt: entry?.createdAt || Date.now(),
                  updatedAt: Date.now(),
                  sourceGroupId: entry?.sourceGroupId,
                });
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "SPARAR…" : "SPARA"}
          </button>
        </footer>
      </section>
    </div>
  );
}

function MealPlannerPage({events,recipes,lists,privateMode,account,memberships,groups,creating,onCreating,onMode,onSwitchGroup,onSave,onDelete}:{events:CalendarEvent[];recipes:Recipe[];lists:BubbsunList[];privateMode:boolean;account:Account;memberships:Membership[];groups:Record<string,Group>;creating:boolean;onCreating:(value:boolean)=>void;onMode:(value:boolean)=>void;onSwitchGroup:(id:string)=>void;onSave:(event:CalendarEvent)=>Promise<void>;onDelete:(event:CalendarEvent)=>Promise<void>}){
  const [weekOffset,setWeekOffset]=useState(0),[createDate,setCreateDate]=useState(calendarDateKey(new Date())),[viewing,setViewing]=useState<CalendarEvent|null>(null),[editing,setEditingRaw]=useState<CalendarEvent|null>(null),[confirmDelete,setConfirmDelete]=useState<CalendarEvent|null>(null),[deleting,setDeleting]=useState(false),[spaceOpen,setSpaceOpen]=useState(false);
  const setEditing=(value:CalendarEvent|null)=>{if(value)setViewing(value);else setEditingRaw(null)};
  const today=calendarDateKey(new Date()),start=new Date(`${today}T12:00:00`);start.setDate(start.getDate()-((start.getDay()+6)%7)+weekOffset*7);
  const dates=Array.from({length:7},(_,index)=>{const date=new Date(start);date.setDate(date.getDate()+index);return calendarDateKey(date)}),thursday=new Date(start);thursday.setDate(thursday.getDate()+3);const yearStart=new Date(thursday.getFullYear(),0,1),weekNumber=Math.ceil((((thursday.getTime()-yearStart.getTime())/86400000)+yearStart.getDay()+1)/7),months=Array.from(new Set([dates[0],dates[6]].map(value=>new Intl.DateTimeFormat("sv-SE",{month:"long"}).format(new Date(`${value}T12:00:00`))))).join(" / ");
  useEffect(()=>{if(creating)setEditing(null)},[creating]);
  const openNew=(date:string)=>{setCreateDate(date);setEditing(null);onCreating(true)};
  const editor=<>{viewing&&<MealPlanView event={viewing} recipes={recipes} lists={lists} onClose={()=>setViewing(null)} onEdit={()=>{setEditingRaw(viewing);setViewing(null)}} onDelete={()=>setConfirmDelete(viewing)}/>}{(creating||editing)&&<MealPlannerEditor event={editing||undefined} date={editing?.date||createDate} recipes={recipes} lists={lists} account={account} onClose={()=>{setEditingRaw(null);setCreateDate(today);onCreating(false)}} onSave={async event=>{await onSave(event);setEditingRaw(null);setCreateDate(today);onCreating(false)}} onDelete={editing?async()=>setConfirmDelete(editing):undefined}/>} {confirmDelete&&<div className="modal-backdrop meal-plan-delete-confirm"><div className="modal confirm-delete-modal"><Trash2/><h2>TA BORT MÅLTIDEN?</h2><p>“{confirmDelete.title}” tas bort från planeringen. Det går inte att ångra.</p><div className="modal-actions"><button disabled={deleting} onClick={()=>setConfirmDelete(null)}>AVBRYT</button><button className="danger" disabled={deleting} onClick={async()=>{setDeleting(true);try{await onDelete(confirmDelete);setConfirmDelete(null);setViewing(null);setEditingRaw(null);setCreateDate(today);onCreating(false)}finally{setDeleting(false)}}}>{deleting?"TAR BORT…":"TA BORT"}</button></div></div></div>}</>;
  const activeGroup=groups[account.activeGroupId];
  return <section className="content meal-planner-page"><header className="meal-planner-intro"><NotebookPen/><div><h1>VECKANS MÅLTIDER</h1><p>Planera veckans måltider och koppla dem till recept och listor.</p></div><div className="calendar-space-wrap meal-planner-space"><button className="calendar-space-button" onClick={()=>setSpaceOpen(value=>!value)}>{privateMode?<LockKeyhole/>:<GroupIcon id={activeGroup?.iconId}/>}<span><small>{privateMode?"PRIVAT":"GRUPP"}</small><strong>{privateMode?"Bara jag":activeGroup?.name||"Välj grupp"}</strong></span><ChevronDown/></button>{spaceOpen&&<div className="calendar-space-menu"><button className={privateMode?"selected":""} onClick={()=>{onMode(true);setSpaceOpen(false)}}><LockKeyhole/><strong>Privat</strong>{privateMode&&<Check/>}</button>{memberships.map(item=><button key={item.groupId} className={!privateMode&&item.groupId===account.activeGroupId?"selected":""} onClick={()=>{onSwitchGroup(item.groupId);setSpaceOpen(false)}}><GroupIcon id={groups[item.groupId]?.iconId}/><strong>{groups[item.groupId]?.name||"Grupp"}</strong>{!privateMode&&item.groupId===account.activeGroupId&&<Check/>}</button>)}</div>}</div></header><nav className="calendar-week-nav meal-planner-nav"><button aria-label="Föregående vecka" onClick={()=>setWeekOffset(value=>value-1)}><ChevronLeft/></button><strong>Vecka {weekNumber} – {months}</strong><button aria-label="Nästa vecka" onClick={()=>setWeekOffset(value=>value+1)}><ChevronRight/></button></nav><div className="meal-planner-week">{dates.map(date=>{const dayEvents=events.filter(event=>event.date===date).sort((a,b)=>mealTypes.indexOf(a.mealType||"Annat")-mealTypes.indexOf(b.mealType||"Annat"));return <section className={date===today?"today":""} key={date}><header><span><strong>{new Intl.DateTimeFormat("sv-SE",{weekday:"long"}).format(new Date(`${date}T12:00:00`))}</strong><b>{new Intl.DateTimeFormat("sv-SE",{day:"numeric",month:"short"}).format(new Date(`${date}T12:00:00`))}</b></span><button onClick={()=>openNew(date)} aria-label={`Lägg till måltid ${date}`}><Plus/></button></header><div>{dayEvents.map(event=>{const linkedRecipes=(event.linkedRecipeIds||[]).map(id=>recipes.find(recipe=>recipe.id===id)).filter((recipe):recipe is Recipe=>Boolean(recipe)),linkedLists=(event.linkedListIds||[]).map(id=>lists.find(list=>list.id===id)).filter((list):list is BubbsunList=>Boolean(list));return <button className="meal-plan-card" key={event.id} onClick={()=>setEditing(event)}><small>{event.mealType||"Måltid"}</small><strong>{event.title}</strong>{linkedRecipes.length>0&&<span>🍲 {linkedRecipes.map(recipe=>recipe.title).join(" · ")}</span>}{linkedLists.length>0&&<span>🔗 {linkedLists.map(list=>list.name).join(" · ")}</span>}</button>})}{!dayEvents.length&&<button className="meal-plan-empty" onClick={()=>openNew(date)}><Plus/> Planera måltid</button>}</div></section>})}</div>{editor}</section>;
}

function MealPlanView({event,recipes,lists,onClose,onEdit,onDelete}:{event:CalendarEvent;recipes:Recipe[];lists:BubbsunList[];onClose:()=>void;onEdit:()=>void;onDelete:()=>void}){
  const linkedRecipes=(event.linkedRecipeIds||[]).map(id=>recipes.find(recipe=>recipe.id===id)).filter((recipe):recipe is Recipe=>Boolean(recipe));
  const linkedLists=(event.linkedListIds||[]).map(id=>lists.find(list=>list.id===id)).filter((list):list is BubbsunList=>Boolean(list));
  return <div className="modal-backdrop meal-plan-view-backdrop" onMouseDown={click=>{if(click.target===click.currentTarget)onClose()}}><article className="modal meal-plan-view"><button className="modal-x" onClick={onClose}><X/></button><header><NotebookPen/><span><small>{event.mealType||"MÅLTID"}</small><h2>{event.title}</h2><time>{calendarDayLabel(event.date)}</time></span></header>{event.note&&<p className="meal-plan-view-note">{event.note}</p>}{linkedRecipes.length>0&&<section><h3>KOPPLADE RECEPT</h3><div className="meal-plan-view-links">{linkedRecipes.map(recipe=><div key={recipe.id}>{recipe.image?<img src={recipe.image} alt=""/>:<span>🍲</span>}<strong>{recipe.title}</strong></div>)}</div></section>}{linkedLists.length>0&&<section><h3>KOPPLADE LISTOR</h3><div className="meal-plan-view-lists">{linkedLists.map(list=><span key={list.id}>🔗 {list.name}</span>)}</div></section>}<footer><button className="danger" onClick={onDelete}><Trash2/> TA BORT</button><button className="meal-plan-edit" onClick={onEdit}><Pencil/> REDIGERA</button></footer></article></div>;
}

function MealPlannerEditor({event,date,recipes,lists,account,onClose,onSave,onDelete}:{event?:CalendarEvent;date:string;recipes:Recipe[];lists:BubbsunList[];account:Account;onClose:()=>void;onSave:(event:CalendarEvent)=>Promise<void>;onDelete?:()=>Promise<void>}){
  const [title,setTitle]=useState(event?.title||""),[mealType,setMealType]=useState(event?.mealType||"Middag"),[linkedRecipeIds,setLinkedRecipeIds]=useState(event?.linkedRecipeIds||[]),[linkedListIds,setLinkedListIds]=useState(event?.linkedListIds||[]),[note,setNote]=useState(event?.note||""),[busy,setBusy]=useState(false),[saveError,setSaveError]=useState("");const initial=useRef("");const snapshot=JSON.stringify({title,mealType,linkedRecipeIds,linkedListIds,note});if(!initial.current)initial.current=snapshot;const dirty=initial.current!==snapshot,toggle=(values:string[],id:string)=>values.includes(id)?values.filter(value=>value!==id):[...values,id];
  return <div className="modal-backdrop meal-planner-backdrop" onMouseDown={click=>{if(click.target===click.currentTarget&&!dirty)onClose()}}><section className="modal meal-planner-editor"><button className="modal-x" onClick={onClose}><X/></button><NotebookPen/><h2>{event?"REDIGERA MÅLTID":"PLANERA MÅLTID"}</h2><label>DATUM<input type="date" value={date} readOnly/></label><label>MÅLTID<select value={mealType} onChange={change=>setMealType(change.target.value)}>{mealTypes.map(type=><option key={type}>{type}</option>)}</select></label><label>NAMN<input autoFocus value={title} maxLength={80} onChange={change=>setTitle(change.target.value)} placeholder="Till exempel tacos (valfritt)"/></label><fieldset><legend>KOPPLA RECEPT <small>(flera går bra)</small></legend><div className="meal-link-grid">{recipes.map(recipe=><label key={recipe.id}><input type="checkbox" checked={linkedRecipeIds.includes(recipe.id)} onChange={()=>setLinkedRecipeIds(current=>toggle(current,recipe.id))}/>{recipe.image?<img src={recipe.image} alt=""/>:<span>🍲</span>}<strong>{recipe.title}</strong></label>)}</div></fieldset><fieldset><legend>KOPPLA LISTOR <small>(flera går bra)</small></legend><div className="meal-link-grid meal-list-links">{lists.map(list=><label key={list.id}><input type="checkbox" checked={linkedListIds.includes(list.id)} onChange={()=>setLinkedListIds(current=>toggle(current,list.id))}/><span>🔗</span><strong>{list.name}</strong></label>)}</div></fieldset><label>ANTECKNING <small>(valfritt)</small><textarea value={note} onChange={change=>setNote(change.target.value)} placeholder="Något att komma ihåg?"/></label>{saveError&&<p className="meal-planner-save-error" role="alert">{saveError}</p>}<footer>{onDelete&&<button className="danger" onClick={()=>void onDelete()}><Trash2/> TA BORT</button>}<button className="cancel" onClick={onClose}>AVBRYT</button><button disabled={busy} onClick={async()=>{setBusy(true);setSaveError("");const fallbackTitle=recipes.find(recipe=>linkedRecipeIds.includes(recipe.id))?.title||mealType;try{await onSave({id:event?.id||crypto.randomUUID(),title:title.trim()||fallbackTitle,date,category:"meal-plan",mealType,note:note.trim(),linkedRecipeIds,linkedListIds,allDay:true,color:event?.color||account.personalColor||colorOptions[0],creatorId:event?.creatorId||account.uid,creatorName:event?.creatorName||account.displayName,createdAt:event?.createdAt||Date.now(),updatedAt:Date.now(),updatedBy:account.uid})}catch(error){setSaveError(error instanceof Error?`Måltiden kunde inte sparas: ${error.message}`:"Måltiden kunde inte sparas. Försök igen.")}finally{setBusy(false)}}}>{busy?"SPARAR…":event?"SPARA":"LÄGG TILL"}</button></footer></section></div>;
}

function CalendarEventCard({event,lists,members,privateMode,account,onClose,onOpenList,onEdit}:{event:CalendarOccurrence;lists:BubbsunList[];members:Membership[];privateMode:boolean;account:Account;onClose:()=>void;onOpenList:(list:BubbsunList)=>void;onEdit:()=>void}){
  const category=calendarCategory(event.category),creator=privateMode?null:members.find(member=>member.uid===event.creatorId),creatorName=privateMode?account.displayName:(creator?.displayName||event.creatorName),linked=(event.linkedListIds||[]).map(id=>lists.find(list=>list.id===id)).filter((list):list is BubbsunList=>Boolean(list)),eventDate=new Date(`${event.occurrenceDate}T12:00:00`),weekday=new Intl.DateTimeFormat("sv-SE",{weekday:"long"}).format(eventDate),day=eventDate.getDate(),month=new Intl.DateTimeFormat("sv-SE",{month:"long"}).format(eventDate),year=eventDate.getFullYear(),createdLabel=new Intl.DateTimeFormat("sv-SE",{day:"numeric",month:"long",year:"numeric"}).format(new Date(event.createdAt||eventDate)),timeLabel=event.allDay||!event.time?"Hela dagen":event.endTime?`${event.time}–${event.endTime}`:event.time,reminderLabel=event.reminderMinutes===15?"15 minuter innan":event.reminderMinutes===60?"1 timme innan":event.reminderMinutes===720?"12 timmar innan":event.reminderMinutes===1440?"24 timmar innan":"Ingen påminnelse",repeat=event.recurrenceType==="yearly"||Boolean(event.recurrenceDays?.length),displayTitle=calendarDisplayTitle(event,event.occurrenceDate),style={"--event-color":rgbaHex(event.color||account.personalColor||colorOptions[0]),"--creator-color":rgbaHex(privateMode?(account.personalColor||colorOptions[0]):(creator?.color||account.personalColor||colorOptions[0]))} as CSSProperties;
  return <div className="modal-backdrop"><article className={`modal calendar-event-card calendar-event-card-v2${event.category==="birthday"?" birthday":""}`} style={style}>
    <button className="calendar-card-close" aria-label="Stäng" onClick={onClose}><X/></button>
    <header className="calendar-card-hero"><div className="calendar-card-icon">{category.icon||"📅"}</div><div><small>{category.label||"Kalenderpost"}</small><h2>{displayTitle}</h2></div></header>
    <div className="calendar-card-overview"><section className="calendar-card-date"><small>{weekday}</small><b>{day}</b><strong>{month}</strong><span>{year}</span></section><section className="calendar-card-summary"><p><span>{event.allDay?"☀️":"🕒"}</span><strong>{timeLabel}</strong></p><p><Bell/><span><small>PÅMINNELSE</small><strong>{reminderLabel}</strong></span></p>{repeat&&<p><History/><span><small>ÅTERKOMMER</small><strong>{event.recurrenceType==="yearly"?"Varje år":event.recurrenceForever?"För alltid":event.recurrenceUntil?`Till ${event.recurrenceUntil}`:"Ja"}</strong></span></p>}</section></div>
    {event.note&&<section className="calendar-card-note"><small>✎ &nbsp; ANTECKNING</small><p>{event.note}</p></section>}
    {linked.length>0&&<section className="calendar-card-lists"><small>KOPPLADE LISTOR</small>{linked.map(list=><button key={list.id} onClick={()=>onOpenList(list)}><span>🔗</span><strong>{list.name}</strong><ChevronRight/></button>)}</section>}
    <footer className="calendar-card-footer"><p className="calendar-card-creator" style={{borderColor:"var(--creator-color)"}}><UserRound/> Skapad av {creatorName} &nbsp;·&nbsp; {createdLabel}</p><button className="calendar-card-edit" onClick={onEdit}><Pencil/> REDIGERA</button></footer>
  </article></div>
}

function CalendarEditor({event,lists,account,memberships,groups,currentLocation,existing,onClose,onSave,onDelete}:{event:CalendarEvent;lists:BubbsunList[];account:Account;memberships:Membership[];groups:Record<string,Group>;currentLocation:string;existing:boolean;onClose:()=>void;onSave:(event:CalendarEvent,targetLocations:string[],previousLocations:string[])=>Promise<void>;onDelete?:(mode:"single"|"all")=>Promise<void>}){
  const [title,setTitle]=useState(event.title),[date,setDate]=useState(event.date),[time,setTime]=useState(event.time||""),[endTime,setEndTime]=useState(event.endTime||""),[allDay,setAllDay]=useState(event.allDay===true),[category,setCategory]=useState(event.category??""),[birthYear,setBirthYear]=useState(event.birthYear?String(event.birthYear):""),[color,setColor]=useState(event.color||colorOptions[0]),[repeat,setRepeat]=useState(event.recurrenceType==="yearly"||Boolean(event.recurrenceDays?.length)),[repeatDays,setRepeatDays]=useState<number[]>(event.recurrenceDays||[]),[forever,setForever]=useState(event.recurrenceDays?.length?event.recurrenceForever!==false:true),[until,setUntil]=useState(event.recurrenceUntil||""),[note,setNote]=useState(event.note||""),[linkedListIds,setLinkedListIds]=useState<string[]>((event.linkedListIds||[]).slice(0,3)),[reminderMinutes,setReminderMinutes]=useState(event.reminderMinutes||0),[targetLocations,setTargetLocations]=useState<string[]>(event.creatorId===account.uid&&event.locations?.length?event.locations:[currentLocation]),[busy,setBusy]=useState(false),[deleteOpen,setDeleteOpen]=useState(false);
  const weekdayLabels=[[1,"MÅ"],[2,"TI"],[3,"ON"],[4,"TO"],[5,"FR"],[6,"LÖ"],[0,"SÖ"]] as const;
  const setLinkedList=(index:number,value:string)=>setLinkedListIds(current=>{const next=current.slice(0,index);if(value)next[index]=value;return next.slice(0,3)});
  const requestNotifications=async()=>{if(reminderMinutes>0&&"Notification" in window&&Notification.permission==="default")await Notification.requestPermission()};
  return <div className="modal-backdrop"><div className="modal calendar-editor"><button className="calendar-editor-close" aria-label="Stäng" onClick={onClose}><X/></button><CalendarDays/><h2>{existing?"REDIGERA HÄNDELSE":"NY HÄNDELSE"}</h2>
    <label>VAD HÄNDER?<input autoFocus value={title} maxLength={80} onChange={e=>setTitle(e.target.value)} placeholder="Till exempel tandläkaren"/></label>
    <label>KATEGORI<select value={category} onChange={e=>{const next=e.target.value;setCategory(next);if(next==="birthday"){setRepeat(true);setForever(true);setUntil("")}}}>{calendarCategories.map(value=><option key={value.id||"none"} value={value.id}>{value.icon?`${value.icon} `:""}{value.label}</option>)}</select></label>
    {category==="birthday"&&<label className="calendar-birth-year">FÖDELSEÅR <small>(valfritt)</small><input type="number" inputMode="numeric" min="1900" max={Number(date.slice(0,4))||new Date().getFullYear()} value={birthYear} onChange={e=>setBirthYear(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="Till exempel 1990"/><span>🎂 Återkommer automatiskt varje år och visar rätt ålder.</span></label>}
    <label>FÄRG<div className="calendar-color-picker">{colorOptions.map(value=><button type="button" key={value} className={color===value?"selected":""} style={{"--choice-color":rgbaHex(value)} as CSSProperties} onClick={()=>setColor(value)} aria-label="Välj färg"/>)}</div></label>
    <div><label>DATUM<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label className="calendar-all-day"><input type="checkbox" checked={allDay} onChange={e=>setAllDay(e.target.checked)}/><span>HELDAG</span></label></div>
    {!allDay&&<div><label>FRÅN<input type="time" value={time} onChange={e=>setTime(e.target.value)}/></label><label>TILL<input type="time" value={endTime} min={time} onChange={e=>setEndTime(e.target.value)}/></label></div>}
    <section className="calendar-links"><h3>🔗 KOPPLA LISTOR <small>(max 3)</small></h3>{[0,1,2].map(index=>index===0||Boolean(linkedListIds[index-1])?<label key={index}>LISTA {index+1}<select value={linkedListIds[index]||""} onChange={e=>setLinkedList(index,e.target.value)}><option value="">Ingen lista</option>{lists.filter(list=>!linkedListIds.includes(list.id)||linkedListIds[index]===list.id).map(list=><option key={list.id} value={list.id}>{list.name}</option>)}</select></label>:null)}</section>
    <label>🔔 PÅMINNELSE<select value={reminderMinutes} onChange={e=>setReminderMinutes(Number(e.target.value))}><option value={0}>Ingen påminnelse</option><option value={15}>15 minuter innan</option><option value={60}>1 timme innan</option><option value={720}>12 timmar innan</option><option value={1440}>24 timmar innan</option></select></label>
    {category==="birthday"?<section className="calendar-recurrence calendar-birthday-repeat"><strong>↻ ÅTERKOMMER VARJE ÅR</strong><small>Födelsedagar upprepas automatiskt på samma datum.</small></section>:<section className="calendar-recurrence"><label className="calendar-repeat-toggle"><input type="checkbox" checked={repeat} onChange={e=>{const enabled=e.target.checked;setRepeat(enabled);if(enabled&&!repeatDays.length)setRepeatDays([new Date(`${date}T12:00:00`).getDay()])}}/><span>↻ ÅTERKOMMANDE</span></label>{repeat&&<><div className="calendar-weekdays">{weekdayLabels.map(([value,label])=><button type="button" key={value} className={repeatDays.includes(value)?"selected":""} onClick={()=>setRepeatDays(current=>current.includes(value)?current.filter(day=>day!==value):[...current,value])}>{label}</button>)}</div><div className="calendar-repeat-end"><label><input type="radio" checked={forever} onChange={()=>setForever(true)}/> FÖR ALLTID</label><label><input type="radio" checked={!forever} onChange={()=>setForever(false)}/> TILL DATUM</label>{!forever&&<input type="date" min={date} value={until} onChange={e=>setUntil(e.target.value)}/>}</div></>}</section>}
    {event.creatorId===account.uid&&<fieldset className="recipe-location-picker calendar-location-picker"><legend>VISA KALENDERPOSTEN I</legend><p>Samma post kan visas på flera platser. Ändringar synkas överallt.</p><div>{[{id:"private",name:"Privat",icon:"🔒"},...memberships.map(membership=>({id:membership.groupId,name:groups[membership.groupId]?.name||"Grupp",icon:"👥"}))].map(location=><label key={location.id}><input type="checkbox" checked={targetLocations.includes(location.id)} onChange={change=>setTargetLocations(current=>change.target.checked?[...new Set([...current,location.id])]:current.length>1?current.filter(value=>value!==location.id):current)}/><span>{location.icon}</span><strong>{location.name}</strong></label>)}</div></fieldset>}
    <label>ANTECKNING <small>(valfritt)</small><textarea value={note} maxLength={300} onChange={e=>setNote(e.target.value)} placeholder="Något som är bra att komma ihåg…"/></label>
    <div className="calendar-editor-actions">{onDelete&&<button className="calendar-delete" onClick={()=>setDeleteOpen(true)}><Trash2/> TA BORT</button>}<button className="cancel" onClick={onClose}>AVBRYT</button><button disabled={busy||!title.trim()||!date||(!allDay&&Boolean(time&&endTime&&endTime<=time))||(category!=="birthday"&&repeat&&!repeatDays.length)||(category!=="birthday"&&repeat&&!forever&&!until)||(category==="birthday"&&Boolean(birthYear)&&(Number(birthYear)<1900||Number(birthYear)>Number(date.slice(0,4))))} onClick={async()=>{setBusy(true);await requestNotifications();const next:CalendarEvent={...event,title:title.trim(),date,time:allDay?"":time,endTime:allDay?"":endTime,allDay,category,color,recurrenceDays:category==="birthday"?[]:repeat?repeatDays:[],recurrenceForever:category==="birthday"?true:repeat&&forever,recurrenceUntil:category==="birthday"?"":repeat&&!forever?until:"",note:note.trim(),linkedListIds,reminderMinutes,locations:targetLocations,updatedAt:Date.now()};if(category==="birthday"){next.recurrenceType="yearly";if(birthYear)next.birthYear=Number(birthYear);else delete next.birthYear}else{if(repeat)next.recurrenceType="weekly";else delete next.recurrenceType;delete next.birthYear}await onSave(next,targetLocations,event.locations?.length?event.locations:[currentLocation]);setBusy(false)}}>{busy?"SPARAR…":existing?"SPARA":"SKAPA"}</button></div>
    {deleteOpen&&<div className="calendar-delete-confirm"><div><Trash2/><h3>{repeat?"TA BORT ÅTERKOMMANDE POST?":"TA BORT POSTEN?"}</h3><p>{repeat?"Vill du ta bort bara det här tillfället eller hela serien?":"Detta går inte att ångra."}</p>{repeat&&<button onClick={()=>void onDelete?.("single")}>BARA DEN HÄR</button>}<button className="calendar-delete-all" onClick={()=>void onDelete?.("all")}>{repeat?"ALLA ÅTERKOMMANDE":"TA BORT"}</button><button className="calendar-delete-cancel" onClick={()=>setDeleteOpen(false)}>AVBRYT</button></div></div>}
  </div></div>
}

function PeoplePage({
  account,
  group,
  members,
  memberships,
  groups,
  language,
  onSelectGroup,
  onlineUserIds,
}: {
  account: Account;
  group?: Group;
  members: Membership[];
  memberships: Membership[];
  groups: Record<string, Group>;
  language: string;
  onSelectGroup: (groupId: string) => void;
  onlineUserIds: Set<string>;
}) {
  const [groupDialog, setGroupDialog] = useState<"" | "create" | "join">("");
  const [groupMessage, setGroupMessage] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [roleMember, setRoleMember] = useState<Membership | null>(null);
  const [copied, setCopied] = useState(false);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const me = members.find((member) => member.uid === account.uid);
  const role = (me?.role || "").toLowerCase();
  const isBoss =
    account.megaSuperBoss ||
    account.founder ||
    group?.ownerId === account.uid ||
    role.includes("boss") ||
    role.includes("owner");
  useEffect(
    () =>
      group && isBoss
        ? watchJoinRequests(group.id, setJoinRequests)
        : undefined,
    [group?.id, isBoss],
  );
  return (
    <section className="content subpage">
      <div className="content-heading">
        <UserRound />
        <div>
          <h1>ANVÄNDARE & GRUPPER</h1>
          <p>{group?.name || "Mina listor"}</p>
        </div>
      </div>
      <div className="profile-summary">
        <div className="avatar">
          {account.displayName.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h2>{account.displayName}</h2>
          <span>{account.globalTitle || "Bubbsun-medlem"}</span>
        </div>
      </div>
      {group && isBoss && joinRequests.length > 0 && (
        <>
          <h2 className="small-heading">VÄNTANDE GRUPPANSÖKNINGAR</h2>
          <div className="join-request-list">
            {joinRequests.map((request) => (
              <article key={request.uid}>
                <strong>{request.displayName}</strong>
                <span>
                  <button
                    onClick={() =>
                      void decideJoinRequest(
                        group.id,
                        request,
                        true,
                        colorOptions[members.length % colorOptions.length],
                      )
                    }
                  >
                    <Check /> GODKÄNN
                  </button>
                  <button
                    className="danger"
                    onClick={() =>
                      void decideJoinRequest(
                        group.id,
                        request,
                        false,
                        colorOptions[0],
                      )
                    }
                  >
                    <X /> AVSLÅ
                  </button>
                </span>
              </article>
            ))}
          </div>
        </>
      )}
      <h2 className="small-heading">MEDLEMMAR</h2>
      <div className="people-list">
        {members.map((m) => (
          <button
            key={m.uid}
            onClick={() => isBoss && m.uid !== account.uid && setRoleMember(m)}
          >
            <i style={{ background: rgbaHex(m.color) }}>
              {m.displayName.slice(0, 1).toUpperCase()}
            </i>
            <span>
              <strong>
                {m.displayName}
                {m.uid === account.uid ? " (du)" : ""}
              </strong>
              <small>{m.role}</small>
              {m.uid!==account.uid&&<em className={onlineUserIds.has(m.uid)?"person-online":"person-offline"}>{onlineUserIds.has(m.uid)?"ONLINE":"OFFLINE"}</em>}
            </span>
            {account.supporter && m.uid === account.uid ? <b>♥</b> : null}
            {isBoss && m.uid !== account.uid && <UserCog />}
          </button>
        ))}
      </div>
      <h2 className="small-heading">MINA GRUPPER</h2>
      <div className="group-list">
        {memberships.map((m) => (
          <div
            key={m.groupId}
            className={m.groupId===account.activeGroupId?"active":""}
            role="button"
            tabIndex={0}
            aria-current={m.groupId===account.activeGroupId?"true":undefined}
            onClick={()=>onSelectGroup(m.groupId)}
            onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();onSelectGroup(m.groupId)}}}
          >
            <GroupIcon id={groups[m.groupId]?.iconId} />
            <strong>{groups[m.groupId]?.name || "Grupp"}</strong>
            <small>{m.role}</small>
          </div>
        ))}
      </div>
      {group?.joinCode && (
        <div className="code-card">
          <small>GRUPPKOD</small>
          <span>
            <strong>{group.joinCode}</strong>
            <button
              aria-label="Kopiera gruppkod"
              onClick={async () => {
                await navigator.clipboard.writeText(group.joinCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}
            >
              {copied ? <Check /> : <Copy />}
            </button>
          </span>
          {copied && <em>Gruppkoden är kopierad!</em>}
        </div>
      )}
      <div className="group-actions">
        <button onClick={() => setGroupDialog("create")}>
          <Plus /> SKAPA GRUPP
        </button>
        <button onClick={() => setGroupDialog("join")}>
          <Users /> GÅ MED
        </button>
        {group && me && group.ownerId !== account.uid && (
          <button
            className="danger"
            onClick={async () => {
              if (!window.confirm(`Vill du lämna ${group.name}?`)) return;
              const next =
                memberships.find((item) => item.groupId !== group.id)
                  ?.groupId || "";
              await leaveGroup(account.uid, group.id, next);
            }}
          >
            <LogOut /> LÄMNA GRUPP
          </button>
        )}
      </div>
      {groupMessage && <p className="success-note">{groupMessage}</p>}
      <div className="profile-group-actions">
        <button onClick={() => setProfileOpen(true)}>
          <Pencil /> REDIGERA MIN PROFIL
        </button>
        {group && isBoss && (
          <button onClick={() => setGroupOpen(true)}>
            <Pencil /> REDIGERA GRUPP
          </button>
        )}
      </div>
      {profileOpen && (
        <ProfileEditor
          account={account}
          membership={me}
          members={members}
          group={group}
          onClose={() => setProfileOpen(false)}
        />
      )}
      {groupOpen && group && (
        <GroupEditor group={group} onClose={() => setGroupOpen(false)} />
      )}
      {roleMember && group && (
        <div className="modal-backdrop">
          <div className="modal role-modal">
            <h2>HANTERA MEDLEM</h2>
            <p>{roleMember.displayName}</p>
            <div className="role-actions">
              <button
                className={roleMember.role.toLowerCase()==="member"?"bubbsun-action-confirm":"bubbsun-action-neutral"}
                onClick={async () => {
                  const transfer =
                    roleMember.role.toLowerCase() === "boss" &&
                    group.ownerId === account.uid;
                  if (transfer) {
                    const message =
                      language === "en"
                        ? "Make this member the group Owner? You will become a Boss after the transfer."
                        : "Gör denna medlem till gruppens Owner? Du blir Boss efter ägarbytet.";
                    if (!window.confirm(message)) return;
                    await transferGroupOwnership(
                      group.id,
                      group.ownerId,
                      roleMember.uid,
                    );
                  } else
                    await updateMembership(group.id, roleMember.uid, {
                      role: "boss",
                    });
                  setRoleMember(null);
                }}
              >
                {roleMember.role.toLowerCase() === "boss" &&
                group.ownerId === account.uid ? (
                  <>
                    GÖR TILL
                    <br />
                    OWNER
                  </>
                ) : (
                  <>
                    GÖR TILL
                    <br />
                    BOSS
                  </>
                )}
              </button>
              <button
                className={roleMember.role.toLowerCase()==="member"?"bubbsun-action-neutral":"bubbsun-action-confirm"}
                onClick={async () => {
                  await updateMembership(group.id, roleMember.uid, {
                    role: "member",
                  });
                  setRoleMember(null);
                }}
              >
                GÖR TILL
                <br />
                MEDLEM
              </button>
              {group.ownerId !== roleMember.uid && (
                <button
                  className="danger bubbsun-action-danger role-remove-member"
                  onClick={async () => {
                    if (
                      !window.confirm(
                        `Ta bort ${roleMember.displayName} från gruppen?`,
                      )
                    )
                      return;
                    await removeGroupMember(group.id, roleMember.uid);
                    setRoleMember(null);
                  }}
                >
                  <Trash2 /> <span>TA BORT MEDLEM</span>
                </button>
              )}
            </div>
            <button className="role-close" onClick={() => setRoleMember(null)}>
              STÄNG
            </button>
          </div>
        </div>
      )}
      {groupDialog === "create" && (
        <div className="modal-backdrop">
          <form
            className="modal"
            onSubmit={async (event) => {
              event.preventDefault();
              const name = String(
                new FormData(event.currentTarget).get("name") || "",
              );
              if (name.trim()) {
                await createGroup(
                  account,
                  name,
                  "group_home",
                  colorOptions[0],
                  colorOptions[Math.min(memberships.length, 11)],
                );
                setGroupMessage("Gruppen är skapad!");
                setGroupDialog("");
              }
            }}
          >
            <h2>SKAPA GRUPP</h2>
            <input
              name="name"
              autoFocus
              maxLength={40}
              placeholder="Gruppens namn"
            />
            <p>Du blir gruppens SuperBoss och får en unik gruppkod.</p>
            <div>
              <button type="button" className="cancel" onClick={() => setGroupDialog("")}>
                AVBRYT
              </button>
              <button>SKAPA</button>
            </div>
          </form>
        </div>
      )}
      {groupDialog === "join" && (
        <div className="modal-backdrop">
          <form
            className="modal"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                await requestToJoin(
                  account,
                  String(new FormData(event.currentTarget).get("code") || ""),
                );
                setGroupMessage(
                  "Förfrågan skickad. En boss måste godkänna dig innan du väljer färg.",
                );
                setGroupDialog("");
              } catch (error) {
                setGroupMessage(
                  error instanceof Error
                    ? error.message
                    : "Kunde inte skicka förfrågan.",
                );
                setGroupDialog("");
              }
            }}
          >
            <h2>GÅ MED I GRUPP</h2>
            <input name="code" autoFocus placeholder="ABCD-EFGH" />
            <p>Efter godkännande väljer du en färg som är ledig i gruppen.</p>
            <div>
              <button type="button" className="cancel" onClick={() => setGroupDialog("")}>
                AVBRYT
              </button>
              <button>SKICKA</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function SettingsPage({
  account,
  themeId,
  language,
  onTheme,
  onLanguage,
  onPage,
}: {
  account: Account;
  themeId: string;
  language: string;
  onTheme: (id: string) => void;
  onLanguage: (id: string) => void;
  onPage: (page: Page) => void;
}) {
  const [showLanguages, setShowLanguages] = useState(false);
  const languages = [
    { id: "sv", label: "Svenska" },
    { id: "en", label: "English" },
    { id: "fi", label: "Suomi" },
    { id: "tlh", label: "Klingon" },
    { id: "de", label: "Deutsch" },
    { id: "es", label: "Español" },
    { id: "fr", label: "Français" },
    { id: "it", label: "Italiano" },
    { id: "pl", label: "Polski" },
    { id: "nl", label: "Nederlands" },
  ];
  return (
    <section className="content subpage">
      <div className="content-heading">
        <Settings />
        <div>
          <h1>INSTÄLLNINGAR</h1>
          <p>Webbappens inställningar</p>
        </div>
      </div>
      <div className="settings-quick-row">
        <button onClick={() => setShowLanguages(!showLanguages)}>
          🌍{" "}
          <span>
            SPRÅK · {languages.find((item) => item.id === language)?.label}
          </span>
          <ChevronDown className={showLanguages ? "turn" : ""} />
        </button>
        <button onClick={() => onPage("support")}>
          ♥ <span>{account.supporter ? "SUPPORTER" : "STÖD BUBBSUN"}</span>
          <ChevronRight />
        </button>
      </div>
      {showLanguages && (
        <div className="settings-card language-card">
          <div className="language-grid">
            {languages.map((item) => (
              <button
                key={item.id}
                className={language === item.id ? "selected" : ""}
                onClick={() => onLanguage(item.id)}
              >
                <span className={`flag flag-${item.id}`}>
                  {item.id === "tlh" ? "🖖" : ""}
                </span>
                {item.label}
                {language === item.id && <Check />}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="settings-card theme-settings">
        <h2>TEMA · {themes.find((theme) => theme.id === themeId)?.name}</h2>
        <div className="theme-grid">
          {themes.map((theme) => {
            const locked = theme.supporter && !account.supporter;
            return (
              <button
                title={theme.name}
                aria-label={`${theme.name}${theme.supporter ? " · Supporter" : ""}`}
                key={theme.id}
                className={`${themeId === theme.id ? "selected" : ""} ${theme.supporter ? "supporter-theme" : ""}`}
                disabled={locked}
                onClick={() => onTheme(theme.id)}
              >
                <img src={`${import.meta.env.BASE_URL}assets/android/${theme.icon}`} alt="" />
                <span className="theme-choice-name">{theme.name}</span>
                {themeId === theme.id && <Check />}
                {theme.supporter && (
                  <b className="supporter-theme-badge">♥ SUPPORTER</b>
                )}
                {locked && <small>🔒</small>}
              </button>
            );
          })}
        </div>
      </div>
      <InstallLauncher place="settings" />
      <div className="settings-card">
        <h2>MER</h2>
        <div className="settings-links">
          <button onClick={() => onPage("help")}>HJÄLP & GUIDER</button>
          <button onClick={() => onPage("privacy")}>
            INTEGRITET & MOLNDATA
          </button>
          <button onClick={() => onPage("versions")}>
            VERSIONER & NYHETER
          </button>
        </div>
      </div>
    </section>
  );
}

function AboutSectionHeader({active,onPage,title,subtitle}:{active:"about"|"versions"|"help"|"support";onPage:(page:Page)=>void;title:string;subtitle:string}) {
  const heroIcon=active==="versions"?<History/>:active==="help"?<BookOpen/>:active==="support"?<Heart/>:<Info/>;
  return <>
    <header className="about-hero">
      <span className="about-hero-icon">{heroIcon}</span>
      <div><small>BAKOM LISTORNA</small><h1>{title}</h1><p>{subtitle}.</p></div>
      <strong>BUBBSUN <b>v{bubbsunVersion}</b></strong>
    </header>
    <nav className="about-tabs" aria-label="Om Bubbsun">
      <button className={active==="about"?"selected":""} aria-current={active==="about"?"page":undefined} onClick={()=>onPage("about")}><Info/> OM OSS</button>
      <button className={active==="versions"?"selected":""} aria-current={active==="versions"?"page":undefined} onClick={()=>onPage("versions")}><History/> NYHETER</button>
      <button className={active==="help"?"selected":""} aria-current={active==="help"?"page":undefined} onClick={()=>onPage("help")}><BookOpen/> HJÄLP</button>
      <button className={active==="support"?"selected":""} aria-current={active==="support"?"page":undefined} onClick={()=>onPage("support")}><Heart/> STÖD</button>
    </nav>
  </>;
}

function SupportPage({
  account,
  onActivate,
  onSave,
  onPage,
}: {
  account: Account;
  onActivate: () => Promise<void>;
  onSave: (values: Record<string, unknown>) => void;
  onPage: (page: Page) => void;
}) {
  const titles = [
      { id: "none", label: "Ingen" },
      { id: "lifetime", label: "♥ Lifetime Supporter" },
      { id: "royal", label: "♛ LIFETIME SUPPORTER ♛" },
      { id: "band", label: "✦ SUPPORTER ✦" },
      { id: "signature", label: "Lifetime Supporter ♥" },
      { id: "founding", label: "♥ FOUNDING SUPPORTER" },
      { id: "cosmic", label: "✧ COSMIC SUPPORTER ✧" },
    ],
    [activating, setActivating] = useState(false),
    [activationError, setActivationError] = useState("");
  const activate = async () => {
    setActivating(true);
    setActivationError("");
    try {
      await onActivate();
    } catch (error) {
      console.error("Supporter activation failed", error);
      setActivationError("Kunde inte aktivera Supporter. Försök igen.");
    } finally {
      setActivating(false);
    }
  };
  return (
    <section className="content subpage about-page about-section-page">
      <AboutSectionHeader active="support" onPage={onPage} title="STÖD BUBBSUN" subtitle="Supporter, Facebook och extra mycket hjärta" />
      <div className="support-hero">
        <div className="love-medallion">♥</div>
        <i>♥</i>
        <i>♥</i>
        <i>♥</i>
        <h2>
          {account.supporter
            ? "TACK FÖR ATT DU ÄR DU! 💗"
            : "BLI EN DEL AV BUBBSUN-HJÄRTAT"}
        </h2>
        <h3>
          {account.supporter
            ? "Ditt stöd betyder mer än du anar."
            : "Hjälp Bubbsun att fortsätta växa."}
        </h3>
        <p>
          Du hjälper Bubbsun att leva vidare, utvecklas och hålla familjens
          listor synkade. Tack för att du gör allt detta möjligt.
        </p>
        {account.supporter && (
          <strong className="best-badge">♥ DU ÄR BÄST ♥</strong>
        )}
        {!account.supporter && (
          <button disabled={activating} onClick={() => void activate()}>
            {activating ? "AKTIVERAR…" : "AKTIVERA GRATIS SUPPORTER"}
          </button>
        )}
        {activationError && <div className="error-box">{activationError}</div>}
      </div>
      {account.supporter && (
        <div className="settings-card supporter-controls">
          <h2>SUPPORTERINSTÄLLNINGAR</h2>
          <p>Välj dekorationen som visas vid Bubbsun-loggan.</p>
          {titles.map((item) => (
            <button
              key={item.id}
              data-title={item.id}
              className={
                (account.supporterTitle || "lifetime") === item.id
                  ? "selected"
                  : ""
              }
              onClick={() => onSave({ supporterTitle: item.id })}
            >
              {item.label}
              {(account.supporterTitle || "lifetime") === item.id && <Check />}
            </button>
          ))}
          <label className="switch-row">
            <span>
              <strong>Fancy Glow</strong>
              <small>Mjukt sken runt Bubbsun-loggan.</small>
            </span>
            <input
              className="glow-color-picker"
              type="color"
              aria-label="Välj färg på Fancy Glow"
              value={account.supporterGlowColor || "#ffb532"}
              onChange={(event) =>
                onSave({ supporterGlowColor: event.target.value })
              }
            />
            <input
              className="glow-toggle"
              type="checkbox"
              checked={account.supporterGlow !== false}
              onChange={(event) =>
                onSave({ supporterGlow: event.target.checked })
              }
            />
          </label>
        </div>
      )}
      <div className="support-benefits">
        {[
          "Kosmiskt, Hjärtligt och Gotiskt tema",
          "Exklusiva listikoner och färger",
          "Supportertitel vid Bubbsun-loggan",
          "Fancy Glow runt loggan",
          "Founding Supporter-märke",
        ].map((item) => (
          <div key={item}>
            <Check />
            {item}
          </div>
        ))}
      </div>
      <a
        className="facebook-button"
        href="https://www.facebook.com/profile.php?id=61592148376494"
        target="_blank"
        rel="noreferrer"
      >
        <b>f</b>
        <span>
          <small>Follow us on</small>
          <strong>Facebook</strong>
        </span>
      </a>
    </section>
  );
}

function HelpPage({ onPage }: { onPage: (page: Page) => void }) {
  const guides = [
    {
      icon: "🔒",
      title: "Mina listor eller gruppens listor?",
      intro: "Välj vem som ska kunna se listan.",
      steps: [
        "Mina listor är bara dina. Ingen annan kan se dem.",
        "Grupper visar listor som alla i den valda gruppen kan använda.",
        "Byt mellan Mina listor och Grupper med knapparna ovanför listorna.",
        "Dina egna listor följer med när du loggar in på en annan telefon eller dator.",
      ],
    },
    {
      icon: "📝",
      title: "Skapa en ny lista",
      intro: "Till exempel Inköp, Att göra eller Packlista.",
      steps: [
        "Tryck på plusknappen uppe till höger.",
        "Skriv vad listan ska heta.",
        "Välj en färg och en bild som gör listan lätt att känna igen.",
        "Tryck på Spara.",
      ],
    },
    {
      icon: "➕",
      title: "Lägg till och bocka av saker",
      intro: "Sakerna i en lista kallas poster.",
      steps: [
        "Öppna listan.",
        "Skriv vad du vill lägga till i rutan Namn.",
        "Skriv mängd om du vill, till exempel 2 paket. Den rutan får lämnas tom.",
        "Tryck på bocken för att lägga till.",
        "Tryck i den lilla rutan vid en post när den är klar. Den flyttas till Klart.",
      ],
    },
    {
      icon: "🔍",
      title: "Hitta och ordna poster",
      intro: "Bra när listan börjar bli lång.",
      steps: [
        "Skriv i Sök i listan för att snabbt hitta en post.",
        "Dra i handtaget med sex punkter för att ändra ordningen.",
        "Tryck på samma handtag för att öppna menyn för posten.",
        "Där kan du flytta posten till en annan lista eller ta bort den.",
      ],
    },
    {
      icon: "⚙️",
      title: "Hantera en hel lista",
      intro: "Tryck på reglageknappen uppe till höger när listan är öppen.",
      steps: [
        "Redigera lista ändrar namn, färg och bild.",
        "Flytta poster låter dig markera flera saker och flytta dem tillsammans.",
        "Ta bort poster låter dig markera flera saker och radera dem tillsammans.",
        "När du tar bort något viktigt får du först en fråga så att det inte sker av misstag.",
      ],
    },
    {
      icon: "🔔",
      title: "Följ en grupplista och få notiser",
      intro: "Få veta när någon annan ändrar listan.",
      steps: [
        "Öppna en lista som hör till en grupp.",
        "Tryck på reglageknappen uppe till höger och välj Följ lista.",
        "Tillåt notiser om telefonen eller webbläsaren frågar.",
        "Du får en notis när någon annan ändrar listan medan Bubbsun är öppet.",
        "Välj Sluta följa lista om du inte vill ha fler notiser.",
      ],
    },
    {
      icon: "📌",
      title: "Pinna en privat lista överst",
      intro: "Ha en viktig egen lista nära till hands.",
      steps: [
        "Gå till Mina listor.",
        "Tryck på handtaget med sex punkter på listkortet.",
        "Välj Pinna överst.",
        "Den pinnade listan visas överst även när du tittar på en grupp. Bara du ser den där.",
      ],
    },
    {
      icon: "👨‍👩‍👧‍👦",
      title: "Skapa eller gå med i en grupp",
      intro: "En grupp kan vara familjen, arbetet eller vännerna.",
      steps: [
        "Öppna menyn och välj Användare & grupper.",
        "Välj Skapa grupp om du vill starta en ny grupp.",
        "Välj Gå med och skriv gruppkoden om någon har bjudit in dig.",
        "En ansvarig i gruppen måste godkänna din ansökan innan du kommer in.",
      ],
    },
    {
      icon: "👑",
      title: "För den som ansvarar för en grupp",
      intro: "Ägaren och gruppens bossar har extra val.",
      steps: [
        "Väntande ansökningar visas på sidan Användare & grupper.",
        "Tryck Godkänn för att släppa in personen eller Avslå för att säga nej.",
        "Tryck på en medlem för att ändra personens roll eller ta bort personen.",
        "Ägaren kan göra en boss till ny ägare. Ägaren måste lämna över gruppen innan hen själv kan lämna den.",
      ],
    },
    {
      icon: "🚪",
      title: "Lämna en grupp",
      intro: "Du behåller alltid dina egna privata listor.",
      steps: [
        "Öppna Användare & grupper.",
        "Tryck Lämna grupp och svara ja på frågan.",
        "Gruppens listor försvinner då från ditt konto, men finns kvar för de andra medlemmarna.",
        "Om du äger gruppen måste du först göra någon annan till ägare.",
      ],
    },
    {
      icon: "🎨",
      title: "Färg, språk och tema",
      intro: "Gör Bubbsun lätt och trevlig att använda.",
      steps: [
        "Öppna menyn och välj Inställningar.",
        "Välj Språk för att byta språk.",
        "Välj Tema för att byta färger och utseende.",
        "Din egen medlemsfärg visar vem som har lagt till olika saker i gruppens listor.",
      ],
    },
    {
      icon: "☁️",
      title: "Sparas allt automatiskt?",
      intro: "Ja. Du behöver ingen särskild sparaknapp för vanliga ändringar.",
      steps: [
        "Listor och ändringar sparas automatiskt när du är inloggad.",
        "Samma innehåll visas när du loggar in med samma Google-konto på en annan enhet.",
        "Du behöver internet för att hämta och spara de senaste ändringarna.",
        "Mina listor är privata. Gruppens listor syns bara för gruppens medlemmar.",
      ],
    },
    {
      icon: "📒", title: "Skriv en anteckning", intro: "Spara text som du vill komma ihåg.",
      steps: ["Öppna menyn och tryck på Anteckningar.", "Välj Privat om bara du ska läsa. Välj en grupp om ni ska läsa tillsammans.", "Tryck på plus, skriv en rubrik och din text.", "Tryck på Spara. Du kan öppna anteckningen igen och ändra den när du vill."],
    },
    {
      icon: "📅", title: "Lägg något i kalendern", intro: "Kom ihåg en dag, tid eller händelse.",
      steps: ["Öppna Kalender i menyn.", "Tryck på plus och skriv vad som ska hända.", "Välj datum. Lägg till tid och plats om du vill.", "Välj Privat eller en grupp och tryck på Spara."],
    },
    {
      icon: "🍽️", title: "Planera mat för veckan", intro: "Bestäm vad ni ska äta, en dag i taget.",
      steps: ["Öppna Matplanering i menyn.", "Välj veckan du vill planera.", "Tryck på en dag och skriv maten eller välj ett sparat recept.", "Ändringen sparas. I en grupp ser alla samma matplanering."],
    },
    {
      icon: "🥘", title: "Spara och dela ett recept", intro: "Ha ingredienser och steg på samma plats.",
      steps: ["Öppna Recept och tryck på plus.", "Skriv namn, ingredienser och hur man gör. Lägg till en bild om du vill.", "Välj kostmärkning, till exempel laktosfritt, när det passar.", "Spara receptet. Välj Dela om andra ska kunna öppna receptlänken."],
    },
    {
      icon: "💰", title: "Kom igång med budgeten", intro: "Berätta vilka konton och pengar du har.",
      steps: ["Öppna Budget och sedan budgetens inställningar.", "Lägg till din bank och dina konton. Saldot när du börjar skrivs bara en gång.", "Lägg till en inkomst när pengar kommer in och en utgift när pengar går ut.", "En överföring flyttar pengar mellan dina konton. Den är inte en ny inkomst eller utgift."],
    },
    {
      icon: "🔁", title: "Pengar som återkommer", intro: "Bra för lön, hyra och veckovisa överföringar.",
      steps: ["Skapa en inkomst, utgift eller överföring.", "Välj Återkommande och hur ofta den ska hända.", "Välj Planerad om du vill godkänna den själv. Välj automatisk om Bubbsun ska registrera den på dagen.", "Om en månad saknar dag 31 används månadens sista dag. För inkomster kan du välja närmaste arbetsdag."],
    },
    {
      icon: "🔗", title: "Dela ett enda konto med en grupp", intro: "Samma konto kan synas privat och i gruppen.",
      steps: ["Öppna budgetens kontoinställningar.", "Välj just kontot som ska delas och länka det till gruppen.", "Det är fortfarande ett enda konto. Saldo och poster ändras på båda platserna.", "Tryck på den röda brutna länken vid kontot när du vill sluta dela det."],
    },
    {
      icon: "💬", title: "Skicka ett meddelande", intro: "Prata med en annan person i Bubbsun.",
      steps: ["Öppna Meddelanden i menyn.", "Välj personen du vill skriva till.", "Skriv meddelandet och tryck på skicka.", "En siffra vid klockan visar när något nytt väntar på dig."],
    },
    {
      icon: "🧹", title: "Rensa eller börja om", intro: "Gör detta bara när du verkligen vill ta bort något.",
      steps: ["Öppna Inställningar och läs noga vad knappen tar bort.", "Nollställ kontopengar tar bort saldon och budgetposter, men låter övrigt innehåll vara kvar.", "Återställ allt tar bort mycket mer och frågar två gånger innan något händer.", "Det som har raderats kan normalt inte hämtas tillbaka."],
    },
  ];
  const [open, setOpen] = useState("");
  const [query, setQuery] = useState("");
  const visibleGuides = guides.filter((guide) =>
    [guide.title, guide.intro, ...guide.steps].join(" ").toLocaleLowerCase("sv-SE").includes(query.trim().toLocaleLowerCase("sv-SE")),
  );
  return (
    <section className="content subpage help-page about-page about-section-page">
      <AboutSectionHeader active="help" onPage={onPage} title="HJÄLP & GUIDER" subtitle="Tryck, läs och gör ett steg i taget" />
      <div className="help-welcome">
        <span>👋</span>
        <div>
          <h2>Välkommen till Bubbsun!</h2>
          <p>
            Här förklaras hela Bubbsun med korta ord. Sök efter det du vill göra
            eller tryck på en fråga.
          </p>
        </div>
      </div>
      <div className="help-quick">
        <h2>KOM IGÅNG PÅ EN MINUT</h2>
        <ol>
          <li>
            <b>Välj plats:</b> Mina listor är privata. Grupper delas med andra.
          </li>
          <li>
            <b>Skapa lista:</b> Tryck på plusknappen.
          </li>
          <li>
            <b>Lägg till:</b> Öppna listan, skriv en sak och tryck på bocken.
          </li>
          <li>
            <b>Klart:</b> Bocka av saken när den är färdig.
          </li>
        </ol>
      </div>
      <label className="help-search">
        <Search aria-hidden="true" />
        <span>Sök efter hjälp</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Till exempel budget, recept eller grupp" />
        {query && <button type="button" aria-label="Töm sökningen" onClick={() => setQuery("")}><X /></button>}
      </label>
      <h2 className="help-all-title">ALLA GUIDER</h2>
      <div className="guide-list help-guide-list">
        {visibleGuides.map((guide) => {
          const active = open === guide.title;
          return (
            <button
              type="button"
              key={guide.title}
              className={active ? "open" : ""}
              aria-expanded={active}
              onClick={() => setOpen(active ? "" : guide.title)}
            >
              <span className="help-guide-head">
                <i>{guide.icon}</i>
                <span>
                  <strong>{guide.title}</strong>
                  <small>{guide.intro}</small>
                </span>
                <ChevronDown className={active ? "turn" : ""} />
              </span>
              {active && (
                <ol>
                  {guide.steps.map((step, index) => (
                    <li key={step}>
                      <b>{index + 1}</b>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </button>
          );
        })}
        {visibleGuides.length === 0 && <div className="help-empty"><span>🤔</span><strong>Jag hittade ingen sådan hjälp</strong><small>Prova ett enklare ord, till exempel ”pengar”, ”lista” eller ”recept”.</small></div>}
      </div>
      <div className="help-last-note">
        <strong>Hittar du inte svaret?</strong>
        <span>
          Öppna menyn, välj Om och sedan Rapportera problem eller Skicka
          förslag.
        </span>
      </div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <section className="content subpage">
      <div className="content-heading">
        <LockKeyhole />
        <div>
          <h1>INTEGRITET & MOLNDATA</h1>
          <p>Så används dina uppgifter</p>
        </div>
      </div>
      {[
        [
          "Vad som sparas",
          "Google-kontots unika ID, visningsnamn, vald färg, gruppmedlemskap, notisinställningar, de senaste 10 besökstidpunkterna samt delade och privata listor.",
        ],
        [
          "Varför informationen behövs",
          "För inloggning, synkning mellan enheter, gruppbehörigheter och valda listnotiser.",
        ],
        [
          "Privata listor",
          "Privata listor synkas via Firebase mellan dina enheter och kan bara läsas och ändras av ditt inloggade konto.",
        ],
        [
          "Kontroll över data",
          "Du kan sluta följa listor, lämna grupper och logga ut. Gruppägaren ansvarar för gruppens gemensamma data.",
        ],
        [
          "Administratörsstatistik",
          "Administratörens användaröversikt visar endast antal listor, poster, anteckningar, kalenderposter, grupper och följningar samt de senaste 10 besökstidpunkterna – aldrig namn eller innehåll från dina listor och anteckningar.",
        ],
      ].map(([title, body]) => (
        <div className="info-card" key={title}>
          <h2>{title}</h2>
          <p>{body}</p>
        </div>
      ))}
    </section>
  );
}

function FeedbackPage({
  uid,
  language,
  themeId,
}: {
  uid: string;
  language: string;
  themeId: string;
}) {
  const [kind, setKind] = useState<"problem" | "suggestion">("problem"),
    [category, setCategory] = useState("Något fungerar inte"),
    [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [sent, setSent] = useState("");
  const send = async () => {
    if (!title.trim() || !description.trim()) return;
    const id = await createReport(
      uid,
      kind,
      category,
      title,
      description,
      language,
      themeId,
    );
    setSent(id);
  };
  if (sent)
    return (
      <section className="content subpage thank-page">
        <span>♥</span>
        <h1>TACK!</h1>
        <p>Din rapport är sparad i Bubbsun.</p>
        <code>{sent}</code>
      </section>
    );
  return (
    <section className="content subpage">
      <div className="content-heading">
        <span className="heading-emoji">🐞</span>
        <div>
          <h1>BUGGAR & FÖRSLAG</h1>
          <p>Hjälp oss förbättra Bubbsun</p>
        </div>
      </div>
      <div className="feedback-tabs">
        <button
          className={kind === "problem" ? "selected" : ""}
          onClick={() => setKind("problem")}
        >
          RAPPORTERA PROBLEM
        </button>
        <button
          className={kind === "suggestion" ? "selected" : ""}
          onClick={() => setKind("suggestion")}
        >
          SKICKA FÖRSLAG
        </button>
      </div>
      <div className="feedback-form">
        <label>
          Typ
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {(kind === "problem"
              ? [
                  "Krasch",
                  "Något fungerar inte",
                  "Utseende/layout",
                  "Språk",
                  "Tema/supporter",
                  "Uppdatering/installation",
                  "Annat",
                ]
              : [
                  "Ny funktion",
                  "Design",
                  "Tema",
                  "Ikoner/färger",
                  "Statistik",
                  "Supporter",
                  "Språk",
                  "Annat",
                ]
            ).map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Rubrik"
          maxLength={80}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beskriv så tydligt du kan…"
          maxLength={2000}
        />
        <button onClick={() => void send()}>SKICKA</button>
      </div>
    </section>
  );
}

function VersionsPage({ onPage }: { onPage: (page: Page) => void }) {
  const milestones=[
    {version:bubbsunVersion,eyebrow:"JUST NU",title:"Bubbsun blir tydligare",icon:"✨",tone:"current",text:"Budgeten har blivit smartare, receptsidorna finare och Om, Nyheter, Hjälp och Stöd hör nu tydligt ihop.",points:["Enklare hjälp med sökning","Tydligare delade budgetkonton","Förfinade recept och gemensamma informationsflikar"]},
    {version:"0.900",eyebrow:"ALMOST DONE EDITION",title:"Recepten flyttar in",icon:"🥘",tone:"berry",text:"Bubbsun växte från listor till en större plats för vardagen.",points:["Kokbok, receptsökning och offentliga recept","Kostmärkningar, utskrift och ingredienslistor","Matplanering och direktmeddelanden"]},
    {version:"0.800",eyebrow:"VARDAGEN VÄXER",title:"Fler saker än listor",icon:"📒",tone:"blue",text:"Gränssnittet byggdes om och nya vardagsverktyg fick egna tydliga platser.",points:["Anteckningar och nya specialiserade listor","Snabbare gruppbyte och tydligare medlemsvyer","Stabilare sparning, fler ikoner och bättre mobilstöd"]},
    {version:"0.700",eyebrow:"WEB EDITION",title:"Samma Bubbsun överallt",icon:"🌐",tone:"green",text:"Android-appen blev ett lätt skal runt webbappen.",points:["Samma listor på Android, dator och iPhone","Webbuppdateringar utan ny appinstallation","Google-inloggning och Firebase-synkning"]},
    {version:"0.600",eyebrow:"FAMILY EXPANSION",title:"Riktiga grupper",icon:"👨‍👩‍👧‍👦",tone:"sun",text:"Bubbsun fick ett helt gruppsystem för familjer, vänner och andra små gäng.",points:["Flera grupper per konto","Ägare, bossar, medlemmar och ansökningar","Följning, notiser och gruppadministration"]},
    {version:"0.500",eyebrow:"TOGETHER EDITION",title:"Bubbsun tillsammans",icon:"🤝",tone:"plum",text:"Den första stora molnversionen gjorde listorna gemensamma på riktigt.",points:["Google-inloggning och realtidssynkning","Privata och delade listor","Gruppkod, roller och säker flytt av gamla listor"]},
  ];
  return (
    <section className="content subpage about-page about-section-page versions-page">
      <AboutSectionHeader active="versions" onPage={onPage} title="VERSIONER & NYHETER" subtitle="Nytt, ändrat och lagat i Bubbsun" />
      <section className="version-intro"><span>✦</span><div><small>BUBBSUNS RESA</small><h2>FRÅN EN LISTA TILL HELA VARDAGEN</h2><p>Här är de stora stegen. Små rättningar mellan hundratalen är samlade längre ner.</p></div></section>
      <div className="version-timeline">{milestones.map((item,index)=><article className={`version-milestone ${item.tone}`} key={item.version}>
        <div className="version-rail"><i>{item.icon}</i>{index< milestones.length-1&&<span/>}</div>
        <div className="version-milestone-card"><header><span><small>{item.eyebrow}</small><strong>v{item.version}</strong></span>{index===0&&<b>NYAST</b>}</header><h2>{item.title}</h2><p>{item.text}</p><ul>{item.points.map(point=><li key={point}><Check/>{point}</li>)}</ul></div>
      </article>)}</div>
      <section className="version-archive"><span>🗃️</span><div><small>DEN TIDIGA TIDEN</small><h2>0.400 OCH ÄLDRE</h2><p>Den nuvarande versionshistoriken börjar vid 0.461. Äldre milstolpar finns inte kvar tillräckligt tydligt, så här hittar vi inte på något.</p></div></section>
      <section className="version-small-releases"><header><small>ALLA SMÅ STEG</small><h2>MINDRE VERSIONER</h2></header><div>{["0.702","0.701","0.700","0.604","0.603","0.602","0.601","0.600","0.501","0.500"].map(v=><a className="version-link" key={v} href={`https://github.com/finalworld/Bubbsun/releases/tag/v${v}`} target="_blank" rel="noreferrer"><span>Bubbsun v{v}<small>Öppna versionsinformationen</small></span><ChevronRight/></a>)}</div></section>
    </section>
  );
}

function AboutPage({ onPage }: { onPage: (page: Page) => void }) {
  const links=[
    {page:"feedback" as Page,label:"Rapportera problem",description:"Något som inte fungerar? Berätta för oss.",icon:<Bug/>,tone:"berry"},
    {page:"feedback" as Page,label:"Skicka förslag",description:"Hjälp Bubbsun att bli ännu mysigare.",icon:<Lightbulb/>,tone:"sun"},
    {page:"versions" as Page,label:"Versioner & nyheter",description:"Se vad som är nytt och vad som har förbättrats.",icon:<History/>,tone:"green"},
    {page:"help" as Page,label:"Hjälp & guider",description:"Hitta svar och lär dig funktionerna.",icon:<BookOpen/>,tone:"blue"},
    {page:"privacy" as Page,label:"Integritet & molndata",description:"Så hanterar Bubbsun dina uppgifter.",icon:<LockKeyhole/>,tone:"plum"},
    {page:"support" as Page,label:"Stöd Bubbsun",description:"Ge lite kärlek till projektets fortsättning.",icon:<Heart/>,tone:"heart"},
  ];
  return (
    <section className="content subpage about-page">
      <AboutSectionHeader active="about" onPage={onPage} title="OM BUBBSUN" subtitle="En liten plats för stora och små delar av vardagen" />
      <div className="about-top">
        <article className="creator-card about-team">
          <header><small>MÄNNISKORNA & NOSEN</small><h2>TEAM BUBBSUN</h2></header>
          <div>
            <i className="about-avatar daniel"><img src="/assets/android/about_man.png" alt="Daniel Grandin" /></i>
            <span>
              <strong>Daniel Grandin</strong>
              <small>Utveckling & design</small>
            </span>
          </div>
          <div>
            <i className="about-avatar sanja"><img src="/assets/android/about_woman.png" alt="Sanja Kropsu" /></i>
            <span>
              <strong>Sanja Kropsu</strong>
              <small>Idéer, testning & feedback</small>
            </span>
          </div>
          <div>
            <i className="about-avatar frasse"><img src="/assets/android/frasse.png" alt="Frasse" /></i>
            <span>
              <strong>Frasse</strong>
              <small>Support & kvalitetskontroll</small>
            </span>
          </div>
        </article>
        <article className="info-card about-story">
          <span><Heart/></span>
          <small>VARFÖR BUBBSUN FINNS</small>
          <h2>LISTOR MED HJÄRTA</h2>
          <p>
            Bubbsun föddes ur vardagens små listor – och växte till en varm
            plats där familjen kan hjälpas åt, minnas mer och glömma mindre.
          </p>
          <strong>Enkelt. Personligt. Tillsammans.</strong>
          <div><i>✦</i><span>BYGGT MED OMTANKE</span><i>✦</i></div>
        </article>
      </div>
      <section className="about-explore"><header><small>MER OM BUBBSUN</small><h2>HITTA RÄTT</h2></header><div className="about-links">{links.map(link=><button className={link.tone} key={link.label} onClick={()=>onPage(link.page)}><i>{link.icon}</i><span><strong>{link.label}</strong><small>{link.description}</small></span><ChevronRight/></button>)}</div></section>
      <footer className="about-signoff"><span>✦</span><p>Skapad i Sverige för röriga, fina och alldeles vanliga liv.</p><span>✦</span></footer>
    </section>
  );
}

function AdminPage({
  lists,
  members,
  accounts,
  reports,
  palettes,
  onlineUserIds,
  userCounts,
  publicRecipes,
  messageCount,
  initialTab,
}: {
  lists: BubbsunList[];
  members: Membership[];
  accounts: Account[];
  reports: Report[];
  palettes: Record<string, ThemePalette>;
  onlineUserIds: Set<string>;
  userCounts: Record<string,AdminUserCounts>;
  publicRecipes: Recipe[];
  messageCount: number;
  initialTab: "stats" | "members" | "reports";
}) {
  const [tab, setTab] = useState<"stats" | "members" | "reports" | "recipes" | "system" | "themes">(
      initialTab,
    ),
    [selected, setSelected] = useState<Account | null>(null),
    [editing,setEditing]=useState<Account|null>(null),
    [memberSort,setMemberSort]=useState<"login"|"registered"|"active"|"content">("login");
  useEffect(()=>setTab(initialTab),[initialTab]);
  const items = lists.flatMap((list) => list.items);
  const recipeCount = Object.values(userCounts).reduce((total, counts) => total + counts.recipes, 0);
  const topThemes = themes
    .map((theme) => {
      const palette = { ...theme, ...usableThemePalette(theme.id, palettes[theme.id]) };
      return {
        id: theme.id,
        name: theme.name,
        count: accounts.filter((item) => (item.themeId || "retro") === theme.id).length,
        accent: palette.accent,
        paper: palette.paper,
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "sv"))
    .slice(0, 5);
  const contentCount=(person:Account)=>{
    const counts=userCounts[person.uid];
    return lists.filter(list=>list.creatorId===person.uid).length+items.filter(item=>item.ownerId===person.uid).length+(counts?.notes||0)+(counts?.calendarEvents||0)+(counts?.recipes||0);
  };
  const orderedAccounts = [...accounts].sort((a, b) => {
    const difference=memberSort==="registered"?(b.createdAt||0)-(a.createdAt||0):memberSort==="active"?(b.visitCount||0)-(a.visitCount||0):memberSort==="content"?contentCount(b)-contentCount(a):(b.lastActiveAt||0)-(a.lastActiveAt||0);
    return difference||a.displayName.localeCompare(b.displayName,"sv");
  });
  return (
    <section className="content subpage admin-page">
      <div className="admin-tabs" role="tablist" aria-label="Administration">
        <button className={tab === "stats" ? "selected" : ""} onClick={() => setTab("stats")}>STATS</button>
        <button className={tab === "members" ? "selected" : ""} onClick={() => setTab("members")}>MEDLEMMAR</button>
        <button className={tab === "themes" ? "selected" : ""} onClick={() => setTab("themes")}>TEMA</button>
        <button className={tab === "reports" ? "selected" : ""} onClick={() => setTab("reports")}>BUGGAR & FÖRSLAG</button>
        <button className={tab === "recipes" ? "selected" : ""} onClick={() => setTab("recipes")}>RECEPT ({publicRecipes.length})</button>
        <button className={tab === "system" ? "selected" : ""} onClick={() => setTab("system")}>SYSTEM</button>
      </div>
      {tab === "stats" && <><div className="stats-grid">
        <button onClick={() => setTab("members")}>
          <Users />
          <small>ANTAL ANVÄNDARE</small>
          <strong>{accounts.length}</strong>
        </button>
        <div>
          <ListChecks />
            <small>ANTAL LISTOR</small>
          <strong>{lists.length}</strong>
        </div>
        <div>
          <CirclePlus />
            <small>ANTAL POSTER</small>
          <strong>{items.length}</strong>
        </div>
        <button onClick={() => setTab("reports")}>
          <span>🐞</span>
          <small>NYA RAPPORTER</small>
          <strong>
            {reports.filter((report) => report.status === "new").length}
          </strong>
        </button>
        <button onClick={() => setTab("recipes")}>
          <BookOpen />
          <small>ANTAL RECEPT</small>
          <strong>{recipeCount}</strong>
        </button>
        <div>
          <MessageCircle />
          <small>SKICKADE MEDDELANDEN</small>
          <strong>{messageCount}</strong>
        </div>
      </div>
      <div className="admin-theme-ranking" aria-label="De fem mest använda temana">
        {topThemes.map((theme, index) => (
          <article
            key={theme.id}
            style={{
              "--ranking-accent": theme.accent,
              "--ranking-paper": theme.paper,
            } as CSSProperties}
          >
            <span>{index + 1}</span>
            <i aria-hidden="true" />
            <strong>{theme.name}</strong>
            <small>{theme.count} användare</small>
          </article>
        ))}
      </div></>}
      {tab === "members" && (
        <><div className="admin-member-sort"><strong>SORTERA MEDLEMMAR</strong><select value={memberSort} onChange={event=>setMemberSort(event.target.value as typeof memberSort)}><option value="login">Senast inloggad</option><option value="registered">Senast registrerad</option><option value="active">Mest aktiv</option><option value="content">Flest saker</option></select></div><div className="admin-member-list">
          {orderedAccounts.map((person) => (
            <article key={person.uid} role="button" tabIndex={0} onClick={()=>setSelected(person)} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();setSelected(person)}}}>
              <i
                style={{
                  background: rgbaHex(person.personalColor || colorOptions[0]),
                }}
              >
                {person.displayName.slice(0, 1)}
              </i>
              <span>
                <strong>
                  {onlineUserIds.has(person.uid) && <b className="admin-online-dot" aria-label="Online" />}
                  {person.displayName}
                </strong>
                <small
                  style={{
                    color: rgbaHex(person.titleColor || colorOptions[0]),
                  }}
                >
                  {person.globalTitle || "Medlem"}
                </small>
                {person.supporter && <em>♥ SUPPORTER</em>}
              </span>
              <button className="admin-edit-user" onClick={event=>{event.stopPropagation();setEditing(person)}}><Pencil/> REDIGERA</button>
            </article>
          ))}
        </div></>
      )}
      {tab === "reports" && (
        <div className="report-list">
          {reports.map((report) => (
            <article key={report.id}>
              <small>
                {report.kind.toUpperCase()} · {report.category}
              </small>
              <h3>{report.title}</h3>
              <p>{report.description}</p>
              <button
                className="danger"
                onClick={() => void removeReport(report.id)}
              >
                <Trash2 /> TA BORT
              </button>
            </article>
          ))}
        </div>
      )}
      {tab === "themes" && (
        <div className="admin-themes">
          {themes.map((theme) => (
            <ThemeEditor
              key={theme.id}
              theme={{ ...theme, ...usableThemePalette(theme.id, palettes[theme.id]) }}
            />
          ))}
        </div>
      )}
      {tab === "system" && <div className="admin-system-tab"><section className="admin-quota-panel">
        <div><small>FIREBASE · STANDARDKVOT</small><h2>Databasanvändning</h2><p>Firebase visar aktuell förbrukning med ungefär 1–4 minuters fördröjning. Bubbsun håller inga extra lyssnare öppna för den här rutan.</p></div>
        <div className="admin-quota-limits"><span><strong>50 000</strong><small>LÄSNINGAR / DAG</small></span><span><strong>20 000</strong><small>SKRIVNINGAR / DAG</small></span><span><strong>20 000</strong><small>RADERINGAR / DAG</small></span></div>
        <a href="https://console.firebase.google.com/project/bubbsan-c3ec7/firestore/usage" target="_blank" rel="noreferrer">SE AKTUELL FÖRBRUKNING I FIREBASE <ChevronRight /></a>
        <p className="admin-quota-note">Automatiska livevärden här kräver en säker serverkoppling till Google Cloud Monitoring. Inga hemliga nycklar läggs i webbläsaren.</p>
      </section><GlobalPinEditor /><a
        className="version-link"
        href="https://github.com/finalworld/Bubbsun/releases"
        target="_blank"
        rel="noreferrer"
      >
        RELEASER & NEDLADDNINGAR
        <ChevronRight />
      </a></div>}
      {selected && (
        <AdminUserStatsDialog
          account={selected}
          lists={lists}
          counts={userCounts[selected.uid]}
          onClose={() => setSelected(null)}
        />
      )}
      {tab === "recipes" && <div className="admin-public-recipes">{publicRecipes.length?publicRecipes.map(recipe=><article key={recipe.sourcePath||`${recipe.creatorId}-${recipe.id}`}><div>{recipe.image?<img src={recipe.image} alt=""/>:<span>🍲</span>}<p><small>{recipeCategoryLabel(recipe)}</small><strong>{recipe.title}</strong><em>Delat av {recipe.creatorName}</em></p></div><button className="danger" disabled={!recipe.sourcePath} onClick={async()=>{if(recipe.sourcePath&&window.confirm(`Ta bort ”${recipe.title}” från Upptäck? Ägarens recept finns kvar.`))await unpublishRecipe(recipe.sourcePath)}}><X/> AVPUBLICERA</button></article>):<div className="recipes-empty"><span>✓</span><h2>Inga offentliga recept</h2></div>}</div>}
      {editing&&<AdminUserDialog account={editing} onClose={()=>setEditing(null)}/>}
    </section>
  );
}
function AdminUserStatsDialog({account,lists,counts,onClose}:{account:Account;lists:BubbsunList[];counts?:AdminUserCounts;onClose:()=>void}){
  const madeLists=lists.filter(list=>list.creatorId===account.uid),madeItems=lists.flatMap(list=>list.items).filter(item=>item.ownerId===account.uid),visits=(account.visitLog||[]).slice(0,10),dateTime=(value:number)=>new Intl.DateTimeFormat("sv-SE",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value));
  const stats=[
    ["LISTOR",madeLists.length],["POSTER",madeItems.length],["KLARA POSTER",madeItems.filter(item=>item.completed).length],["KVARVARANDE",madeItems.filter(item=>!item.completed).length],
    ["ANTECKNINGAR",counts?.notes||0],["KALENDERPOSTER",counts?.calendarEvents||0],["RECEPT",counts?.recipes||0],["GRUPPER",counts?.groups||0],["FÖLJDA LISTOR",counts?.followedLists||0],["BESÖK",account.visitCount||visits.length],
  ] as const;
  return <div className="modal-backdrop"><div className="modal admin-user-stats-modal"><button className="modal-x" onClick={onClose} aria-label="Stäng"><X/></button><header><i style={{background:rgbaHex(account.personalColor||colorOptions[0])}}>{account.displayName.slice(0,1)}</i><span><small>{account.createdAt?`KONTO SKAPAT · ${dateTime(account.createdAt)}`:"KONTO SKAPAT · DATUM SAKNAS"}</small><h2>{account.displayName}</h2><p>{account.globalTitle||"Medlem"}</p></span></header><div className="admin-user-counts">{stats.map(([label,value])=><section key={label}><strong>{value}</strong><span>{label}</span></section>)}</div><section className="admin-visit-log"><h3>SENASTE 10 BESÖKEN</h3>{visits.length?<ol>{visits.map((visit,index)=><li key={`${visit}-${index}`}><span>{index+1}</span><time>{dateTime(visit)}</time></li>)}</ol>:<p>Ingen sparad besökshistorik ännu. Den börjar samlas från v0.872.</p>}</section><button className="cancel" onClick={onClose}>STÄNG</button></div></div>
}
function AdminUserDialog({
  account,
  onClose,
}: {
  account: Account;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(account.globalTitle || ""),
    [titleColor, setTitleColor] = useState(
      account.titleColor || colorOptions[0],
    ),
    [supporter, setSupporter] = useState(account.supporter),
    [mega, setMega] = useState(account.megaSuperBoss),
    [suspended, setSuspended] = useState(account.suspended === true),
    [status, setStatus] = useState("");
  useEffect(() => {
    setTitle(account.globalTitle || "");
    setTitleColor(account.titleColor || colorOptions[0]);
    setSupporter(account.supporter === true);
    setMega(account.megaSuperBoss === true);
    setSuspended(account.suspended === true);
    setStatus("");
  }, [
    account.uid,
    account.globalTitle,
    account.titleColor,
    account.supporter,
    account.megaSuperBoss,
    account.suspended,
  ]);
  const toggle = async (
    key: "supporter" | "megaSuperBoss" | "suspended",
    value: boolean,
  ) => {
    setStatus("Sparar…");
    if (key === "supporter") setSupporter(value);
    if (key === "megaSuperBoss") setMega(value);
    if (key === "suspended") setSuspended(value);
    try {
      await updateAccountAdmin(account.uid, {
        [key]: value,
        ...(key === "supporter" && value
          ? { supporterTitle: "lifetime", supporterGlow: true }
          : {}),
      });
      setStatus("Sparat ✓");
    } catch (error) {
      console.error("Adminändringen kunde inte sparas", {
        targetUid: account.uid,
        key,
        value,
        error,
      });
      if (key === "supporter") setSupporter(!value);
      if (key === "megaSuperBoss") setMega(!value);
      if (key === "suspended") setSuspended(!value);
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: unknown }).code)
          : "";
      setStatus(
        code.includes("permission-denied")
          ? "Firebase nekade adminbehörigheten"
          : "Kunde inte spara",
      );
    }
  };
  return (
    <div className="modal-backdrop">
      <div className="modal admin-user-modal">
        <h2>{account.displayName}</h2>
        <label>
          Unik titel
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={35}
          />
        </label>
        <h3>TITELFÄRG</h3>
        <div className="color-picker">
          {colorOptions.map((value) => (
            <button
              type="button"
              key={value}
              className={titleColor === value ? "selected" : ""}
              style={{ background: rgbaHex(value) }}
              onClick={() => setTitleColor(value)}
            />
          ))}
        </div>
        <label className="switch-row">
          <span>Supporter</span>
          <input
            type="checkbox"
            checked={supporter}
            onChange={(event) => void toggle("supporter", event.target.checked)}
          />
        </label>
        <label className="switch-row">
          <span>MegaSuperBoss</span>
          <input
            type="checkbox"
            checked={mega}
            onChange={(event) =>
              void toggle("megaSuperBoss", event.target.checked)
            }
          />
        </label>
        <label className="switch-row">
          <span>Blockerad</span>
          <input
            type="checkbox"
            checked={suspended}
            onChange={(event) => void toggle("suspended", event.target.checked)}
          />
        </label>
        {status && <p className="admin-save-status">{status}</p>}
        <div>
          <button onClick={onClose}>STÄNG</button>
          <button
            onClick={async () => {
              await updateAccountAdmin(account.uid, {
                globalTitle: title,
                titleColor,
              });
              onClose();
            }}
          >
            SPARA
          </button>
        </div>
      </div>
    </div>
  );
}
function GlobalPinEditor() {
  const [pins, setPins] = useState<GlobalPin[]>([]),
    [selectedId, setSelectedId] = useState(""),
    [preview, setPreview] = useState<GlobalPin | null>(null),
    [title, setTitle] = useState(""),
    [info, setInfo] = useState(""),
    [rows, setRows] = useState("");
  useEffect(() => watchGlobalPins(setPins), []);
  const selected =
    selectedId === "__new__"
      ? null
      : pins.find((pin) => pin.id === selectedId) ||
        pins.find((pin) => pin.status === "published") ||
        null;
  useEffect(() => {
    if (!selected) return;
    setSelectedId(selected.id);
    setTitle(selected.title);
    setInfo(selected.infoText);
    setRows(
      selected.items
        .map(
          (item) => `${item.name}${item.quantity ? ` | ${item.quantity}` : ""}`,
        )
        .join("\n"),
    );
  }, [selected?.id]);
  const parsed = () =>
      rows
        .split("\n")
        .filter(Boolean)
        .map((row, index) => {
          const [name, quantity = ""] = row.split("|");
          return {
            id: selected?.items[index]?.id,
            name: name.trim(),
            quantity: quantity.trim(),
          };
        }),
    votes = (pin: GlobalPin) =>
      pin.items.reduce((sum, item) => sum + item.reactionCount, 0),
    save = async (published: boolean) => {
      const id = await saveGlobalPin({
        id: selected?.id,
        title,
        infoText: info,
        items: parsed(),
        published,
      });
      setSelectedId(id);
    },
    date = (value: unknown) => {
      const raw = value as
          { toDate?: () => Date; seconds?: number } | undefined,
        d =
          raw?.toDate?.() ||
          (raw?.seconds ? new Date(raw.seconds * 1000) : null);
      return d
        ? new Intl.DateTimeFormat("sv-SE", {
            dateStyle: "long",
            timeStyle: "short",
          }).format(d)
        : "Datum saknas för äldre pin";
    },
    load = (pin: GlobalPin) => {
      setSelectedId(pin.id);
      setPreview(null);
    };
  return (
    <div className="global-pin-admin">
      <div className="settings-card">
        <h2>GLOBAL PINNAD LISTA</h2>
        {selected && (
          <p className="global-pin-vote-total">
            <b>{votes(selected)}</b> röster totalt ·{" "}
            {selected.status === "published" ? "PUBLICERAD" : "AVPUBLICERAD"}
          </p>
        )}
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Rubrik"
          maxLength={80}
        />
        <textarea
          value={info}
          onChange={(event) => setInfo(event.target.value)}
          placeholder="Information"
          maxLength={240}
        />
        <textarea
          value={rows}
          onChange={(event) => setRows(event.target.value)}
          placeholder="En post per rad. Namn | mängd"
        />
        <div className="pin-actions">
          <button onClick={() => void save(true)}>PUBLICERA / UPPDATERA</button>
          {selected?.status === "published" && (
            <button onClick={() => void save(false)}>AVPUBLICERA</button>
          )}
          <button
            onClick={() => {
              setSelectedId("__new__");
              setTitle("");
              setInfo("");
              setRows("");
            }}
          >
            NY PIN
          </button>
        </div>
      </div>
      <section className="global-pin-history">
        <h2>TIDIGARE OCH SPARADE PINS</h2>
        {pins.map((pin) => (
          <button
            key={pin.id}
            className={pin.id === selected?.id ? "selected" : ""}
            onClick={() => setPreview(pin)}
          >
            <span>
              <strong>{pin.title || "Namnlös pin"}</strong>
              <small>
                {pin.status === "published" ? "PUBLICERAD" : "AVPUBLICERAD"} ·
                revision {pin.revision}
              </small>
            </span>
            <b>{votes(pin)} röster</b>
            <ChevronRight />
          </button>
        ))}
      </section>
      {preview && (
        <div className="modal-backdrop">
          <div className="modal global-pin-result-modal">
            <button
              className="global-pin-close"
              aria-label="Stäng"
              onClick={() => setPreview(null)}
            >
              <X />
            </button>
            <small>
              {preview.status === "published" ? "PUBLICERAD" : "AVPUBLICERAD"}
            </small>
            <h2>{preview.title || "Namnlös pin"}</h2>
            {preview.infoText && <p>{preview.infoText}</p>}
            <div className="global-pin-dates">
              <span>
                <b>Publicerad</b>
                {date(preview.publishedAt || preview.createdAt)}
              </span>
              <span>
                <b>Avpublicerad</b>
                {preview.status === "published"
                  ? "Inte avpublicerad"
                  : date(preview.unpublishedAt || preview.updatedAt)}
              </span>
            </div>
            <div className="global-pin-result-options">
              {preview.items.map((item) => (
                <div key={item.id}>
                  <span>
                    <strong>{item.name}</strong>
                    {item.quantity && <small>{item.quantity}</small>}
                  </span>
                  <b>{item.reactionCount} röster</b>
                </div>
              ))}
            </div>
            <p className="global-pin-result-total">
              <b>{votes(preview)}</b> röster totalt
            </p>
            <button onClick={() => load(preview)}>ÖPPNA I FORMULÄRET</button>
          </div>
        </div>
      )}
    </div>
  );
}
function ThemeEditor({
  theme,
}: {
  theme: (typeof themes)[number] & Partial<ThemePalette>;
}) {
  const makeValues = () => ({
    bg: theme.bg,
    paper: theme.paper,
    panel: theme.panel,
    text: theme.text,
    accent: theme.accent,
    outline: theme.outline,
    header: theme.header || theme.panel,
    headerButton: theme.headerButton || theme.accent,
    brandDecoration: theme.brandDecoration || theme.accent,
    brandSuffix: theme.brandSuffix || theme.text,
    calendarEventBackground: theme.calendarEventBackground || theme.paper,
  });
  const [values, setValues] = useState(makeValues),
    [message, setMessage] = useState("");
  useEffect(
    () => setValues(makeValues()),
    [
      theme.bg,
      theme.paper,
      theme.panel,
      theme.text,
      theme.accent,
      theme.outline,
      theme.header,
      theme.headerButton,
      theme.brandDecoration,
      theme.brandSuffix,
      theme.calendarEventBackground,
    ],
  );
  return (
    <details>
      <summary>
        <img src={`${import.meta.env.BASE_URL}assets/android/${theme.icon}`} />
        {theme.name}
      </summary>
      <div
        className="theme-preview"
        style={{
          background: values.bg,
          color: values.text,
          borderColor: values.outline,
        }}
      >
        <span style={{ background: values.panel }}>Panel</span>
        <span style={{ background: values.paper }}>Kort</span>
        <b style={{ background: values.accent }}>Accent</b>
        <b style={{ background: values.header }}>Header</b>
        <b style={{ background: values.headerButton }}>Toppknappar</b>
      </div>
      <div className="palette-fields">
        {Object.entries(values).map(([key, value]) => (
          <label key={key}>
            {key === "brandDecoration" ? "Loggdekor" : key === "brandSuffix" ? "Loggans .se" : key === "calendarEventBackground" ? "Kalenderposternas bakgrund" : key}
            <input
              type="color"
              value={value}
              onChange={(event) =>
                setValues((old) => ({ ...old, [key]: event.target.value }))
              }
            />
          </label>
        ))}
      </div>
      <button
        onClick={async () => {
          try {
            await saveThemePalette({
              id: theme.id,
              ...values,
              paletteVersion: theme.id === "light" ? 3 : 2,
            });
            setMessage("Temat är sparat för alla ✓");
          } catch (error) {
            setMessage(
              error instanceof Error ? error.message : "Kunde inte spara temat",
            );
          }
        }}
      >
        SPARA FÖR ALLA
      </button>
      {message && <p className="theme-save-message">{message}</p>}
    </details>
  );
}

const recipeSubcategories: Record<string, string[]> = {
  Frukost: ["Gröt & müsli", "Smörgåsar", "Ägg", "Pannkakor & våfflor", "Yoghurt & bowls", "Smoothies", "Brunch", "Helgfrukost", "Barnvänligt", "Annat"],
  Förrätt: ["Smårätter", "Soppor", "Sallader", "Plockmat", "Bröd & crostini", "Fisk & skaldjur", "Vegetariskt", "Chark", "Annat"],
  Lunch: ["Snabbt & enkelt", "Sallad", "Soppa", "Matlåda", "Smörgås & wrap", "Pasta & nudlar", "Paj", "Vegetariskt", "Restmat", "Annat"],
  Middag: ["Husmanskost", "Asiatiskt", "Italienskt", "Mexikanskt", "Medelhav", "Mellanöstern", "Indiskt", "Amerikanskt", "Vegetariskt", "Veganskt", "Fisk & skaldjur", "Kyckling", "Kött", "Färs", "Pasta & nudlar", "Grytor", "Soppor", "Grillat", "Ugnsrätter", "Annat"],
  Tillbehör: ["Inläggningar & picklat", "Såser", "Dressing", "Röror & dip", "Sallader", "Potatis", "Ris & gryn", "Bröd", "Grönsaker", "Sylt & chutney", "Kryddor & smaksättare", "Annat"],
  Bakning: ["Bullar", "Bröd", "Frallor", "Kakor", "Småkakor", "Tårtor", "Muffins & cupcakes", "Paj", "Bakelser", "Kladdkakor & brownies", "Deg & grundrecept", "Glutenfritt", "Annat"],
  Efterrätt: ["Glass", "Choklad", "Frukt & bär", "Pudding & kräm", "Mousse", "Paj", "Tårta", "Småkakor", "Godis & konfekt", "Snabb dessert", "Annat"],
  Mellanmål: ["Smoothie", "Smörgås", "Frukt & bär", "Yoghurt & bowls", "Bars & energibollar", "Snacks & tilltugg", "Barnvänligt", "Efter träning", "Annat"],
  Dryck: ["Kaffe", "Te", "Varm dryck", "Kall dryck", "Juice", "Smoothie", "Läsk & lemonad", "Drink med alkohol", "Alkoholfri drink", "Annat"],
};
const recipeCategories=["",...Object.keys(recipeSubcategories)];
const recipeDietaryOptions=[
  {value:"vegetarian",label:"Vegetariskt",icon:"🥕"},
  {value:"vegan",label:"Veganskt",icon:"🌱"},
  {value:"lactose-free",label:"Laktosfritt",icon:"🥛"},
  {value:"dairy-free",label:"Mjölkfritt",icon:"🚫🥛"},
  {value:"gluten-free",label:"Glutenfritt",icon:"🌾"},
] as const;
const recipeCategoryLabel=(recipe:Recipe)=>[recipe.category,recipe.subcategory].filter(Boolean).join(" · ")||"RECEPT";
const recipeSlug=(title:string)=>title.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("sv-SE").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"recept";
const recipePublicUrl=(recipe:Recipe)=>`https://www.bubbsun.se/recept/${encodeURIComponent(recipe.id)}/${recipeSlug(recipe.title)}`;
function RecipeDietaryTags({recipe}:{recipe:Recipe}){const tags=recipeDietaryOptions.filter(option=>recipe.dietaryTags?.includes(option.value));return tags.length?<div className="recipe-dietary-tags">{tags.map(tag=><span key={tag.value}><i aria-hidden="true">{tag.icon}</i><b>{tag.label}</b></span>)}</div>:null}
function RecipeDietaryFilter({value,onChange}:{value:string[];onChange:(value:string[])=>void}){return <div className="recipe-dietary-filter" aria-label="Filtrera efter kostmärkning">{recipeDietaryOptions.map(option=>{const selected=value.includes(option.value);return <button type="button" key={option.value} className={selected?"selected":""} aria-pressed={selected} onClick={()=>onChange(selected?value.filter(item=>item!==option.value):[...value,option.value])}><span>{option.icon}</span><strong>{option.label}</strong>{selected&&<Check/>}</button>})}</div>}
const recipeSortOptions=[{value:"liked",label:"Mest gillade"},{value:"newest",label:"Senast inlagda"},{value:"oldest",label:"Äldst först"},{value:"alpha",label:"A–Ö"}];
const recipeTimeOptions=[{value:0,label:"Alla tider"},{value:15,label:"≤ 15 min"},{value:30,label:"≤ 30 min"},{value:60,label:"≤ 60 min"}];
function RecipeAdvancedFilter({sortMode,onSort,dietaryFilters,onDietary,maxMinutes,onMaxMinutes}:{sortMode:string;onSort:(value:string)=>void;dietaryFilters:string[];onDietary:(value:string[])=>void;maxMinutes:number;onMaxMinutes:(value:number)=>void}){return <div className="recipe-advanced-filter-panel"><section><strong>SORTERA</strong><div>{recipeSortOptions.map(option=><button type="button" key={option.value} className={sortMode===option.value?"selected":""} onClick={()=>onSort(option.value)}>{sortMode===option.value&&<Check/>}{option.label}</button>)}</div></section><section><strong>KOST</strong><RecipeDietaryFilter value={dietaryFilters} onChange={onDietary}/></section><section className="recipe-time-filter"><strong>TID</strong><div>{recipeTimeOptions.map(option=><button type="button" key={option.value} className={maxMinutes===option.value?"selected":""} onClick={()=>onMaxMinutes(option.value)}>{maxMinutes===option.value&&<Check/>}{option.label}</button>)}</div></section>{(dietaryFilters.length>0||maxMinutes>0)&&<button type="button" className="recipe-filter-clear" onClick={()=>{onDietary([]);onMaxMinutes(0)}}>RENSA FILTER</button>}</div>}

function RecipeShareControl({recipe}:{recipe:Recipe}){
  const [open,setOpen]=useState(false),[copied,setCopied]=useState(false),url=recipePublicUrl(recipe);
  const copyLink=async()=>{await navigator.clipboard.writeText(url);setCopied(true);window.setTimeout(()=>setCopied(false),2200)};
  return <><button className="recipe-share-button recipe-icon-action" type="button" aria-label="Dela recept" title="Dela recept" onClick={()=>setOpen(true)}><Share2/></button>{open&&<div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false)}}><div className="modal share-list-modal recipe-share-modal"><button className="modal-close recipe-share-close" aria-label="Stäng" onClick={()=>setOpen(false)}><X/></button><Share2 className="share-modal-icon"/><h2>DELA RECEPT</h2><p>Alla med länken kan läsa det här publika receptet utan konto.</p><input readOnly value={url} onFocus={event=>event.currentTarget.select()}/><div className="share-site-actions"><button onClick={()=>void copyLink()}><Copy/> KOPIERA LÄNK</button>{typeof navigator.share==="function"&&<button onClick={()=>void navigator.share({title:recipe.title,text:`${recipe.title} – ett recept på Bubbsun`,url})}><Share2/> DELA</button>}</div></div></div>}{copied&&<div className="recipe-copy-toast" role="status"><Copy/> Länken är kopierad ✓</div>}</>;
}
function RecipePrintButton(){
  const [open,setOpen]=useState(false);
  const sourceRef=useRef<HTMLElement|null>(null);
  const openPrintChoice=(event:React.MouseEvent<HTMLButtonElement>)=>{
    sourceRef.current=event.currentTarget.closest<HTMLElement>(".recipe-view");
    if(sourceRef.current)setOpen(true);
  };
  const printRecipe=(includeImage:boolean)=>{
    const source=sourceRef.current;
    if(!source)return;
    setOpen(false);
    const popup=window.open("","_blank","width=920,height=900");
    if(!popup){window.alert("Utskriftsfönstret kunde inte öppnas.");return}
    const recipe=source.cloneNode(true) as HTMLElement;
    recipe.querySelectorAll(".recipe-close,.recipe-view-tools,.recipe-print-choice-backdrop,footer,button").forEach(node=>node.remove());
    recipe.querySelector(".recipe-scale")?.remove();
    if(!includeImage)recipe.querySelector(".recipe-hero")?.remove();
    const printLogo='<header class="print-logo"><strong>Bubbsun<span>.se</span></strong><b>LISTOR MED KARAKTÄR&nbsp; ✦</b></header>';
    popup.document.write(`<!doctype html><html lang="sv"><head><meta charset="utf-8"><title>${source.querySelector("h1")?.textContent||"Recept"}</title><style>
      @page{size:A4;margin:15mm}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#24150e}body{font-family:Georgia,"Times New Roman",serif}.print-page{width:100%;max-width:178mm;margin:0 auto}.print-logo{margin:0 0 14px;padding:0 0 7px;border-bottom:1px solid #58775c;display:flex;flex-direction:column;align-items:flex-start;break-after:avoid}.print-logo strong{font:800 28px/.92 Georgia,serif;letter-spacing:-1px}.print-logo strong span{font-size:.58em;color:#58775c;letter-spacing:0}.print-logo b{font:800 17px/1 Georgia,serif}.recipe-view{width:100%;margin:0;padding:0;border:0!important;background:#fff}.recipe-hero{display:block;width:100%;height:58mm;object-fit:cover;margin:0 0 12px;border:0;border-bottom:2px solid #ff993f;border-radius:0}.recipe-hero.fallback{height:35mm;display:grid;place-items:center;background:#f3eadc;font-size:70px}.recipe-view>small{display:block;color:#58775c;font:900 11px Arial,sans-serif;letter-spacing:.14em;margin-top:8px}.recipe-view>h1{margin:3px 0 10px;font:700 34px/1 Georgia,serif}.recipe-facts{display:flex;gap:10px;margin:0 0 11px;break-inside:avoid}.recipe-facts span{padding:7px 12px;border-radius:999px;background:#ead1a2;font-weight:800}.recipe-creator-line{margin:0 0 12px;padding-left:11px;border-left:6px solid #ff993f;font:800 13px Arial,sans-serif;break-inside:avoid}.recipe-description{margin:0 0 15px;padding:12px 15px;border:1px solid #d7c2aa;border-radius:10px;background:#f7eddd;white-space:pre-wrap;line-height:1.4;break-inside:avoid}.recipe-view>section{margin-top:14px;padding-top:13px;border-top:2px solid #dfd0c1}.recipe-view h3{margin:0 0 10px;font:900 12px Arial,sans-serif;letter-spacing:.12em;break-after:avoid}.recipe-ingredients-section{margin-top:22px!important}.recipe-dietary-tags{margin-bottom:18px}.recipe-ingredient-heading{margin:0 0 7px}.recipe-ingredient-group{margin:0 0 18px;break-inside:avoid}.recipe-ingredient-group h4{margin:0 0 3px;font-size:15px}.recipe-view ul{list-style:none;padding:0;margin:0;columns:2;column-gap:26px}.recipe-view li{padding:4px 0;break-inside:avoid}.recipe-view li b{display:inline-block;min-width:62px;color:#58775c}.recipe-instructions p{display:flex;gap:10px;margin:0 0 10px;line-height:1.4;break-inside:avoid}.recipe-instructions p>b{flex:0 0 25px;height:25px;border-radius:50%;display:grid;place-items:center;background:#58775c;color:#fff}.recipe-view aside{margin:14px 0;padding:12px 15px;border-radius:10px;background:#ead1a2;break-inside:avoid}.recipe-view aside p{margin-bottom:0}@media print{html,body{background:#fff}.print-page{max-width:none}.print-logo{break-inside:avoid}.recipe-hero{break-after:avoid}.recipe-view>section{break-before:auto}}
    </style></head><body><main class="print-page">${printLogo}${recipe.outerHTML}</main><script>window.onload=()=>{setTimeout(()=>window.print(),120)}<\/script></body></html>`);
    popup.document.close();
  };
  return <><button className="recipe-print-button recipe-icon-action" type="button" aria-label="Skriv ut recept" title="Skriv ut recept" onClick={openPrintChoice}><Printer/></button>{open&&<div className="modal-backdrop recipe-print-choice-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false)}}><div className="modal recipe-print-choice-modal"><button className="modal-close recipe-print-choice-close" type="button" aria-label="Stäng" onClick={()=>setOpen(false)}><X/></button><Printer className="recipe-print-choice-icon"/><h2>SKRIV UT RECEPT</h2><p>Vill du ha med den stora receptbilden?</p><div className="recipe-print-choice-actions"><button type="button" onClick={()=>printRecipe(true)}><ImagePlus/><span><b>MED BILD</b><small>Receptbilden följer med</small></span></button><button type="button" onClick={()=>printRecipe(false)}><BookOpen/><span><b>UTAN BILD</b><small>Bara text och små ikoner</small></span></button></div></div></div>}</>
}

function RecipeLikeButton({recipe,uid}:{recipe:Recipe;uid:string}){
  const [likedBy,setLikedBy]=useState(recipe.likedBy||[]),[busy,setBusy]=useState(false);
  useEffect(()=>setLikedBy(recipe.likedBy||[]),[recipe.likedBy]);
  const liked=likedBy.includes(uid);
  const toggle=async()=>{
    if(busy)return;
    const previous=likedBy,next=liked?previous.filter(value=>value!==uid):[...previous,uid];
    setLikedBy(next);setBusy(true);
    try{await setPublicRecipeLiked(recipe,uid,!liked)}catch(error){setLikedBy(previous);console.error("Kunde inte spara gillningen",error)}finally{setBusy(false)}
  };
  return <button type="button" className={`recipe-like-button${liked?" liked":""}`} aria-label={liked?"Ta bort gillning":"Gilla receptet"} title={liked?"Ta bort gillning":"Gilla receptet"} aria-pressed={liked} disabled={busy} onClick={()=>void toggle()}><ThumbsUp fill={liked?"currentColor":"none"}/><b>{likedBy.length}</b></button>;
}

function RecipeLikeCount({recipe}:{recipe:Recipe}){
  if(recipe.copiedFromRecipeId)return null;
  return <span className="recipe-card-like-count" aria-label={`${recipe.likedBy?.length||0} gillningar`}><ThumbsUp/><b>{recipe.likedBy?.length||0}</b></span>;
}

function RecipeUniqueViews({recipe,uid}:{recipe:Recipe;uid:string}){
  const [count,setCount]=useState(0),owner=recipe.creatorId===uid;
  useEffect(()=>{
    if(owner)return watchRecipeViewCount(recipe,uid,setCount);
    void recordRecipeView(recipe,uid).catch(error=>console.error("Kunde inte registrera receptvisningen",error));
  },[recipe.creatorId,recipe.id,uid,owner]);
  return owner?<div className="recipe-unique-views" title="En visning per inloggad användare"><Eye/><strong>{count}</strong><span>UNIKA VISNINGAR</span></div>:null;
}

function mergePublicRecipeLikes(recipes:Recipe[],publicRecipes:Recipe[]){
  const bySource=new Map(publicRecipes.filter(recipe=>recipe.sourcePath).map(recipe=>[recipe.sourcePath,recipe]));
  return recipes.map(recipe=>{
    const publicRecipe=bySource.get(recipe.sourcePath)||publicRecipes.find(value=>value.id===recipe.id&&value.creatorId===recipe.creatorId);
    const original=recipe.copiedFromRecipeId?publicRecipes.find(value=>value.id===recipe.copiedFromRecipeId):undefined;
    const merged=publicRecipe?{...recipe,likedBy:publicRecipe.likedBy||[]}:recipe;
    return recipe.copiedFromRecipeId?{...merged,originalCreatorId:recipe.originalCreatorId||original?.creatorId,originalCreatorName:recipe.originalCreatorName||original?.creatorName,originalCreatorColor:recipe.originalCreatorColor??original?.creatorColor}:merged;
  });
}

function RecipeCreateListControl({recipe,memberships,groups,onCreate}:{recipe:Recipe;memberships:Membership[];groups:Record<string,Group>;onCreate:(recipe:Recipe,targetLocation:string,ingredientIds:string[])=>Promise<void>}){
  const [open,setOpen]=useState(false),[busyTarget,setBusyTarget]=useState(""),[created,setCreated]=useState(false),[error,setError]=useState(""),[pendingTarget,setPendingTarget]=useState(""),[selectedIngredientIds,setSelectedIngredientIds]=useState<string[]>([]);
  const controlRef=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{if(!open)return;const close=(event:PointerEvent)=>{if(!controlRef.current?.contains(event.target as Node))setOpen(false)};document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close)},[open]);
  const choose=async(targetLocation:string)=>{
    if(busyTarget)return;
    setBusyTarget(targetLocation);setError("");
    try{
      await onCreate(recipe,targetLocation,selectedIngredientIds);
      setOpen(false);setPendingTarget("");setCreated(true);
      window.setTimeout(()=>setCreated(false),2200);
    }catch(reason){console.error("Kunde inte skapa receptlistan",reason);setError("Kunde inte skapa listan. Försök igen.")}finally{setBusyTarget("")}
  };
  const requestCreate=(targetLocation:string)=>{setOpen(false);setError("");setSelectedIngredientIds(recipe.ingredients.filter(item=>!item.isHeading).map(item=>item.id));setPendingTarget(targetLocation)};
  const pendingTargetName=pendingTarget==="private"?"Privat":groups[pendingTarget]?.name||"gruppen";
  return <div className="recipe-create-list-control" ref={controlRef}>
    <button type="button" className={`recipe-create-list-trigger${created?" created":""}`} aria-expanded={open} onClick={()=>setOpen(value=>!value)}><ListChecks/><span>{created?"SKAPAD ✓":"SKAPA LISTA"}</span><ChevronDown className={open?"open":""}/></button>
    {open&&<div className="recipe-create-list-menu"><small>SKAPA INKÖPSLISTA I</small><button type="button" disabled={Boolean(busyTarget)} onClick={()=>requestCreate("private")}><LockKeyhole/><span><b>Privat</b><em>Bara för dig</em></span></button>{memberships.map(item=>{const group=groups[item.groupId];return <button type="button" disabled={Boolean(busyTarget)} key={item.groupId} onClick={()=>requestCreate(item.groupId)}><GroupIcon id={group?.iconId}/><span><b>{group?.name||"Grupp"}</b><em>Delas med gruppen</em></span></button>})}{error&&<p className="recipe-create-list-error">{error}</p>}</div>}
    {pendingTarget&&<div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!busyTarget)setPendingTarget("")}}><div className="modal confirm-delete-modal recipe-pantry-modal"><h2>VAD BEHÖVER DU KÖPA?</h2><p>Bocka ur sådant du redan har hemma. Listan “{recipe.title}” skapas i <b>{pendingTargetName}</b>.</p><div className="recipe-pantry-list">{recipe.ingredients.filter(item=>!item.isHeading).map(item=><label key={item.id}><input type="checkbox" checked={selectedIngredientIds.includes(item.id)} onChange={event=>setSelectedIngredientIds(current=>event.target.checked?[...current,item.id]:current.filter(id=>id!==item.id))}/><span><b>{item.name}</b><small>{[item.amount,item.unit].filter(Boolean).join(" ")||"Valfri mängd"}</small></span></label>)}</div>{error&&<p className="recipe-create-list-error">{error}</p>}<div className="modal-actions"><button className="cancel" disabled={Boolean(busyTarget)} onClick={()=>setPendingTarget("")}>AVBRYT</button><button disabled={Boolean(busyTarget)||selectedIngredientIds.length===0} onClick={()=>void choose(pendingTarget)}>{busyTarget?<><LoaderCircle className="spin"/> SKAPAR…</>:"SKAPA LISTA"}</button></div></div></div>}
  </div>;
}

function RecipeSaveCopyControl({recipe,memberships,groups,onSave}:{recipe:Recipe;memberships:Membership[];groups:Record<string,Group>;onSave:(recipe:Recipe,targetLocation:string)=>Promise<void>}){
  const [open,setOpen]=useState(false),[busy,setBusy]=useState(""),[saved,setSaved]=useState(false),[error,setError]=useState("");
  const controlRef=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{if(!open)return;const close=(event:PointerEvent)=>{if(!controlRef.current?.contains(event.target as Node))setOpen(false)};document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close)},[open]);
  const save=async(targetLocation:string)=>{if(busy)return;setBusy(targetLocation);setError("");try{await onSave(recipe,targetLocation);setOpen(false);setSaved(true);window.setTimeout(()=>setSaved(false),2200)}catch(reason){console.error("Kunde inte spara receptkopian",reason);setError("Kunde inte spara receptet. Försök igen.")}finally{setBusy("")}};
  return <div className="recipe-create-list-control recipe-save-copy-control" ref={controlRef}><button type="button" className={`recipe-create-list-trigger${saved?" created":""}`} aria-expanded={open} onClick={()=>setOpen(value=>!value)}><BookOpen/><span>{saved?"SPARAT ✓":"SPARA I KOKBOK"}</span><ChevronDown className={open?"open":""}/></button>{open&&<div className="recipe-create-list-menu"><small>SPARA RECEPTKOPIA I</small><button type="button" disabled={Boolean(busy)} onClick={()=>void save("private")}><LockKeyhole/><span><b>Privat</b><em>Bara för dig</em></span></button>{memberships.map(item=>{const group=groups[item.groupId];return <button type="button" disabled={Boolean(busy)} key={item.groupId} onClick={()=>void save(item.groupId)}><GroupIcon id={group?.iconId}/><span><b>{group?.name||"Grupp"}</b><em>Delas med gruppen</em></span></button>})}{error&&<p className="recipe-create-list-error">{error}</p>}</div>}</div>;
}
const recipeInstructionSteps=(instructions:string)=>instructions.trim().split(/\r?\n[ \t]*\r?\n+/).map(step=>step.trim()).filter(Boolean);
const recipeYieldLabel=(recipe:Recipe)=>recipe.servings>0?`${recipe.servings} ${(recipe.servingUnit||"portioner").trim()||"portioner"}`:"";

const recipeFractions:Record<string,number>={"¼":.25,"½":.5,"¾":.75,"⅐":1/7,"⅑":1/9,"⅒":.1,"⅓":1/3,"⅔":2/3,"⅕":.2,"⅖":.4,"⅗":.6,"⅘":.8,"⅙":1/6,"⅚":5/6,"⅛":.125,"⅜":.375,"⅝":.625,"⅞":.875};
function parseRecipeAmount(value:string){
  const text=value.trim().replace(",",".").replace(/⁄/g,"/");
  if(!text)return undefined;
  const mixed=text.match(/^(\d+)\s*([¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])$/);
  if(mixed)return Number(mixed[1])+recipeFractions[mixed[2]];
  if(text in recipeFractions)return recipeFractions[text];
  const mixedFraction=text.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if(mixedFraction&&Number(mixedFraction[3]))return Number(mixedFraction[1])+Number(mixedFraction[2])/Number(mixedFraction[3]);
  const fraction=text.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if(fraction&&Number(fraction[2]))return Number(fraction[1])/Number(fraction[2]);
  return /^\d+(?:\.\d+)?$/.test(text)?Number(text):undefined;
}
function formatRecipeAmount(value:number){
  const rounded=Math.round(value*100)/100;
  return Number.isInteger(rounded)?String(rounded):String(rounded).replace(".",",");
}
function RecipeIngredients({recipe}:{recipe:Recipe}){
  const [factor,setFactor]=useState(1);
  useEffect(()=>setFactor(1),[recipe.id]);
  const groups=recipe.ingredients.reduce<Array<{title:string;items:Recipe["ingredients"]}>>((result,item)=>{if(item.isHeading){result.push({title:item.name,items:[]})}else{if(!result.length)result.push({title:"",items:[]});result[result.length-1].items.push(item)}return result},[]).filter(group=>group.items.length);
  return <section className="recipe-ingredients-section">
    <RecipeDietaryTags recipe={recipe}/>
    <div className="recipe-ingredient-heading"><h3>INGREDIENSER</h3><div className="recipe-scale" aria-label="Skala recept">{factor!==1&&<button className="recipe-scale-reset" type="button" onClick={()=>setFactor(1)}>Återställ</button>}<button type="button" onClick={()=>setFactor(current=>Math.max(.25,Math.round((current-.25)*100)/100))} aria-label="Minska receptet">−</button><span>{factor===1?"Original":`${formatRecipeAmount(factor)}×`}</span><button type="button" onClick={()=>setFactor(current=>Math.min(8,Math.round((current+.25)*100)/100))} aria-label="Öka receptet">+</button></div></div>
    <div className={`recipe-ingredient-groups${groups.length===1&&!groups[0].title?" single":""}`}>{groups.map((group,index)=><div className="recipe-ingredient-group" key={`${group.title}-${index}`}>{group.title&&<h4>{group.title}</h4>}<ul>{group.items.map(item=>{const amount=parseRecipeAmount(item.amount);return <li key={item.id}><b>{[amount===undefined?item.amount:formatRecipeAmount(amount*factor),item.unit].filter(Boolean).join(" ")}</b><span>{item.name}</span></li>})}</ul></div>)}</div>
  </section>
}
const normalizeRecipeSourceUrl=(value:string)=>{const trimmed=value.trim();if(!trimmed)return "";const candidate=/^https?:\/\//i.test(trimmed)?trimmed:`https://${trimmed}`;try{const parsed=new URL(candidate);return parsed.protocol==="http:"||parsed.protocol==="https:"?parsed.toString():""}catch{return ""}};
function RecipeSourceLink({recipe}:{recipe:Recipe}){const href=normalizeRecipeSourceUrl(recipe.sourceUrl||"");if(!href)return null;return <section className="recipe-source"><h3>KÄLLA</h3><a href={href} target="_blank" rel="noopener noreferrer"><ExternalLink/> VISA ORIGINALRECEPT</a></section>}
function RecipeRelated({recipe,recipes,onOpen}:{recipe:Recipe;recipes:Recipe[];onOpen:(recipe:Recipe)=>void}){
  const direct=new Set(recipe.linkedRecipeIds||[]),related=recipes.filter(value=>value.id!==recipe.id&&(direct.has(value.id)||(value.linkedRecipeIds||[]).includes(recipe.id)));
  if(!related.length)return null;
  return <section className="recipe-related"><h3>PASSAR BRA MED</h3><div>{related.map(value=><button type="button" key={value.id} onClick={()=>onOpen(value)}>{value.image?<img src={value.image} alt=""/>:<span>🍲</span>}<span><small>{recipeCategoryLabel(value)}</small><strong>{value.title}</strong></span><ChevronRight/></button>)}</div></section>;
}
function RecipeCopyMark({recipe,compact=false}:{recipe:Recipe;compact?:boolean}){
  if(!recipe.copiedFromRecipeId)return null;
  return compact?<div className="recipe-copy-mark compact"><i>KOPIA</i></div>:<div className="recipe-copy-mark"><span>Originalet av <b>{recipe.originalCreatorName||"Bubbsun-användare"}</b></span></div>;
}
const compressRecipeImage=(file:File)=>new Promise<string>((resolve,reject)=>{const image=new Image(),url=URL.createObjectURL(file);image.onload=()=>{const max=720,scale=Math.min(1,max/Math.max(image.width,image.height)),canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext("2d")?.drawImage(image,0,0,canvas.width,canvas.height);URL.revokeObjectURL(url);let quality=.68,result=canvas.toDataURL("image/webp",quality);while(result.length>120000&&quality>.35){quality-=.08;result=canvas.toDataURL("image/webp",quality)}resolve(result)};image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("Bilden kunde inte läsas"))};image.src=url});

function SortableRecipeIngredientRow({item,onUpdate,onRemove,onAddNext}:{item:RecipeIngredient;onUpdate:(id:string,key:"amount"|"unit"|"name",value:string)=>void;onRemove:(id:string)=>void;onAddNext:()=>void}) {
  const sortable=useSortable({id:item.id});
  const style={transform:CSS.Transform.toString(sortable.transform),transition:sortable.transition,zIndex:sortable.isDragging?4:undefined} as CSSProperties;
  return <div ref={sortable.setNodeRef} style={style} className={`${item.isHeading?"recipe-ingredient-heading-row":"recipe-ingredient-row"}${sortable.isDragging?" dragging":""}`}>
    <button type="button" className="recipe-ingredient-drag" aria-label="Flytta raden" title="Dra för att flytta" {...sortable.attributes} {...sortable.listeners}><GripVertical/></button>
    {item.isHeading?<>
      <input data-ingredient-heading={item.id} value={item.name} onChange={event=>onUpdate(item.id,"name",event.target.value)} placeholder="Rubrik, till exempel COLESLAW"/>
      <button type="button" className="recipe-ingredient-remove" aria-label="Ta bort delrubrik" onClick={()=>onRemove(item.id)}><X/></button>
    </>:<>
      <input data-ingredient-amount={item.id} value={item.amount} onChange={event=>onUpdate(item.id,"amount",event.target.value)} placeholder="Mängd"/>
      <input value={item.unit} onChange={event=>onUpdate(item.id,"unit",event.target.value)} placeholder="Enhet"/>
      <input value={item.name} onChange={event=>onUpdate(item.id,"name",event.target.value)} onKeyDown={event=>{if(event.key==="Enter"&&!event.nativeEvent.isComposing){event.preventDefault();onAddNext()}}} placeholder="Ingrediens"/>
      <button type="button" className="recipe-ingredient-remove" aria-label="Ta bort ingrediens" onClick={()=>onRemove(item.id)}><X/></button>
    </>}
  </div>;
}

function RecipeEditor({
  recipe,
  availableRecipes,
  account,
  lists,
  memberships,
  groups,
  currentLocation,
  onClose,
  onSave,
  onDelete,
}: {
  recipe?: Recipe;
  availableRecipes: Recipe[];
  account: Account;
  lists: BubbsunList[];
  memberships: Membership[];
  groups: Record<string, Group>;
  currentLocation: string;
  onClose: () => void;
  onSave: (recipe: Recipe, targetLocations: string[], previousLocations: string[]) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const publicationLocked =
    recipe?.publicationLocked === true || Boolean(recipe?.copiedFromRecipeId);
  const [title, setTitle] = useState(recipe?.title || ""),
    [category, setCategory] = useState(recipe?.category || ""),
    [subcategory, setSubcategory] = useState(recipe?.subcategory || ""),
    [isPublic, setIsPublic] = useState(
      recipe?.isPublic === true && !publicationLocked,
    ),
    [image, setImage] = useState(recipe?.image || ""),
    [servings, setServings] = useState<number|"">(recipe?recipe.servings||"":4),
    [servingUnit, setServingUnit] = useState(
      recipe?.servingUnit || "portioner",
    ),
    [minutes, setMinutes] = useState(recipe?.minutes || 0),
    [ingredients, setIngredients] = useState(
      recipe?.ingredients || [
        { id: crypto.randomUUID(), amount: "", unit: "", name: "" },
      ],
    ),
    [instructions, setInstructions] = useState(recipe?.instructions || ""),
    [description, setDescription] = useState(recipe?.description || ""),
    [sourceUrl, setSourceUrl] = useState(recipe?.sourceUrl || ""),
    [note, setNote] = useState(recipe?.note || ""),
    [linkedListId, setLinkedListId] = useState(recipe?.linkedListId || ""),
    [linkedRecipeIds, setLinkedRecipeIds] = useState(recipe?.linkedRecipeIds || []),
    [dietaryTags, setDietaryTags] = useState<string[]>(recipe?.dietaryTags || []),
    [linkedRecipeChoice, setLinkedRecipeChoice] = useState(""),
    [targetLocations, setTargetLocations] = useState<string[]>(recipe?.locations?.length?recipe.locations:[currentLocation]),
    [busy, setBusy] = useState(false),
    [saveError, setSaveError] = useState(""),
    [confirmDelete, setConfirmDelete] = useState(false);
  const ingredientSensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:6}}));
  const initialEditorState=useRef("");
  const ingredientOrderDirty=useRef(false);
  const editorState=JSON.stringify({title,category,subcategory,isPublic,image,servings,servingUnit,minutes,ingredients,instructions,description,sourceUrl,note,linkedListId,linkedRecipeIds,dietaryTags,targetLocations});
  if(!initialEditorState.current)initialEditorState.current=editorState;
  const editorDirty=initialEditorState.current!==editorState;
  const updateIngredient = (
    id: string,
    key: "amount" | "unit" | "name",
    value: string,
  ) =>
    setIngredients((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    );
  const addIngredientAndFocusAmount = () => {
    const id = crypto.randomUUID();
    setIngredients((current) => [
      ...current,
      { id, amount: "", unit: "", name: "" },
    ]);
    window.setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>(
        `[data-ingredient-amount="${id}"]`,
      );
      input?.focus();
      input?.select();
    }, 0);
  };
  const addIngredientHeading = () => {
    const id=crypto.randomUUID();
    setIngredients(current=>[...current,{id,amount:"",unit:"",name:"",isHeading:true}]);
    window.setTimeout(()=>document.querySelector<HTMLInputElement>(`[data-ingredient-heading="${id}"]`)?.focus(),0);
  };
  const ingredientDragEnd=(event:DragEndEvent)=>{const activeId=String(event.active.id),overId=event.over?String(event.over.id):"";if(!overId||activeId===overId)return;ingredientOrderDirty.current=true;setIngredients(current=>{const from=current.findIndex(item=>item.id===activeId),to=current.findIndex(item=>item.id===overId);return from<0||to<0?current:arrayMove(current,from,to)})};
  return (
    <div
      className="recipe-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !editorDirty && !ingredientOrderDirty.current) onClose();
      }}
    >
      <section className="recipe-editor-modal">
        <button className="recipe-close" onClick={onClose}>
          <X />
        </button>
        <h2>{recipe ? "REDIGERA RECEPT" : "NYTT RECEPT"}</h2>
        <label className="recipe-image-picker">
          {image ? (
            <>
              <img src={image} alt="" />
              <span className="recipe-image-change" aria-hidden="true">
                <ImagePlus />
              </span>
            </>
          ) : (
            <>
              <ImagePlus />
              <span>LÄGG TILL BILD</span>
              <small>Komprimeras automatiskt</small>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              try {
                setImage(await compressRecipeImage(file));
              } catch {
                window.alert("Bilden kunde inte läsas.");
              }
            }}
          />
        </label>
        <label>
          NAMN
          <input
            autoFocus
            value={title}
            maxLength={80}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Till exempel kanelbullar"
          />
        </label>
        <div className="recipe-editor-grid">
          <label>
            KATEGORI
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setSubcategory("");
              }}
            >
              {recipeCategories.map((value) => (
                <option key={value} value={value}>
                  {value || "Ingen kategori"}
                </option>
              ))}
            </select>
          </label>
          <label>
            UNDERKATEGORI
            <select
              value={subcategory}
              disabled={!category}
              onChange={(event) => setSubcategory(event.target.value)}
            >
              <option value="">Ingen underkategori</option>
              {(recipeSubcategories[category] || []).map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            ANTAL
            <input
              type="number"
              min="1"
              max="9999"
              value={servings}
              placeholder="Inget"
              onChange={(event) => setServings(event.target.value===""?"":Math.max(1,Number(event.target.value)||1))}
            />
          </label>
          <label>
            ENHET
            <input
              list="recipe-serving-units"
              maxLength={24}
              value={servingUnit}
              onChange={(event) => setServingUnit(event.target.value)}
              placeholder="portioner"
            />
            <datalist id="recipe-serving-units">
              <option value="portioner" />
              <option value="stycken" />
              <option value="kakor" />
              <option value="bullar" />
              <option value="bitar" />
              <option value="bröd" />
              <option value="muffins" />
              <option value="glas" />
              <option value="skålar" />
            </datalist>
          </label>
          <label>
            TID (MINUTER)
            <input
              type="number"
              min="0"
              max="9999"
              value={minutes || ""}
              onChange={(event) =>
                setMinutes(Math.max(0, Number(event.target.value) || 0))
              }
            />
          </label>
          <label>
            KOPPLA INKÖPSLISTA
            <select
              value={linkedListId}
              onChange={(event) => setLinkedListId(event.target.value)}
            >
              <option value="">Ingen lista</option>
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset className="recipe-dietary-editor">
          <legend>KOSTMÄRKNINGAR <small>(valfritt)</small></legend>
          <div>{recipeDietaryOptions.map(option=><label className={dietaryTags.includes(option.value)?"selected":""} key={option.value}><input type="checkbox" checked={dietaryTags.includes(option.value)} onChange={event=>setDietaryTags(current=>event.target.checked?[...new Set([...current,option.value])]:current.filter(value=>value!==option.value))}/><span>{option.icon}</span><strong>{option.label}</strong></label>)}</div>
        </fieldset>
        <label className="recipe-description-input">
          OM RECEPTET <small>(valfritt)</small>
          <textarea
            maxLength={700}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Skriv några fina ord om receptet…"
          />
        </label>
        <fieldset className="recipe-ingredients">
          <legend>INGREDIENSER</legend>
          <DndContext sensors={ingredientSensors} collisionDetection={closestCenter} onDragStart={()=>{ingredientOrderDirty.current=true}} onDragEnd={ingredientDragEnd}><SortableContext items={ingredients.map(item=>item.id)} strategy={verticalListSortingStrategy}>{ingredients.map(item=><SortableRecipeIngredientRow key={item.id} item={item} onUpdate={updateIngredient} onRemove={id=>setIngredients(current=>current.filter(value=>value.id!==id))} onAddNext={addIngredientAndFocusAmount}/>)}</SortableContext></DndContext>
          <div className="recipe-ingredient-add-actions"><button
            type="button"
            className="recipe-add-row"
            onClick={addIngredientAndFocusAmount}
          >
            <Plus /> LÄGG TILL INGREDIENS
          </button><button type="button" className="recipe-add-row" onClick={addIngredientHeading}><Plus/> LÄGG TILL DELRUBRIK</button></div>
        </fieldset>
        <fieldset className="recipe-related-editor">
          <legend>PASSAR BRA MED <small>(valfritt)</small></legend>
          {linkedRecipeIds.map(id=>{const linked=availableRecipes.find(value=>value.id===id);return linked?<div className="recipe-related-editor-row" key={id}>{linked.image?<img src={linked.image} alt=""/>:<span>🍲</span>}<strong>{linked.title}</strong><button type="button" aria-label={`Ta bort ${linked.title}`} onClick={()=>setLinkedRecipeIds(current=>current.filter(value=>value!==id))}><X/></button></div>:null})}
          <div className="recipe-related-add"><select value={linkedRecipeChoice} onChange={event=>setLinkedRecipeChoice(event.target.value)}><option value="">Välj recept…</option>{availableRecipes.filter(value=>value.id!==recipe?.id&&!linkedRecipeIds.includes(value.id)).sort((a,b)=>a.title.localeCompare(b.title,"sv-SE")).map(value=><option key={value.id} value={value.id}>{value.title}</option>)}</select><button type="button" disabled={!linkedRecipeChoice} onClick={()=>{if(linkedRecipeChoice)setLinkedRecipeIds(current=>[...current,linkedRecipeChoice]);setLinkedRecipeChoice("")}}><Plus/> KOPPLA RECEPT</button></div>
          <small>De kopplade recepten visas längst ner på receptsidan.</small>
        </fieldset>
        <label>
          GÖR SÅ HÄR
          <textarea
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            placeholder={
              "Skriv instruktionen här.\nFortsätt gärna på flera rader.\n\nHoppa över en rad för nästa steg."
            }
          />
        </label>
        {publicationLocked ? (
          <div className="recipe-publication-locked">
            <LockKeyhole />
            <span>
              <b>KOPIERAT RECEPT</b>
              <small>
                Kopian kan sparas privat eller i en grupp, men kan inte
                publiceras i Upptäck.
              </small>
            </span>
          </div>
        ) : <label className="recipe-public-toggle">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
          />
          <span>
            <b>PUBLICERA I UPPTÄCK</b>
            <small>
              Alla Bubbsun-användare kan se receptet. Originalet ligger kvar
              här.
            </small>
          </span>
        </label>}
        <label>
          ANTECKNING (VALFRITT)
          <textarea
            className="recipe-note-input"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Något bra att komma ihåg?"
          />
        </label>
        <label className="recipe-source-input">
          LÄNK TILL ORIGINALRECEPT <small>(valfritt)</small>
          <input
            type="url"
            inputMode="url"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            placeholder="https://…"
          />
        </label>
        <fieldset className="recipe-location-picker">
          <legend>VISA RECEPTET I</legend>
          <p>Samma recept kan visas på flera platser. Ändringar synkas överallt.</p>
          <div>
            {[{id:"private",name:"Privat",icon:"🔒"},...memberships.map(membership=>({id:membership.groupId,name:groups[membership.groupId]?.name||"Grupp",icon:"👥"}))].map(location=><label key={location.id}><input type="checkbox" checked={targetLocations.includes(location.id)} onChange={event=>setTargetLocations(current=>event.target.checked?[...new Set([...current,location.id])]:current.length>1?current.filter(value=>value!==location.id):current)}/><span>{location.icon}</span><strong>{location.name}</strong></label>)}
          </div>
        </fieldset>
        <div className="recipe-editor-actions">
          {saveError&&<p className="recipe-save-error" role="alert">{saveError}</p>}
          {onDelete && (
            <button
              className="recipe-delete"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 /> TA BORT
            </button>
          )}
          <button className="cancel" onClick={onClose}>
            AVBRYT
          </button>
          <button
            disabled={
              busy ||
              !title.trim() ||
              !ingredients.some((item) => !item.isHeading&&item.name.trim()) ||
              !instructions.trim()
            }
            onClick={async () => {
              setBusy(true);setSaveError("");
              try{
                const now = Date.now();
                await onSave({
                id: recipe?.id || crypto.randomUUID(),
                title: title.trim(),
                category,
                subcategory,
                isPublic: publicationLocked ? false : isPublic,
                ...(recipe?.copiedFromRecipeId?{copiedFromRecipeId:recipe.copiedFromRecipeId}:{}),
                ...(recipe?.originalCreatorId?{originalCreatorId:recipe.originalCreatorId}:{}),
                ...(recipe?.originalCreatorName?{originalCreatorName:recipe.originalCreatorName}:{}),
                ...(recipe?.originalCreatorColor?{originalCreatorColor:recipe.originalCreatorColor}:{}),
                ...(publicationLocked?{publicationLocked:true}:{}),
                image,
                servings: servings===""?0:servings,
                servingUnit: servingUnit.trim() || "portioner",
                minutes,
                ingredients: ingredients
                  .filter((item) => item.name.trim())
                  .map((item) => ({
                    ...item,
                    amount: item.isHeading?"":item.amount.trim(),
                    unit: item.isHeading?"":item.unit.trim(),
                    name: item.name.trim(),
                  })),
                instructions: instructions.trim(),
                description: description.trim(),
                sourceUrl: normalizeRecipeSourceUrl(sourceUrl),
                note: note.trim(),
                linkedListId,
                linkedRecipeIds,
                dietaryTags,
                creatorId: recipe?.creatorId || account.uid,
                creatorName: recipe?.creatorName || account.displayName,
                creatorColor:
                  recipe?.creatorColor ||
                  account.personalColor ||
                  colorOptions[0],
                createdAt: recipe?.createdAt || now,
                updatedAt: now,
                updatedBy: account.uid,
                }, targetLocations, recipe?.locations?.length?recipe.locations:[currentLocation]);
              }catch(error){
                console.error("Kunde inte spara receptet",error);
                setSaveError(`Receptet kunde inte sparas: ${error instanceof Error?error.message:"okänt databasfel"}`);
              }finally{setBusy(false)}
            }}
          >
            {busy ? "SPARAR…" : recipe ? "SPARA" : "SKAPA"}
          </button>
        </div>
      </section>
      {confirmDelete && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setConfirmDelete(false);
          }}
        >
          <div className="modal confirm-delete-modal">
            <h2>TA BORT RECEPTET?</h2>
            <p>
              Receptet “{recipe?.title}” försvinner. Detta går inte att ångra.
            </p>
            <div className="modal-actions">
              <button
                className="cancel"
                onClick={() => setConfirmDelete(false)}
              >
                AVBRYT
              </button>
              <button
                className="danger"
                onClick={async () => {
                  setBusy(true);
                  await onDelete?.();
                  setBusy(false);
                }}
                disabled={busy}
              >
                TA BORT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const recipesPerPage=20;
const recipeEmptyAsset=(name:string)=>`${import.meta.env.BASE_URL}assets/recipe-empty/${name}.webp`;
const emptyRecipeIdeas=[
  {icon:recipeEmptyAsset("croissant"),text:"Croissanter gör vilken morgon som helst lite bättre."},
  {icon:recipeEmptyAsset("pancakes"),text:"Pannkakor är alltid en bra början."},
  {icon:recipeEmptyAsset("pizza"),text:"Hemgjord pizza brukar rädda dagen."},
  {icon:recipeEmptyAsset("pasta"),text:"En riktigt god pasta går nästan alltid hem."},
  {icon:recipeEmptyAsset("stew"),text:"En varm gryta är svår att säga nej till."},
  {icon:recipeEmptyAsset("salad"),text:"En färgglad sallad kan vara precis vad som behövs."},
  {icon:recipeEmptyAsset("bread"),text:"Doften av nybakat bröd är oslagbar."},
  {icon:recipeEmptyAsset("cupcakes"),text:"Cupcakes är små, men gör folk väldigt glada."},
  {icon:recipeEmptyAsset("cookies"),text:"Kakor är ett pålitligt sätt att inviga kokboken."},
  {icon:recipeEmptyAsset("pie"),text:"En paj passar lika bra till vardag som till fest."},
] as const;
function EmptyRecipes(){const idea=useMemo(()=>emptyRecipeIdeas[Math.floor(Math.random()*emptyRecipeIdeas.length)],[]);return <div className="recipes-empty"><img src={idea.icon} alt=""/><h2>Inga recept här ännu</h2><p>Börja med något gott. {idea.text}</p></div>}
function RecipePagination({page,total,onPage}:{page:number;total:number;onPage:(page:number)=>void}){
  const pages=Math.ceil(total/recipesPerPage);if(pages<=1)return null;
  return <nav className="recipe-pagination" aria-label="Receptsidor"><button disabled={page===1} onClick={()=>onPage(page-1)}><ChevronLeft/></button>{Array.from({length:pages},(_,index)=>index+1).map(value=><button className={value===page?"selected":""} aria-current={value===page?"page":undefined} key={value} onClick={()=>onPage(value)}>{value}</button>)}<button disabled={page===pages} onClick={()=>onPage(page+1)}><ChevronRight/></button></nav>;
}

function RecipesPage({recipes,lists,privateMode,account,uid,memberships,groups,members,creating,onCreating,onMode,onSwitchGroup,onSave,onDelete,onAddToList,onCreateIngredientList,onMessageCreator,openRecipeId,onRecipeOpened}:{recipes:Recipe[];lists:BubbsunList[];privateMode:boolean;account:Account;uid:string;memberships:Membership[];groups:Record<string,Group>;members:Membership[];creating:boolean;onCreating:(value:boolean)=>void;onMode:(value:boolean)=>void;onSwitchGroup:(id:string)=>Promise<void>;onSave:(recipe:Recipe,targetLocations:string[],previousLocations:string[])=>Promise<void>;onDelete:(recipe:Recipe)=>Promise<void>;onAddToList:(recipe:Recipe,listId:string)=>Promise<void>;onCreateIngredientList:(recipe:Recipe,targetLocation:string,ingredientIds:string[])=>Promise<void>;onMessageCreator:(recipe:Recipe)=>void;openRecipeId?:string;onRecipeOpened?:()=>void}){
  const [editing,setEditing]=useState<Recipe|undefined>(),[viewing,setViewing]=useState<Recipe|undefined>(),[confirmViewingDelete,setConfirmViewingDelete]=useState<Recipe|undefined>(),[deletingViewing,setDeletingViewing]=useState(false),[search,setSearch]=useState(""),[category,setCategory]=useState(""),[subcategory,setSubcategory]=useState(""),[dietaryFilters,setDietaryFilters]=useState<string[]>([]),[maxMinutes,setMaxMinutes]=useState(0),[sortMode,setSortMode]=useState("liked"),[filterOpen,setFilterOpen]=useState(false),[spaceOpen,setSpaceOpen]=useState(false),[recipePage,setRecipePage]=useState(1),[locationRecipeCounts,setLocationRecipeCounts]=useState<Record<string,number>>({});const activeGroup=groups[account.activeGroupId];
  const categoryOptions=[{value:"",label:"Alla kategorier",count:recipes.length},...recipeCategories.filter(Boolean).map(value=>({value,label:value,count:recipes.filter(recipe=>recipe.category===value).length}))],categoryRecipes=category?recipes.filter(recipe=>recipe.category===category):recipes,availableSubcategories=category?Array.from(new Set([...(recipeSubcategories[category]||[]),...categoryRecipes.map(recipe=>recipe.subcategory||"").filter(Boolean)])):[],subcategoryOptions=[{value:"",label:category?"Alla underkategorier":"Välj kategori",count:categoryRecipes.length},...availableSubcategories.map(value=>({value,label:value,count:categoryRecipes.filter(recipe=>recipe.subcategory===value).length}))];
  const shown=recipes.filter(recipe=>(!category||recipe.category===category)&&(!subcategory||recipe.subcategory===subcategory)&&dietaryFilters.every(tag=>recipe.dietaryTags?.includes(tag))&&(maxMinutes===0||(recipe.minutes>0&&recipe.minutes<=maxMinutes))&&(!search.trim()||`${recipe.title} ${recipe.creatorName} ${recipe.category} ${recipe.subcategory||""}`.toLocaleLowerCase("sv-SE").includes(search.trim().toLocaleLowerCase("sv-SE")))).sort((a,b)=>sortMode==="newest"?(b.createdAt||0)-(a.createdAt||0):sortMode==="oldest"?(a.createdAt||0)-(b.createdAt||0):sortMode==="alpha"?a.title.localeCompare(b.title,"sv-SE"):(b.likedBy?.length||0)-(a.likedBy?.length||0)||(b.createdAt||0)-(a.createdAt||0));
  const pagedRecipes=shown.slice((recipePage-1)*recipesPerPage,recipePage*recipesPerPage);
  const creatorColor=(recipe:Recipe)=>privateMode?(account.personalColor??colorOptions[0]):(members.find(member=>member.uid===recipe.creatorId)?.color??recipe.creatorColor??account.personalColor??colorOptions[0]);
  const linkedViewingList=viewing?.linkedListId?lists.find(list=>list.id===viewing.linkedListId):undefined;
  useEffect(()=>{if(!openRecipeId)return;const recipe=recipes.find(value=>value.id===openRecipeId);if(recipe){setViewing(recipe);onRecipeOpened?.()}},[openRecipeId,recipes,onRecipeOpened]);
  useEffect(()=>{setViewing(current=>{if(!current)return current;return recipes.find(recipe=>(current.sourcePath&&recipe.sourcePath===current.sourcePath)||(recipe.id===current.id&&recipe.creatorId===current.creatorId))||current})},[recipes]);
  useEffect(()=>{const update=(location:string,values:Recipe[])=>setLocationRecipeCounts(current=>({...current,[location]:new Set(values.map(value=>`${value.creatorId}:${value.id}`)).size})),unsubscribers=[watchPrivateRecipes(uid,values=>update("private",values)),...memberships.map(membership=>watchRecipes(membership.groupId,values=>update(membership.groupId,values)))];return()=>unsubscribers.forEach(unsubscribe=>unsubscribe())},[uid,memberships.map(value=>value.groupId).sort().join("|")]);
  useEffect(()=>setRecipePage(1),[search,category,subcategory,dietaryFilters.join("|"),sortMode,privateMode,account.activeGroupId]);
  return <section className="content recipes-page">
    <div className="recipe-cookbook-primary"><label className="recipe-cookbook-search"><Search/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Sök recept eller skapare"/></label><div className="recipe-scope-wrap">
      <button className="recipe-scope-trigger" onClick={()=>setSpaceOpen(value=>!value)}>{privateMode?<LockKeyhole/>:<GroupIcon id={activeGroup?.iconId}/>}<span><small>{privateMode?"PRIVAT":"GRUPP"}</small><strong>{privateMode?"Kokboken":activeGroup?.name||"Grupp"}</strong></span><ChevronDown className={spaceOpen?"open":""}/></button>
      {spaceOpen&&<div className="recipe-scope-menu"><button className={privateMode?"selected":""} onClick={()=>{onMode(true);setSpaceOpen(false)}}><LockKeyhole/><strong>Privat</strong><span className="recipe-scope-end"><b>{locationRecipeCounts.private??0}</b>{privateMode&&<Check/>}</span></button>{memberships.map(item=><button key={item.groupId} className={!privateMode&&item.groupId===account.activeGroupId?"selected":""} onClick={()=>{void onSwitchGroup(item.groupId);setSpaceOpen(false)}}><GroupIcon id={groups[item.groupId]?.iconId}/><strong>{groups[item.groupId]?.name||"Grupp"}</strong><span className="recipe-scope-end"><b>{locationRecipeCounts[item.groupId]??0}</b>{!privateMode&&item.groupId===account.activeGroupId&&<Check/>}</span></button>)}{!memberships.length&&<button type="button" className="group-empty-state" onClick={()=>{setSpaceOpen(false);window.dispatchEvent(new CustomEvent("bubbsun:navigate",{detail:"people"}))}}><Users/><span><strong>Ingen grupp ännu</strong><small>Skapa en grupp eller gå med i en på sidan Användare &amp; grupper.</small><b>TILL ANVÄNDARE &amp; GRUPPER</b></span><ChevronRight/></button>}</div>}
    </div></div>
    <div className="recipes-toolbar recipe-cookbook-toolbar"><RecipeFilterPicker label="KATEGORI" value={category} options={categoryOptions} onChange={value=>{setCategory(value);setSubcategory("")}}/><RecipeFilterPicker label="UNDERKATEGORI" value={subcategory} options={subcategoryOptions} disabled={!category} onChange={setSubcategory}/><button type="button" className={`recipe-filter-panel-trigger${filterOpen?" open":""}`} aria-expanded={filterOpen} onClick={()=>setFilterOpen(value=>!value)}><Funnel/><span>FILTER</span>{(dietaryFilters.length>0||maxMinutes>0)&&<b>{dietaryFilters.length+(maxMinutes>0?1:0)}</b>}</button></div>
    {filterOpen&&<RecipeAdvancedFilter sortMode={sortMode} onSort={setSortMode} dietaryFilters={dietaryFilters} onDietary={setDietaryFilters} maxMinutes={maxMinutes} onMaxMinutes={setMaxMinutes}/>}
    {shown.length?<><div className="recipe-grid">{pagedRecipes.map(recipe=><button className={`recipe-card${recipe.isPublic?" shared":""}${recipe.copiedFromRecipeId?" copied":""}`} key={recipe.id} style={{"--recipe-creator":rgbaHex(creatorColor(recipe)),"--recipe-original":rgbaHex(recipe.originalCreatorColor??recipe.creatorColor??colorOptions[0])} as CSSProperties} onClick={()=>setViewing(recipe)}><RecipeLikeCount recipe={recipe}/>{recipe.image?<img src={recipe.image} alt=""/>:<span className="recipe-fallback">🍲</span>}<span><small>{recipeCategoryLabel(recipe)}</small><strong>{recipe.title}</strong><em className="recipe-card-facts">{recipe.minutes>0&&<span>⏱️ {recipe.minutes} min</span>}{recipe.servings>0&&<span>🍽️ {recipeYieldLabel(recipe)}</span>}</em></span><RecipeCopyMark recipe={recipe} compact/></button>)}</div><RecipePagination page={recipePage} total={shown.length} onPage={setRecipePage}/></>:<EmptyRecipes/>}
    {viewing&&<div className="recipe-modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setViewing(undefined)}}><article className="recipe-view" style={{"--recipe-creator":rgbaHex(creatorColor(viewing)),"--recipe-original":rgbaHex(viewing.originalCreatorColor??viewing.creatorColor??colorOptions[0])} as CSSProperties}><button className="recipe-close" onClick={()=>setViewing(undefined)}><X/></button>{viewing.image?<img className="recipe-hero" src={viewing.image} alt=""/>:<div className="recipe-hero fallback">🍲</div>}<small>{recipeCategoryLabel(viewing)}</small><h1>{viewing.title}</h1><RecipeCopyMark recipe={viewing}/><div className="recipe-view-tools"><RecipePrintButton/>{viewing.isPublic&&<RecipeShareControl recipe={viewing}/>}<RecipeCreateListControl recipe={viewing} memberships={memberships} groups={groups} onCreate={onCreateIngredientList}/>{viewing.isPublic&&<RecipeLikeButton recipe={viewing} uid={uid}/>}</div><div className="recipe-facts">{viewing.servings>0&&<span>🍽️ {recipeYieldLabel(viewing)}</span>}{viewing.minutes>0&&<span>⏱️ {viewing.minutes} minuter</span>}</div><div className="recipe-creator-line">Skapad av {viewing.creatorName}{viewing.creatorId!==uid&&<button className="recipe-message-creator" onClick={()=>onMessageCreator(viewing)} aria-label={`Skriv till ${viewing.creatorName}`}><MessageCircle/></button>}</div><RecipeUniqueViews recipe={viewing} uid={uid}/>{viewing.description&&<div className="recipe-description">{viewing.description}</div>}<RecipeIngredients recipe={viewing}/><section><h3>GÖR SÅ HÄR</h3><div className="recipe-instructions">{recipeInstructionSteps(viewing.instructions).map((step,index)=><p key={index}><b>{index+1}</b><span>{step}</span></p>)}</div></section>{viewing.note&&<aside><b>ANTECKNING</b><p>{viewing.note}</p></aside>}<RecipeSourceLink recipe={viewing}/><RecipeRelated recipe={viewing} recipes={recipes} onOpen={setViewing}/><footer><span/><div>{linkedViewingList&&<button onClick={async()=>{await onAddToList(viewing,linkedViewingList.id);window.alert("Ingredienserna är tillagda i listan ✓")}}><ListChecks/> TILL {linkedViewingList.name.toLocaleUpperCase("sv-SE")}</button>}<button className="recipe-delete-view" onClick={()=>setConfirmViewingDelete(viewing)}><Trash2/> TA BORT</button><button onClick={()=>{setViewing(undefined);setEditing(viewing)}}><Pencil/> REDIGERA</button></div></footer></article></div>}
    {confirmViewingDelete&&<div className="modal-backdrop recipe-delete-confirm-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!deletingViewing)setConfirmViewingDelete(undefined)}}><div className="modal confirm-delete-modal"><h2>{confirmViewingDelete.copiedFromRecipeId?"TA BORT KOPIAN?":"TA BORT RECEPTET?"}</h2><p>“{confirmViewingDelete.title}” tas bort.{confirmViewingDelete.copiedFromRecipeId&&<> Originalreceptet påverkas inte.</>}</p><div className="modal-actions"><button type="button" disabled={deletingViewing} onClick={()=>setConfirmViewingDelete(undefined)}>AVBRYT</button><button type="button" className="danger" disabled={deletingViewing} onClick={async()=>{setDeletingViewing(true);try{await onDelete(confirmViewingDelete);setViewing(undefined);setConfirmViewingDelete(undefined)}finally{setDeletingViewing(false)}}}>{deletingViewing?"TAR BORT…":"TA BORT"}</button></div></div></div>}
    {(creating||editing)&&<RecipeEditor recipe={editing} availableRecipes={recipes} account={account} lists={lists} memberships={memberships} groups={groups} currentLocation={privateMode?"private":account.activeGroupId} onClose={()=>{onCreating(false);setEditing(undefined)}} onSave={async(recipe,targetLocations,previousLocations)=>{await onSave(recipe,targetLocations,previousLocations);onCreating(false);setEditing(undefined)}} onDelete={editing?async()=>{await onDelete(editing);setEditing(undefined)}:undefined}/>}</section>;
}

function RecipeFilterPicker({label,value,options,onChange,disabled=false}:{label:string;value:string;options:Array<{value:string;label:string;count:number}>;onChange:(value:string)=>void;disabled?:boolean}){
  const [open,setOpen]=useState(false),selected=options.find(option=>option.value===value)||options[0];
  const pickerRef=useRef<HTMLDivElement|null>(null);
  const mobileLabel=value?(selected?.label||"Välj"):(label==="KATEGORI"?"ALLA":"VÄLJ");
  useEffect(()=>{if(!open)return;const close=(event:PointerEvent)=>{if(!pickerRef.current?.contains(event.target as Node))setOpen(false)};document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close)},[open]);
  return <div ref={pickerRef} className={`recipe-filter-picker${disabled?" disabled":""}`}><button className="recipe-filter-trigger" type="button" disabled={disabled} onClick={()=>setOpen(current=>!current)}><span><small>{label}</small><strong><span className="recipe-filter-desktop-label">{selected?.label||"Välj"}</span><span className="recipe-filter-mobile-label">{mobileLabel}</span></strong></span><i>{selected?.count??0}</i><ChevronDown className={open?"open":""}/></button>{open&&!disabled&&<div className="recipe-filter-menu">{options.map(option=><button type="button" className={option.value===value?"selected":""} key={option.value||"all"} onClick={()=>{onChange(option.value);setOpen(false)}}><span>{option.label}</span><b>{option.count}</b>{option.value===value&&<Check/>}</button>)}</div>}</div>;
}

function RecipeSortPicker({value,onChange}:{value:string;onChange:(value:string)=>void}){
  const [open,setOpen]=useState(false),options=[{value:"liked",label:"Mest gillade"},{value:"newest",label:"Senast inlagda"},{value:"oldest",label:"Äldst först"},{value:"alpha",label:"A–Ö"}],selected=options.find(option=>option.value===value)||options[0];
  const pickerRef=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{if(!open)return;const close=(event:PointerEvent)=>{if(!pickerRef.current?.contains(event.target as Node))setOpen(false)};document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close)},[open]);
  return <div ref={pickerRef} className="recipe-filter-picker recipe-sort-picker"><button className="recipe-sort-trigger" type="button" aria-label={`Sortera recept: ${selected.label}`} title={`Sortera: ${selected.label}`} aria-expanded={open} onClick={()=>setOpen(current=>!current)}><ArrowUpDown/></button>{open&&<div className="recipe-filter-menu">{options.map(option=><button type="button" className={option.value===value?"selected":""} key={option.value} onClick={()=>{onChange(option.value);setOpen(false)}}><span>{option.label}</span>{option.value===value&&<Check/>}</button>)}</div>}</div>;
}

function DiscoverRecipesPage({recipes,uid,memberships,groups,onCreateIngredientList,onSaveCopy,onMessageCreator}:{recipes:Recipe[];uid:string;memberships:Membership[];groups:Record<string,Group>;onCreateIngredientList:(recipe:Recipe,targetLocation:string,ingredientIds:string[])=>Promise<void>;onSaveCopy:(recipe:Recipe,targetLocation:string)=>Promise<void>;onMessageCreator:(recipe:Recipe)=>void}){
  const [search,setSearch]=useState(""),[category,setCategory]=useState(""),[subcategory,setSubcategory]=useState(""),[dietaryFilters,setDietaryFilters]=useState<string[]>([]),[maxMinutes,setMaxMinutes]=useState(0),[sortMode,setSortMode]=useState("liked"),[filterOpen,setFilterOpen]=useState(false),[viewing,setViewing]=useState<Recipe|undefined>(),[recipePage,setRecipePage]=useState(1);
  const categoryOptions=[{value:"",label:"Alla kategorier",count:recipes.length},...recipeCategories.filter(Boolean).map(value=>({value,label:value,count:recipes.filter(recipe=>recipe.category===value).length}))],categoryRecipes=category?recipes.filter(recipe=>recipe.category===category):recipes,availableSubcategories=category?Array.from(new Set([...(recipeSubcategories[category]||[]),...categoryRecipes.map(recipe=>recipe.subcategory||"").filter(Boolean)])):[],subcategoryOptions=[{value:"",label:category?"Alla underkategorier":"Välj kategori",count:categoryRecipes.length},...availableSubcategories.map(value=>({value,label:value,count:categoryRecipes.filter(recipe=>recipe.subcategory===value).length}))];
  const shown=recipes.filter(recipe=>(!category||recipe.category===category)&&(!subcategory||recipe.subcategory===subcategory)&&dietaryFilters.every(tag=>recipe.dietaryTags?.includes(tag))&&(maxMinutes===0||(recipe.minutes>0&&recipe.minutes<=maxMinutes))&&(!search.trim()||`${recipe.title} ${recipe.creatorName} ${recipe.category} ${recipe.subcategory||""}`.toLocaleLowerCase("sv-SE").includes(search.trim().toLocaleLowerCase("sv-SE")))).sort((a,b)=>sortMode==="newest"?(b.createdAt||0)-(a.createdAt||0):sortMode==="oldest"?(a.createdAt||0)-(b.createdAt||0):sortMode==="alpha"?a.title.localeCompare(b.title,"sv-SE"):(b.likedBy?.length||0)-(a.likedBy?.length||0)||(b.createdAt||0)-(a.createdAt||0));
  const pagedRecipes=shown.slice((recipePage-1)*recipesPerPage,recipePage*recipesPerPage);useEffect(()=>setRecipePage(1),[search,category,subcategory,dietaryFilters.join("|"),sortMode]);
  useEffect(()=>{if(!viewing)return;const current=recipes.find(recipe=>recipe.id===viewing.id&&recipe.sourcePath===viewing.sourcePath);if(current&&current!==viewing)setViewing(current)},[recipes,viewing]);
  return <section className="content recipes-page recipe-discover-page">
    <header className="recipe-discover-intro"><Compass/><div><h1>UPPTÄCK NYA RECEPT</h1><p>Goda idéer som Bubbsun-användare valt att dela.</p></div></header>
    <div className="recipes-toolbar recipe-discover-toolbar"><label><Search/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Sök recept eller skapare"/></label><RecipeFilterPicker label="KATEGORI" value={category} options={categoryOptions} onChange={value=>{setCategory(value);setSubcategory("")}}/><RecipeFilterPicker label="UNDERKATEGORI" value={subcategory} options={subcategoryOptions} disabled={!category} onChange={setSubcategory}/><button type="button" className={`recipe-filter-panel-trigger${filterOpen?" open":""}`} aria-expanded={filterOpen} onClick={()=>setFilterOpen(value=>!value)}><Funnel/><span>FILTER</span>{(dietaryFilters.length>0||maxMinutes>0)&&<b>{dietaryFilters.length+(maxMinutes>0?1:0)}</b>}</button></div>
    {filterOpen&&<RecipeAdvancedFilter sortMode={sortMode} onSort={setSortMode} dietaryFilters={dietaryFilters} onDietary={setDietaryFilters} maxMinutes={maxMinutes} onMaxMinutes={setMaxMinutes}/>}
    {shown.length?<><div className="recipe-grid">{pagedRecipes.map(recipe=><button className="recipe-card public" key={`${recipe.creatorId}-${recipe.id}`} style={{"--recipe-creator":"var(--theme-accent)"} as CSSProperties} onClick={()=>setViewing(recipe)}><RecipeLikeCount recipe={recipe}/>{recipe.image?<img src={recipe.image} alt=""/>:<span className="recipe-fallback">🍲</span>}<span><small>{recipeCategoryLabel(recipe)}</small><strong>{recipe.title}</strong><em className="recipe-card-facts">{recipe.minutes>0&&<span>⏱️ {recipe.minutes} min</span>}{recipe.servings>0&&<span>🍽️ {recipeYieldLabel(recipe)}</span>}</em><em className="recipe-card-creator"><UserRound/><span>Skapad av <b>{recipe.creatorName}</b></span></em></span></button>)}</div><RecipePagination page={recipePage} total={shown.length} onPage={setRecipePage}/></>:<div className="recipes-empty"><span>🔎</span><h2>Inga recept hittades</h2><p>Här dyker offentliga recept upp när någon delar ett.</p></div>}
    {viewing&&<div className="recipe-modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setViewing(undefined)}}><article className="recipe-view recipe-discover-view" style={{"--recipe-creator":"var(--theme-accent)"} as CSSProperties}><button className="recipe-close" onClick={()=>setViewing(undefined)}><X/></button>{viewing.image?<img className="recipe-hero" src={viewing.image} alt=""/>:<div className="recipe-hero fallback">🍲</div>}<small>{recipeCategoryLabel(viewing)}</small><h1>{viewing.title}</h1><div className="recipe-view-tools"><RecipePrintButton/><RecipeShareControl recipe={viewing}/><RecipeSaveCopyControl recipe={viewing} memberships={memberships} groups={groups} onSave={onSaveCopy}/><RecipeCreateListControl recipe={viewing} memberships={memberships} groups={groups} onCreate={onCreateIngredientList}/><RecipeLikeButton recipe={viewing} uid={uid}/></div><div className="recipe-facts">{viewing.servings>0&&<span>🍽️ {recipeYieldLabel(viewing)}</span>}{viewing.minutes>0&&<span>⏱️ {viewing.minutes} minuter</span>}</div><div className="recipe-creator-line">Skapad av {viewing.creatorName}{viewing.creatorId!==uid&&<button className="recipe-message-creator" onClick={()=>onMessageCreator(viewing)} aria-label={`Skriv till ${viewing.creatorName}`}><MessageCircle/></button>}</div><RecipeUniqueViews recipe={viewing} uid={uid}/>{viewing.description&&<div className="recipe-description">{viewing.description}</div>}<RecipeIngredients recipe={viewing}/><section><h3>GÖR SÅ HÄR</h3><div className="recipe-instructions">{recipeInstructionSteps(viewing.instructions).map((step,index)=><p key={index}><b>{index+1}</b><span>{step}</span></p>)}</div></section>{viewing.note&&<aside><b>ANTECKNING</b><p>{viewing.note}</p></aside>}<RecipeSourceLink recipe={viewing}/><RecipeRelated recipe={viewing} recipes={recipes} onOpen={setViewing}/></article></div>}
  </section>;
}

type ChatPeer={uid:string;name:string;color:number};
const chatEmoji=(value:string)=>value
  .replace(/<3/g,"❤️")
  .replace(/(^|\s)[=:]-?D(?=\s|$)/gi,"$1😄")
  .replace(/(^|\s)[=:]-?[)\]](?=\s|$)/g,"$1😊")
  .replace(/(^|\s);-?[)\]](?=\s|$)/g,"$1😉")
  .replace(/(^|\s)[=:]-?[pP](?=\s|$)/g,"$1😛")
  .replace(/(^|\s)[=:]-?[oO](?=\s|$)/g,"$1😮")
  .replace(/(^|\s)[=:]-?[(\[](?=\s|$)/g,"$1😢");
function ChatWindow({account,peer,language,onClose}:{account:Account;peer:ChatPeer;language:string;onClose:()=>void}){
  const chatId=[account.uid,peer.uid].sort().join("__"),[messages,setMessages]=useState<DirectMessage[]>([]),[text,setText]=useState(""),[busy,setBusy]=useState(false),bottom=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{let unsubscribe:(()=>void)|undefined,cancelled=false;void ensureDirectChat({uid:account.uid,name:account.displayName,color:account.personalColor??colorOptions[0]},peer).then(()=>{if(!cancelled)unsubscribe=watchDirectMessages(chatId,setMessages)}).catch(error=>console.error("Kunde inte öppna chatten",error));return()=>{cancelled=true;unsubscribe?.()}},[chatId,account.uid,account.displayName,account.personalColor,peer]);
  useEffect(()=>{void markDirectChatRead(chatId,account.uid).catch(()=>{});bottom.current?.scrollIntoView({behavior:"smooth"})},[chatId,account.uid,messages.length]);
  const send=async()=>{if(!text.trim()||busy)return;const value=chatEmoji(text);setText("");setBusy(true);try{await sendDirectMessage({uid:account.uid,name:account.displayName,color:account.personalColor??colorOptions[0]},peer,value)}catch(error){setText(value);window.alert("Meddelandet kunde inte skickas.");console.error(error)}finally{setBusy(false)}};
  return <div className="modal-backdrop chat-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="chat-window"><header><i style={{background:rgbaHex(peer.color)}}>{peer.name.slice(0,1).toUpperCase()}</i><div><small>CHATT MED</small><strong>{peer.name}</strong></div><button onClick={onClose} aria-label="Stäng"><X/></button></header><div className="chat-messages">{messages.length?messages.map(message=><div key={message.id} className={message.senderId===account.uid?"mine":"theirs"}><p>{message.text}</p><time>{new Intl.DateTimeFormat(language==="tlh"?"en":language,{hour:"2-digit",minute:"2-digit"}).format(new Date(message.createdAt))}</time></div>):<p className="chat-empty">Skriv första meddelandet 👋</p>}<div ref={bottom}/></div><form onSubmit={e=>{e.preventDefault();void send()}}><textarea autoFocus value={text} maxLength={2000} onChange={e=>setText(e.target.value)} placeholder="Skriv ett meddelande…" onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send()}}}/><button disabled={busy||!text.trim()}>SKICKA</button></form></section></div>;
}

function NewChatDialog({account,memberships,groups,onOpen,onClose}:{account:Account;memberships:Membership[];groups:Record<string,Group>;onOpen:(peer:ChatPeer)=>void;onClose:()=>void}){
  const [groupId,setGroupId]=useState(memberships[0]?.groupId||""),[people,setPeople]=useState<Membership[]>([]);
  useEffect(()=>groupId?watchGroupMembers(groupId,setPeople):undefined,[groupId]);
  return <div className="modal-backdrop chat-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="new-chat-dialog"><button className="chat-dialog-close" onClick={onClose}><X/></button><MessageCircle/><h2>NYTT MEDDELANDE</h2><div className="new-chat-pickers"><label>MIN GRUPP<select value={groupId} onChange={e=>setGroupId(e.target.value)}>{memberships.map(m=><option key={m.groupId} value={m.groupId}>{groups[m.groupId]?.name||"Grupp"}</option>)}</select></label><div><small>PERSON I GRUPPEN</small>{people.filter(p=>p.uid!==account.uid).map(person=><button key={person.uid} onClick={()=>onOpen({uid:person.uid,name:person.displayName,color:person.color})}><i style={{background:rgbaHex(person.color)}}>{person.displayName.slice(0,1)}</i><span>{person.displayName}</span><ChevronRight/></button>)}{people.filter(p=>p.uid!==account.uid).length===0&&<p>Ingen annan att skriva till i den här gruppen.</p>}</div></div></section></div>;
}

function ChatPage({account,chats,memberships,groups,language,onOpen}:{account:Account;chats:DirectChat[];memberships:Membership[];groups:Record<string,Group>;language:string;onOpen:(peer:ChatPeer)=>void}){
  const [creating,setCreating]=useState(false),dateText=(value:number)=>new Intl.DateTimeFormat(language==="tlh"?"en":language,{dateStyle:"medium",timeStyle:"short"}).format(new Date(value));
  useEffect(()=>{const open=()=>setCreating(true);window.addEventListener("bubbsun:new-chat",open);return()=>window.removeEventListener("bubbsun:new-chat",open)},[]);
  return <section className="content subpage chat-page"><div className="content-heading chat-heading"><MessageCircle/><div><h1>MEDDELANDEN</h1><p>Dina privata chattar</p></div></div>{chats.length?<div className="chat-card-list">{chats.map(chat=>{const peerId=chat.participantIds.find(id=>id!==account.uid)||"",unread=chat.lastSenderId!==account.uid&&chat.lastMessageAt>(chat.readAt?.[account.uid]||0),peer={uid:peerId,name:chat.participantNames?.[peerId]||"Bubbsun-användare",color:chat.participantColors?.[peerId]??colorOptions[0]};return <button key={chat.id} className={unread?"unread":""} style={{"--chat-peer-color":rgbaHex(peer.color)} as CSSProperties} onClick={()=>onOpen(peer)}><i style={{background:rgbaHex(peer.color)}}>{peer.name.slice(0,1).toUpperCase()}</i><span><strong>{peer.name}</strong><p>{chat.lastMessage}</p><time>{dateText(chat.lastMessageAt)}</time></span>{unread&&<b>NYTT</b>}<ChevronRight/></button>})}</div>:<div className="chat-page-empty"><MessageCircle/><h2>Inga meddelanden ännu</h2><p>{memberships.length?"Tryck på plus för att starta en chatt.":"Du kan fortfarande skriva till en receptskapare från ett recept."}</p></div>}{creating&&<NewChatDialog account={account} memberships={memberships} groups={groups} onClose={()=>setCreating(false)} onOpen={peer=>{setCreating(false);onOpen(peer)}}/>}</section>;
}

type ActivityEntry = {
  id: string;
  kind: "list" | "note" | "calendar" | "recipe" | "game";
  title: string;
  detail: string;
  at: number;
  color: number;
  isPrivate: boolean;
  targetId: string;
  isOwn: boolean;
};

function NotificationsPage({entries,seenAt,onOpen}:{entries:ActivityEntry[];seenAt:number;onOpen:(entry:ActivityEntry)=>void}) {
  const dateText=(value:number)=>new Intl.DateTimeFormat("sv-SE",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value));
  return <section className="content subpage notifications-page">
    <div className="notifications-heading"><Bell/><div><h1>NYTT FÖR DIG</h1><p>Din personliga Bubbsun-logg</p></div></div>
    {entries.length ? <div className="notifications-list">{entries.map(entry=><button key={entry.id} className={entry.at>seenAt&&!entry.isOwn?"unread":""} style={{"--activity-color":rgbaHex(entry.color)} as CSSProperties} onClick={()=>onOpen(entry)}>
      <span className="notification-icon">{entry.kind==="list"?"✓":entry.kind==="note"?"✎":entry.kind==="recipe"?"🍲":"▣"}</span>
      <span><small>{entry.detail}</small><strong>{entry.title}</strong><time>{dateText(entry.at)}</time></span>
      {entry.at>seenAt&&!entry.isOwn&&<b>NYTT</b>}<ChevronRight/>
    </button>)}</div>:<div className="notifications-empty"><Bell/><strong>Inget nytt ännu</strong><span>När något händer i dina listor, anteckningar, recept eller kalender syns det här.</span></div>}
  </section>;
}

function AuthenticatedApp() {
  const privateListsLoadedFor = useRef("");
  const listsHistoryRef = useRef<BubbsunList[]>([]);
  const privateListsHistoryRef = useRef<BubbsunList[]>([]);
  const notesHistoryRef = useRef<BubbsunNote[]>([]);
  const privateNotesHistoryRef = useRef<BubbsunNote[]>([]);
  const listOverviewScrollRef = useRef(0);
  const restoreListOverviewScrollRef = useRef(false);
  const legacyBudgetAccountMigrationRef = useRef(false);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [groups, setGroups] = useState<Record<string, Group>>({});
  const [members, setMembers] = useState<Membership[]>([]);
  const [lists, setLists] = useState<BubbsunList[]>([]);
  const [privateLists, setPrivateLists] = useState<BubbsunList[]>([]);
  const [notes,setNotes]=useState<BubbsunNote[]>([]);
  const [privateNotes,setPrivateNotes]=useState<BubbsunNote[]>([]);
  const [calendarEvents,setCalendarEvents]=useState<CalendarEvent[]>([]);
  const [privateCalendarEvents,setPrivateCalendarEvents]=useState<CalendarEvent[]>([]);
  const [budgetEntries,setBudgetEntries]=useState<BudgetEntry[]>([]);
  const [privateBudgetEntries,setPrivateBudgetEntries]=useState<BudgetEntry[]>([]);
  const [budgetSettings,setBudgetSettings]=useState<BudgetSettings>({banks:[],categoryBudgets:{},savingsGoals:[],updatedAt:0});
  const [privateBudgetSettings,setPrivateBudgetSettings]=useState<BudgetSettings>({banks:[],categoryBudgets:{},savingsGoals:[],updatedAt:0});
  const [groupBudgetEntries,setGroupBudgetEntries]=useState<Record<string,BudgetEntry[]>>({});
  const [groupBudgetSettings,setGroupBudgetSettings]=useState<Record<string,BudgetSettings>>({});
  const [recipes,setRecipes]=useState<Recipe[]>([]);
  const [privateRecipes,setPrivateRecipes]=useState<Recipe[]>([]);
  const [publicRecipes,setPublicRecipes]=useState<Recipe[]>([]);
  const [privateMode, setPrivateMode] = useState(()=>localStorage.getItem("bubbsun-private-mode")==="true");
  const [page, setPage] = useState<Page>(()=>{const saved=localStorage.getItem("bubbsun-last-page") as Page|null;return saved&&["lists","notes","calendar","meal-planner","recipes","recipe-discover","budget","notifications","chat","people","settings","support","about","help","privacy","feedback","versions","admin"].includes(saved)?saved:"lists"});
  const [selected, setSelected] = useState<BubbsunList | null>(null);
  const [selectedPrivate, setSelectedPrivate] = useState(false);
  const [selectedNote,setSelectedNote]=useState<BubbsunNote|null>(null);
  const [selectedNotePrivate,setSelectedNotePrivate]=useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addingNote,setAddingNote]=useState(false);
  const [addingCalendar,setAddingCalendar]=useState(false);
  const [addingMealPlan,setAddingMealPlan]=useState(false);
  const [addingBudget,setAddingBudget]=useState(false);
  const [budgetCalculatorOpen,setBudgetCalculatorOpen]=useState(false);
  const [addingRecipe,setAddingRecipe]=useState(false);
  const [activityCalendarEventId,setActivityCalendarEventId]=useState("");
  const [activityRecipeId,setActivityRecipeId]=useState("");
  const [notificationPageSeenAt,setNotificationPageSeenAt]=useState<number|null>(null);
  const [listToolsOpen, setListToolsOpen] = useState(false);
  const [themeId, setThemeId] = useState(
    () => localStorage.getItem("bubbsun-theme") || "retro",
  );
  const [language, setLanguage] = useState(
    () => localStorage.getItem("bubbsun-language") || "sv",
  );
  const [globalPin, setGlobalPin] = useState<GlobalPin | null>(null);
  const [followedListIds, setFollowedListIds] = useState<Set<string>>(
    new Set(),
  );
  const [followedNoteIds,setFollowedNoteIds]=useState<Set<string>>(new Set());
  const [listReadAt,setListReadAt]=useState<Map<string,number>>(new Map());
  const [selectedUnreadAfter,setSelectedUnreadAfter]=useState(NEW_BADGE_EPOCH);
  const notifiedVersions = useRef<Record<string, number>>({});
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [adminStartTab,setAdminStartTab]=useState<"stats"|"members"|"reports">("stats");
  const [themePalettes, setThemePalettes] = useState<
    Record<string, ThemePalette>
  >({});
  const [allAdminLists, setAllAdminLists] = useState<BubbsunList[]>([]);
  const [allAdminPrivateLists, setAllAdminPrivateLists] = useState<
    BubbsunList[]
  >([]);
  const [adminUserCounts,setAdminUserCounts]=useState<Record<string,AdminUserCounts>>({});
  const [adminMessageCount,setAdminMessageCount]=useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [groupOnlineUserIds,setGroupOnlineUserIds]=useState<Set<string>>(new Set());
  const [directChats,setDirectChats]=useState<DirectChat[]>([]);
  const [chatPeer,setChatPeer]=useState<ChatPeer|null>(null);
  const [saveConflict, setSaveConflict] = useState(false);
  const [databaseReady, setDatabaseReady] = useState(false);
  const previousPageRef = useRef<Page>(page);
  const recipePublicationsReconciledFor=useRef("");

  useEffect(() => {
    listsHistoryRef.current = lists;
  }, [lists]);

  useEffect(() => {
    privateListsHistoryRef.current = privateLists;
  }, [privateLists]);

  useEffect(()=>{notesHistoryRef.current=notes},[notes]);
  useEffect(()=>{privateNotesHistoryRef.current=privateNotes},[privateNotes]);

  useEffect(()=>{
    const stablePage=page==="note"?"notes":page==="list"?"lists":page;
    localStorage.setItem("bubbsun-last-page",stablePage);
  },[page]);

  useEffect(()=>{
    localStorage.setItem("bubbsun-private-mode",String(privateMode));
    const currentState=window.history.state??{};
    window.history.replaceState({...currentState,privateMode},"");
  },[privateMode]);

  useEffect(() => {
    const currentState = window.history.state ?? {};
    if (!currentState.bubbsunPage) {
      window.history.replaceState(
        { ...currentState, bubbsunPage: page, privateMode },
        "",
      );
    } else {
      if(typeof currentState.privateMode==="boolean")setPrivateMode(currentState.privateMode);
      setPage(currentState.bubbsunPage==="list"?"lists":currentState.bubbsunPage==="note"?"notes":currentState.bubbsunPage);
    }

    const restoreFromHistory = (event: PopStateEvent) => {
      const state = event.state as
        | {
            bubbsunPage?: Page;
            listId?: string;
            privateList?: boolean;
            noteId?: string;
            privateNote?: boolean;
            privateMode?: boolean;
          }
        | null;
      if (!state?.bubbsunPage) return;

      if(!window.matchMedia("(min-width: 900px)").matches)setMenuOpen(false);
      setListToolsOpen(false);
      if (typeof state.privateMode === "boolean")
        setPrivateMode(state.privateMode);

      if (state.bubbsunPage === "list" && state.listId) {
        const isPrivate = state.privateList === true;
        const restored = (isPrivate
          ? privateListsHistoryRef.current
          : listsHistoryRef.current
        ).find((candidate) => candidate.id === state.listId);
        if (restored) {
          setSelected(restored);
          setSelectedPrivate(isPrivate);
          setSelectedUnreadAfter(Number.MAX_SAFE_INTEGER);
          setPage("list");
          return;
        }
      }

      if(state.bubbsunPage==="note"&&state.noteId){
        const isPrivate=state.privateNote===true,restored=(isPrivate?privateNotesHistoryRef.current:notesHistoryRef.current).find(candidate=>candidate.id===state.noteId);
        if(restored){setSelectedNote(restored);setSelectedNotePrivate(isPrivate);setPage("note");return;}
      }

      setSelected(null);
      setPage(state.bubbsunPage === "list" ? "lists" : state.bubbsunPage==="note"?"notes":state.bubbsunPage);
    };

    window.addEventListener("popstate", restoreFromHistory);
    return () => window.removeEventListener("popstate", restoreFromHistory);
  }, []);

  useEffect(()=>{
    const state=window.history.state as {bubbsunPage?:Page;listId?:string;privateList?:boolean;noteId?:string;privateNote?:boolean}|null;
    if(state?.bubbsunPage==="list"&&state.listId&&!selected){const isPrivate=state.privateList===true,restored=(isPrivate?privateLists:lists).find(item=>item.id===state.listId);if(restored){setSelected(restored);setSelectedPrivate(isPrivate);setPage("list");}}
    if(state?.bubbsunPage==="note"&&state.noteId&&!selectedNote){const isPrivate=state.privateNote===true,restored=(isPrivate?privateNotes:notes).find(item=>item.id===state.noteId);if(restored){setSelectedNote(restored);setSelectedNotePrivate(isPrivate);setPage("note");}}
  },[lists,privateLists,notes,privateNotes,selected,selectedNote]);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (next) => {
        setDatabaseReady(false);
        if (next) {
          const storedPrivateLists = loadPrivate(next.uid);
          privateListsLoadedFor.current = next.uid;
          setPrivateLists(storedPrivateLists);
        } else {
          privateListsLoadedFor.current = "";
          setPrivateLists([]);
        }
        setUser(next);
        if (!next) return;
        const waitUntilVisible = () =>
          document.visibilityState === "visible"
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                const visible = () => {
                  if (document.visibilityState !== "visible") return;
                  document.removeEventListener("visibilitychange", visible);
                  resolve();
                };
                document.addEventListener("visibilitychange", visible);
              });
        await waitUntilVisible();
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            await ensureAccount(next);
            await migratePrivateLists(next.uid, loadPrivate(next.uid));
            setDatabaseReady(true);
            return;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            const transitional = /closing|hidden|terminated|network/i.test(
              message,
            );
            console.error("Bubbsun database startup failed", {
              attempt,
              message,
              error,
            });
            if (!transitional || attempt === 2) {
              setLoginError(
                "Kunde inte ansluta till Bubbsun. Stäng appen helt och försök igen.",
              );
              return;
            }
            await new Promise((resolve) =>
              setTimeout(resolve, 500 * (attempt + 1)),
            );
            await waitUntilVisible();
          }
        }
      }),
    [],
  );
  const needsLists=["lists","list","calendar","meal-planner","recipes","recipe-discover","notifications"].includes(page),needsNotes=["notes","note","notifications"].includes(page),needsRecipes=["recipes","recipe-discover","meal-planner","notifications"].includes(page),needsMembers=["lists","list","notes","note","calendar","meal-planner","recipes","notifications","people"].includes(page),needsFollowedContent=["lists","notes","notifications"].includes(page),needsListReadStates=["lists","notifications"].includes(page),isAdminPage=page==="admin";
  useEffect(()=>user&&databaseReady?watchDirectChats(user.uid,setDirectChats):undefined,[user,databaseReady]);
  useEffect(()=>needsMembers?watchKnownOnlineUserIds(members.map(member=>member.uid),setGroupOnlineUserIds):undefined,[members,needsMembers]);
  useEffect(()=>user&&databaseReady&&privateMode&&needsNotes?watchPrivateNotes(user.uid,setPrivateNotes):undefined,[user,databaseReady,privateMode,needsNotes]);
  useEffect(()=>user&&databaseReady&&privateMode?watchPrivateCalendarEvents(user.uid,setPrivateCalendarEvents):undefined,[user,databaseReady,privateMode]);
  useEffect(()=>user&&databaseReady&&page==="budget"?watchPrivateBudgetEntries(user.uid,setPrivateBudgetEntries):undefined,[user,databaseReady,page]);
  useEffect(()=>user&&databaseReady&&page==="budget"?watchPrivateBudgetSettings(user.uid,setPrivateBudgetSettings):undefined,[user,databaseReady,page]);
  useEffect(()=>{if(!databaseReady||page!=="budget")return;const ids=memberships.map(item=>item.groupId),unsubs=ids.map(groupId=>watchBudgetSettings(groupId,settings=>setGroupBudgetSettings(old=>({...old,[groupId]:settings}))));setGroupBudgetSettings(old=>Object.fromEntries(Object.entries(old).filter(([id])=>ids.includes(id))));return()=>unsubs.forEach(unsub=>unsub())},[databaseReady,memberships,page]);
  useEffect(()=>{if(!databaseReady||page!=="budget"||!privateMode)return;const membershipIds=new Set(memberships.map(item=>item.groupId)),ids=Array.from(new Set(privateBudgetSettings.banks.flatMap(bank=>bank.accounts.flatMap(item=>item.linkedGroupId&&membershipIds.has(item.linkedGroupId)?[item.linkedGroupId]:[])))),unsubs=ids.map(groupId=>watchBudgetEntries(groupId,entries=>setGroupBudgetEntries(old=>({...old,[groupId]:entries}))));setGroupBudgetEntries(old=>Object.fromEntries(Object.entries(old).filter(([id])=>ids.includes(id))));return()=>unsubs.forEach(unsub=>unsub())},[databaseReady,page,privateMode,memberships,privateBudgetSettings]);
  useEffect(()=>user&&databaseReady&&privateMode&&needsRecipes?watchPrivateRecipes(user.uid,setPrivateRecipes):undefined,[user,databaseReady,privateMode,needsRecipes]);
  useEffect(()=>user&&databaseReady&&["recipes","recipe-discover"].includes(page)?watchPublicRecipes(setPublicRecipes):undefined,[user,databaseReady,page]);
  useEffect(()=>{if(!user||!databaseReady||!["recipes","recipe-discover"].includes(page)||recipePublicationsReconciledFor.current===user.uid)return;recipePublicationsReconciledFor.current=user.uid;void reconcileRecipePublications(user.uid).catch(error=>{recipePublicationsReconciledFor.current="";console.error("Kunde inte städa offentliga recept",error)})},[user,databaseReady,page]);
  useEffect(
    () =>
      user && databaseReady ? watchAccount(user.uid, setAccount) : undefined,
    [user, databaseReady],
  );
  useEffect(() => {
    if (!user || !databaseReady) return;
    const touch = () => {
      if (document.visibilityState === "visible") void touchPresence(user.uid);
    };
    touch();
    const timer = window.setInterval(touch, 3 * 60 * 1000);
    document.addEventListener("visibilitychange", touch);
    window.addEventListener("focus", touch);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", touch);
      window.removeEventListener("focus", touch);
    };
  }, [user, databaseReady]);
  useEffect(() => {
    if ((!account?.megaSuperBoss && !account?.founder)||!isAdminPage) {
      setOnlineCount(0);
      return;
    }
    return watchOnlineCount(setOnlineCount);
  }, [account?.megaSuperBoss, account?.founder,isAdminPage]);
  useEffect(() => {
    if ((!account?.megaSuperBoss && !account?.founder)||!isAdminPage) {
      setOnlineUserIds(new Set());
      return;
    }
    return watchOnlineUserIds(setOnlineUserIds);
  }, [account?.megaSuperBoss, account?.founder,isAdminPage]);
  useEffect(
    () =>
      user && databaseReady
        ? watchMemberships(user.uid, setMemberships)
        : undefined,
    [user, databaseReady],
  );
  useEffect(
    () =>
      user && databaseReady && needsLists
        ? watchPrivateLists(user.uid, setPrivateLists)
        : undefined,
    [user, databaseReady, needsLists],
  );
  useEffect(() => {
    const unsubs = memberships.map((m) =>
      watchGroup(m.groupId, (g) =>
        setGroups((old) => {
          const next = { ...old };
          if (g) next[m.groupId] = g;
          else delete next[m.groupId];
          return next;
        }),
      ),
    );
    return () => unsubs.forEach((x) => x());
  }, [memberships]);
  useEffect(()=>{if(!account?.activeGroupId||privateMode||!needsMembers)return;return watchGroupMembers(account.activeGroupId,setMembers)},[account?.activeGroupId,privateMode,needsMembers]);
  useEffect(()=>{if(!account?.activeGroupId||privateMode||!needsLists)return;return watchLists(account.activeGroupId,setLists)},[account?.activeGroupId,privateMode,needsLists]);
  useEffect(()=>{if(!account?.activeGroupId||privateMode||!needsNotes)return;return watchNotes(account.activeGroupId,setNotes);},[account?.activeGroupId,privateMode,needsNotes]);
  useEffect(()=>{if(!account?.activeGroupId||privateMode){setCalendarEvents([]);return;}return watchCalendarEvents(account.activeGroupId,setCalendarEvents);},[account?.activeGroupId,privateMode]);
  useEffect(()=>{if(!account?.activeGroupId||privateMode||page!=="budget")return;return watchBudgetEntries(account.activeGroupId,setBudgetEntries);},[account?.activeGroupId,privateMode,page]);
  useEffect(()=>{if(!account?.activeGroupId||privateMode||page!=="budget")return;return watchBudgetSettings(account.activeGroupId,setBudgetSettings);},[account?.activeGroupId,privateMode,page]);
  useEffect(()=>{if(!account?.activeGroupId||privateMode||!needsRecipes)return;return watchRecipes(account.activeGroupId,setRecipes);},[account?.activeGroupId,privateMode,needsRecipes]);
  useEffect(() => {
    if (user && privateListsLoadedFor.current === user.uid)
      localStorage.setItem(
        `bubbsun-private-${user.uid}`,
        JSON.stringify(privateLists),
      );
  }, [privateLists, user]);
  useEffect(
    () => (databaseReady ? watchGlobalPin(setGlobalPin) : undefined),
    [databaseReady],
  );
  useEffect(()=>user&&databaseReady&&needsFollowedContent?watchFollowedContent(user.uid,values=>{setFollowedListIds(values.lists);setFollowedNoteIds(values.notes)}):undefined,[user,databaseReady,needsFollowedContent]);
  useEffect(
    () => user&&databaseReady&&needsListReadStates?watchListReadStates(user.uid,setListReadAt):undefined,
    [user,databaseReady,needsListReadStates],
  );
  useEffect(() => {
    if (!user || privateMode || !account?.activeGroupId) return;
    for (const list of lists) {
      const key = `${account.activeGroupId}_${list.id}`,
        version = list.updatedAt || 0,
        previous = notifiedVersions.current[key];
      if (
        previous &&
        version > previous &&
        list.updatedBy &&
        list.updatedBy !== user.uid &&
        followedListIds.has(key) &&
        "Notification" in window &&
        Notification.permission === "granted"
      )
        new Notification(`Bubbsun · ${list.name}`, {
          body: "Listan har ändrats. Tryck för att öppna Bubbsun.",
          icon: "/assets/bubbsun-header-illustrated.png",
        });
      notifiedVersions.current[key] = Math.max(previous || 0, version);
    }
  }, [lists, user, account?.activeGroupId, privateMode, followedListIds]);
  useEffect(()=>{
    if(!user||privateMode||!account?.activeGroupId)return;
    for(const note of notes){
      const key=`note_${account.activeGroupId}_${note.id}`,version=note.updatedAt||0,previous=notifiedVersions.current[key];
      if(previous&&version>previous&&note.history?.[0]?.uid!==user.uid&&followedNoteIds.has(note.id)&&"Notification" in window&&Notification.permission==="granted")new Notification(`Bubbsun · ${note.title}`,{body:"Anteckningen har ändrats. Tryck för att öppna Bubbsun.",icon:"/assets/bubbsun-header-illustrated.png"});
      notifiedVersions.current[key]=Math.max(previous||0,version);
    }
  },[notes,user,account?.activeGroupId,privateMode,followedNoteIds]);
  useEffect(() => {
    if (!account?.megaSuperBoss && !account?.founder) return;
    return watchThemePalettes(setThemePalettes);
  }, [account?.megaSuperBoss, account?.founder]);
  useEffect(() => {
    if ((!account?.megaSuperBoss && !account?.founder)||!isAdminPage) return;
    const a=watchAllAccounts(setAllAccounts),b=watchReports(setReports),c=watchAllLists(setAllAdminLists),d=watchAllPrivateLists(setAllAdminPrivateLists);
    return()=>{a();b();c();d()};
  }, [account?.megaSuperBoss, account?.founder,isAdminPage]);
  useEffect(()=>{
    if((!account?.megaSuperBoss&&!account?.founder)||!isAdminPage)return;
    return watchAdminUserCounts(allAccounts.map(item=>item.uid),setAdminUserCounts);
  },[account?.megaSuperBoss,account?.founder,isAdminPage,allAccounts.map(item=>item.uid).join("|")]);
  useEffect(()=>{
    if((!account?.megaSuperBoss&&!account?.founder)||!isAdminPage)return;
    return watchTotalDirectMessageCount(setAdminMessageCount);
  },[account?.megaSuperBoss,account?.founder,isAdminPage]);
  useEffect(() => {
    localStorage.setItem("bubbsun-theme", themeId);
    if (user && account && account.themeId !== themeId) {
      void savePreferences(user.uid, { themeId });
    }
  }, [account?.themeId, themeId, user?.uid]);
  useEffect(() => {
    localStorage.setItem("bubbsun-language", language);
  }, [language]);
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const previousPage = previousPageRef.current;
    const shouldRestoreListOverview =
      page === "lists" &&
      previousPage === "list" &&
      restoreListOverviewScrollRef.current;
    const targetTop = shouldRestoreListOverview
      ? listOverviewScrollRef.current
      : 0;
    previousPageRef.current = page;
    if (previousPage === "list" && page !== "list")
      restoreListOverviewScrollRef.current = false;
    window.scrollTo({ top: targetTop, left: 0, behavior: "auto" });
    const first = requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        window.scrollTo({ top: targetTop, left: 0, behavior: "auto" }),
      ),
    );
    return () => cancelAnimationFrame(first);
  }, [page]);
  useEffect(() => {
    const update = () =>
      document.body.classList.toggle("at-page-top", window.scrollY < 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      document.body.classList.remove("at-page-top");
    };
  }, []);
  const activeGroup = account ? groups[account.activeGroupId] : undefined;
  const visibleLists = privateMode ? privateLists : lists;
  const activeSelected = selected
    ? visibleLists.find((x) => x.id === selected.id) || selected
    : null;
  const groupName = activeGroup?.name || "Ingen grupp vald";
  const activeMembership = memberships.find(
    (item) => item.groupId === account?.activeGroupId,
  );
  const role = activeMembership?.role.toLowerCase() || "";
  const canManageGroup =
    account?.megaSuperBoss === true ||
    account?.founder === true ||
    role.includes("boss") ||
    role.includes("owner") ||
    role.includes("super");
  const themeBase =
    themes.find(
      (item) => item.id === themeId && (!item.supporter || account?.supporter),
    ) || themes[0];
  const activeTheme = {
    ...themeBase,
    ...usableThemePalette(themeBase.id, themePalettes[themeBase.id]),
  };
  const themeStyle = {
    "--theme-bg": activeTheme.bg,
    "--theme-paper": activeTheme.paper,
    "--theme-panel": activeTheme.panel,
    "--theme-text": activeTheme.text,
    "--theme-accent": activeTheme.accent,
    "--theme-outline": activeTheme.outline,
    "--theme-header": activeTheme.header || activeTheme.panel,
    "--theme-header-button": activeTheme.headerButton || activeTheme.accent,
    "--theme-brand-decoration": activeTheme.brandDecoration || activeTheme.accent,
    "--theme-brand-suffix": activeTheme.brandSuffix || activeTheme.text,
    "--theme-calendar-event-bg": activeTheme.calendarEventBackground || activeTheme.paper,
  } as CSSProperties;

  useEffect(() => {
    void getRedirectResult(auth).catch((error) => {
      console.error("Google redirect sign-in failed", error);
      setLoginError("Google-inloggningen kunde inte slutföras. Försök igen.");
    });
  }, []);
  const login = async () => {
    setBusy(true);
    setLoginError("");
    try {
      const provider = new GoogleAuthProvider();
      // Keep the whole sign-in result on bubbsun.se. Firebase redirect sign-in
      // uses the firebaseapp.com helper domain and some Android browsers return
      // without carrying that cross-domain session back to Bubbsun. A popup or
      // custom tab starts directly from this click and keeps the session intact.
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Google sign-in failed", e);
      const code = (e as { code?: string })?.code;
      // Android may close the custom tab with popup-closed-by-user while the
      // successful Firebase session is still arriving asynchronously.
      if (code === "auth/popup-closed-by-user") {
        const signedIn = await new Promise<boolean>((resolve) => {
          const deadline = Date.now() + 8000;
          const check = () => {
            if (auth.currentUser) resolve(true);
            else if (Date.now() >= deadline) resolve(false);
            else window.setTimeout(check, 250);
          };
          check();
        });
        if (signedIn) return;
      }
      setLoginError(
        code === "auth/popup-blocked"
          ? "Inloggningsfönstret blockerades. Tillåt popup-fönster för Bubbsun och försök igen. (auth/popup-blocked)"
          : code === "auth/popup-closed-by-user"
            ? "Google-fönstret stängdes innan inloggningen blev klar. Försök igen. (auth/popup-closed-by-user)"
            : `Google-inloggningen kunde inte slutföras. Försök igen.${code ? ` (${code})` : ""}`,
      );
    } finally {
      setBusy(false);
    }
  };
  const loginWithGoogleCredential = async (idToken: string) => {
    setBusy(true);
    setLoginError("");
    try {
      await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
    } catch (e) {
      console.error("Google credential sign-in failed", e);
      const code = (e as { code?: string })?.code;
      setLoginError(
        `Google-inloggningen kunde inte slutföras.${code ? ` (${code})` : ""}`,
      );
    } finally {
      setBusy(false);
    }
  };
  const navigate = (next: Page) => {
    if (next !== page || page === "list")
      window.history.pushState(
        { bubbsunPage: next, privateMode },
        "",
      );
    setPage(next);
    setSelected(null);
    if(!window.matchMedia("(min-width: 900px)").matches)setMenuOpen(false);
    setListToolsOpen(false);
  };
  useEffect(()=>{
    const handleNavigate=(event:Event)=>{
      const next=(event as CustomEvent<Page>).detail;
      if(next)navigate(next);
    };
    window.addEventListener("bubbsun:navigate",handleNavigate);
    return()=>window.removeEventListener("bubbsun:navigate",handleNavigate);
  });
  const openList = (list: BubbsunList, isPrivate: boolean) => {
    restoreListOverviewScrollRef.current = page === "lists";
    if (page === "lists") listOverviewScrollRef.current = window.scrollY;
    if(!isPrivate&&user&&account?.activeGroupId){
      const key=`${account.activeGroupId}_${list.id}`;
      setSelectedUnreadAfter(listReadAt.get(key)??NEW_BADGE_EPOCH);
      void markListSeen(user.uid,account.activeGroupId,list.id);
    } else setSelectedUnreadAfter(Number.MAX_SAFE_INTEGER);
    setSelected(list);
    setSelectedPrivate(isPrivate);
    setListToolsOpen(false);
    window.history.pushState(
      {
        bubbsunPage: "list",
        listId: list.id,
        privateList: isPrivate,
        privateMode,
      },
      "",
    );
    setPage("list");
  };
  const saveChanged = async (next: BubbsunList) => {
    const previous = activeSelected;
    setSelected(next);
    if (selectedPrivate) {
      setPrivateLists((old) => old.map((x) => (x.id === next.id ? next : x)));
    } else {
      setLists((old) => old.map((x) => (x.id === next.id ? next : x)));
    }
    try {
      if (selectedPrivate && user) {
        await savePrivateList(user.uid, next);
      } else if (account && user) {
        const revision = await saveList(account.activeGroupId, next, user.uid);
        const saved = { ...next, revision };
        setSelected(saved);
        setLists((old) => old.map((x) => (x.id === saved.id ? saved : x)));
      }
    } catch (error) {
      if (previous) {
        setSelected(previous);
        if (selectedPrivate) setPrivateLists((old) => old.map((x) => (x.id === previous.id ? previous : x)));
        else setLists((old) => old.map((x) => (x.id === previous.id ? previous : x)));
      }
      if (error instanceof Error && error.message === "LIST_CONFLICT") setSaveConflict(true);
      console.error("Could not save list change", error);
    }
  };
  const inviteFriend = async () => {
    if (!user) return;
    const url = `https://www.bubbsun.se/?invite=${encodeURIComponent(user.uid)}`,
      text = `${account?.displayName || "En vän"} bjuder in dig till Bubbsun – listor för dig, familjen och vännerna.\n\n${url}`;
    try {
      if (navigator.share)
        await navigator.share({ title: "Bjud in till Bubbsun", text, url });
      else
        location.href = `mailto:?subject=${encodeURIComponent("Du är bjuden till Bubbsun")}&body=${encodeURIComponent(text)}`;
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError")
        location.href = `mailto:?subject=${encodeURIComponent("Du är bjuden till Bubbsun")}&body=${encodeURIComponent(text)}`;
    }
  };
  const addNewList = async (values: {
    name: string;
    icon: string;
    iconColor: number;
    listType: string;
    packPeople: string[];
  }) => {
    if (!user || !values.name.trim()) return;
    if (privateMode) {
      const next: BubbsunList = {
        id: crypto.randomUUID(),
        ...values,
        creatorId: user.uid,
        sortMode: "custom",
        doneFirst: false,
        doneExpanded: false,
        order: privateLists.length,
        items: [],
      };
      setPrivateLists((old) => [...old, next]);
      await savePrivateList(user.uid, next);
    } else if (account?.activeGroupId) {
      const created = await createList(
        account.activeGroupId,
        values.name,
        user.uid,
        lists.length,
        values.listType,
      );
      await saveList(
        account.activeGroupId,
        { ...created, icon: values.icon, iconColor: values.iconColor, packPeople: values.packPeople },
        user.uid,
      );
    }
    setAdding(false);
  };
  const reorderLists = async (from: number, to: number) => {
    if (!account || !user) return;
    const source = privateMode
      ? [...privateLists].sort(
          (a, b) =>
            Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
            a.order - b.order,
        )
      : lists;
    const reordered = arrayMove(source, from, to).map((item, index) => ({
      ...item,
      order: index,
    }));
    if (privateMode) {
      setPrivateLists(reordered);
      await Promise.all(
        reordered.map((item) => savePrivateList(user.uid, item)),
      );
    } else if (account.activeGroupId) {
      const groupId = account.activeGroupId,
        actorId = user.uid;
      setLists(reordered);
      await Promise.all(
        reordered.map((item) => saveList(groupId, item, actorId)),
      );
    }
  };
  const editList = async (
    list: BubbsunList,
    values: { name: string; icon: string; iconColor: number; listType: string; packPeople:string[] },
  ) => {
    const next = { ...list, ...values };
    if (privateMode && user) {
      setPrivateLists((old) =>
        old.map((item) => (item.id === list.id ? next : item)),
      );
      await savePrivateList(user.uid, next);
    } else if (account?.activeGroupId && user)
      await saveList(account.activeGroupId, next, user.uid);
  };
  const deleteList = async (list: BubbsunList) => {
    if (privateMode && user) {
      setPrivateLists((old) => old.filter((item) => item.id !== list.id));
      await removePrivateList(user.uid, list.id);
    } else if (account?.activeGroupId)
      await removeList(account.activeGroupId, list.id);
  };
  const togglePrivatePin = async (list: BubbsunList) => {
    if (!user) return;
    const next = { ...list, pinned: !list.pinned };
    setPrivateLists((old) =>
      old.map((item) => (item.id === list.id ? next : item)),
    );
    await savePrivateList(user.uid, next);
  };
  const moveItemBetweenLists = async (item: ListItem, targetId: string) => {
    if (!user || !activeSelected) return;
    const sourceLists = selectedPrivate ? privateLists : lists,
      target = sourceLists.find((candidate) => candidate.id === targetId);
    if (!target || target.id === activeSelected.id) return;
    const sourceNext = {
      ...activeSelected,
      items: activeSelected.items.filter(
        (candidate) => candidate.id !== item.id,
      ),
    };
    const movedItem = target.items.some((candidate) => candidate.id === item.id)
      ? { ...item, id: crypto.randomUUID() }
      : item;
    const targetNext = { ...target, items: [movedItem, ...target.items] };
    setSelected(sourceNext);
    if (selectedPrivate) {
      setPrivateLists((old) =>
        old.map((candidate) =>
          candidate.id === sourceNext.id
            ? sourceNext
            : candidate.id === targetNext.id
              ? targetNext
              : candidate,
        ),
      );
      await Promise.all([
        savePrivateList(user.uid, sourceNext),
        savePrivateList(user.uid, targetNext),
      ]);
    } else if (account?.activeGroupId) {
      setLists((old) =>
        old.map((candidate) =>
          candidate.id === sourceNext.id
            ? sourceNext
            : candidate.id === targetNext.id
              ? targetNext
              : candidate,
        ),
      );
      await Promise.all([
        saveList(account.activeGroupId, sourceNext, user.uid),
        saveList(account.activeGroupId, targetNext, user.uid),
      ]);
    }
  };
  const moveItemsBetweenLists = async (
    itemsToMove: ListItem[],
    targetId: string,
  ) => {
    if (!user || !activeSelected || !itemsToMove.length) return;
    const sourceLists = selectedPrivate ? privateLists : lists,
      target = sourceLists.find((candidate) => candidate.id === targetId);
    if (!target || target.id === activeSelected.id) return;
    const movingIds = new Set(itemsToMove.map((item) => item.id)),
      targetIds = new Set(target.items.map((item) => item.id));
    const sourceNext = {
      ...activeSelected,
      items: activeSelected.items.filter((item) => !movingIds.has(item.id)),
    };
    const safeItems = itemsToMove.map((item) =>
      targetIds.has(item.id) ? { ...item, id: crypto.randomUUID() } : item,
    );
    const targetNext = { ...target, items: [...safeItems, ...target.items] };
    setSelected(sourceNext);
    if (selectedPrivate) {
      setPrivateLists((old) =>
        old.map((candidate) =>
          candidate.id === sourceNext.id
            ? sourceNext
            : candidate.id === targetNext.id
              ? targetNext
              : candidate,
        ),
      );
      await Promise.all([
        savePrivateList(user.uid, sourceNext),
        savePrivateList(user.uid, targetNext),
      ]);
    } else if (account?.activeGroupId) {
      setLists((old) =>
        old.map((candidate) =>
          candidate.id === sourceNext.id
            ? sourceNext
            : candidate.id === targetNext.id
              ? targetNext
              : candidate,
        ),
      );
      await Promise.all([
        saveList(account.activeGroupId, sourceNext, user.uid),
        saveList(account.activeGroupId, targetNext, user.uid),
      ]);
    }
  };
  const activeNotes=privateMode?privateNotes:notes;
  const activeCalendarEvents=privateMode?privateCalendarEvents:calendarEvents;
  const normalizedPrivateBudgetSettings=useMemo<BudgetSettings>(()=>{
    const legacy=privateBudgetSettings.banks.find(bank=>bank.id==="linked-group-accounts"||bank.name.trim().toLocaleLowerCase("sv-SE")==="delade gruppkonton");
    if(!legacy)return privateBudgetSettings;
    let banks=privateBudgetSettings.banks.filter(bank=>bank!==legacy).map(bank=>({...bank,accounts:[...bank.accounts]}));
    for(const alias of legacy.accounts){
      const normalizedName=alias.name.trim().toLocaleLowerCase("sv-SE"),match=banks.flatMap(bank=>bank.accounts.map(account=>({bank,account}))).find(item=>!item.account.linkedGroupId&&item.account.name.trim().toLocaleLowerCase("sv-SE")===normalizedName);
      if(match)match.bank.accounts=match.bank.accounts.map(account=>account.id===match.account.id?{...account,linkedGroupId:alias.linkedGroupId,linkedAccountId:alias.linkedAccountId}:account);
      else if(banks[0])banks[0].accounts.push(alias);
      else banks=[{id:crypto.randomUUID(),name:"Konton",accounts:[alias]}];
    }
    return {...privateBudgetSettings,banks,updatedAt:Date.now()};
  },[privateBudgetSettings]);
  const linkedBudgetAccounts=useMemo(()=>normalizedPrivateBudgetSettings.banks.flatMap(bank=>bank.accounts.filter(item=>item.linkedGroupId&&item.linkedAccountId)),[normalizedPrivateBudgetSettings]);
  const sharedGroupBudgetAccountIds=useMemo(()=>new Set(linkedBudgetAccounts.filter(item=>item.linkedGroupId===account?.activeGroupId).flatMap(item=>item.linkedAccountId?[item.linkedAccountId]:[])),[linkedBudgetAccounts,account?.activeGroupId]);
  const hydratedPrivateBudgetSettings=useMemo<BudgetSettings>(()=>({...normalizedPrivateBudgetSettings,banks:normalizedPrivateBudgetSettings.banks.map(bank=>({...bank,accounts:bank.accounts.map(item=>{if(!item.linkedGroupId||!item.linkedAccountId)return item;const source=groupBudgetSettings[item.linkedGroupId]?.banks.flatMap(value=>value.accounts).find(value=>value.id===item.linkedAccountId);return source?{...item,name:source.name,icon:source.icon,openingBalance:source.openingBalance,reconciledBalance:source.reconciledBalance,reconciledAt:source.reconciledAt}:item})}))}),[normalizedPrivateBudgetSettings,groupBudgetSettings]);
  const linkedPrivateBudgetEntries=useMemo(()=>{const aliasesByGroup=linkedBudgetAccounts.reduce<Record<string,Record<string,string>>>((all,item)=>{(all[item.linkedGroupId!]??={})[item.linkedAccountId!]=item.id;return all},{});return Object.entries(aliasesByGroup).flatMap(([groupId,aliases])=>(groupBudgetEntries[groupId]||[]).filter(entry=>Boolean(aliases[entry.accountId||""]||aliases[entry.fromAccountId||""]||aliases[entry.toAccountId||""])).map(entry=>({...entry,sourceGroupId:groupId,accountId:aliases[entry.accountId||""]||entry.accountId,fromAccountId:aliases[entry.fromAccountId||""]||entry.fromAccountId,toAccountId:aliases[entry.toAccountId||""]||entry.toAccountId})))},[linkedBudgetAccounts,groupBudgetEntries]);
  const activeBudgetEntries=privateMode?[...privateBudgetEntries,...linkedPrivateBudgetEntries]:budgetEntries;
  const activeBudgetSettings=privateMode?hydratedPrivateBudgetSettings:budgetSettings;
  const activeRecipes=privateMode?privateRecipes:recipes;
  const syncedActiveRecipes=useMemo(()=>mergePublicRecipeLikes(activeRecipes,publicRecipes),[activeRecipes,publicRecipes]);
  const activitySeenAt=account?.activitySeenAt??Date.now();
  const activityEntries=useMemo<ActivityEntry[]>(()=>{
    if(!account)return[];
    const fallbackColor=account.personalColor||colorOptions[0];
    const memberName=(uid?:string)=>members.find(value=>value.uid===uid)?.displayName||account.displayName;
    const memberColor=(uid?:string)=>members.find(value=>value.uid===uid)?.color||fallbackColor;
    const listEntries=visibleLists.filter(value=>Boolean(value.updatedAt)).map(value=>{const actor=value.updatedBy||value.creatorId,actorName=privateMode?account.displayName:memberName(actor),created=Boolean(value.createdAt&&Math.abs((value.updatedAt||0)-value.createdAt)<10000),action=created?"skapade listan":value.creatorId===user?.uid&&actor!==user?.uid?"redigerade din lista":"uppdaterade listan";return{id:`list-${privateMode?"private":account.activeGroupId}-${value.id}-${value.updatedAt}`,kind:"list" as const,title:value.name,detail:`${actorName} ${action}`,at:value.updatedAt||0,color:privateMode?fallbackColor:memberColor(actor),isPrivate:privateMode,targetId:value.id,isOwn:privateMode||actor===user?.uid}});
    const noteEntries=activeNotes.filter(value=>Boolean(value.updatedAt||value.createdAt)).map(value=>{const latest=value.history?.[0],actor=latest?.uid||value.creatorId,action=(value.history?.length||0)>1?"ändrade anteckningen":"skapade anteckningen",actorName=privateMode?account.displayName:(latest?.name||memberName(actor));return{id:`note-${privateMode?"private":account.activeGroupId}-${value.id}-${value.updatedAt||value.createdAt}`,kind:"note" as const,title:value.title,detail:`${actorName} ${action}`,at:value.updatedAt||value.createdAt||0,color:privateMode?fallbackColor:memberColor(actor),isPrivate:privateMode,targetId:value.id,isOwn:privateMode||actor===user?.uid}});
    const calendarEntries=activeCalendarEvents.filter(value=>Boolean(value.updatedAt||value.createdAt)).map(value=>{const actor=value.updatedBy||value.creatorId,actorName=privateMode?account.displayName:memberName(actor),created=Math.abs((value.updatedAt||value.createdAt)-(value.createdAt||0))<10000,action=created?"skapade kalenderposten":"ändrade kalenderposten";return{id:`calendar-${privateMode?"private":account.activeGroupId}-${value.id}-${value.updatedAt||value.createdAt}`,kind:"calendar" as const,title:value.title,detail:`${calendarCategory(value.category).icon||"📅"} ${actorName} ${action}`,at:value.updatedAt||value.createdAt||0,color:privateMode?fallbackColor:memberColor(actor),isPrivate:privateMode,targetId:value.id,isOwn:privateMode||actor===user?.uid}});
    const recipeEntries=activeRecipes.filter(value=>Boolean(value.updatedAt||value.createdAt)).map(value=>{const actor=value.updatedBy||value.creatorId,actorName=privateMode?account.displayName:memberName(actor),created=Math.abs((value.updatedAt||value.createdAt)-(value.createdAt||0))<10000,action=created?"skapade receptet":"ändrade receptet";return{id:`recipe-${privateMode?"private":account.activeGroupId}-${value.id}-${value.updatedAt||value.createdAt}`,kind:"recipe" as const,title:value.title,detail:`🍲 ${actorName} ${action}`,at:value.updatedAt||value.createdAt||0,color:privateMode?fallbackColor:memberColor(actor),isPrivate:privateMode,targetId:value.id,isOwn:privateMode||actor===user?.uid}});
    return [...listEntries,...noteEntries,...calendarEntries,...recipeEntries].sort((a,b)=>b.at-a.at).slice(0,60);
  },[account,user?.uid,visibleLists,activeNotes,activeCalendarEvents,activeRecipes,privateMode,members]);
  const notificationCount=activityEntries.filter(value=>value.at>activitySeenAt&&!value.isOwn).length;
  const chatUnreadCount=directChats.filter(chat=>chat.lastSenderId!==user?.uid&&chat.lastMessageAt>(chat.readAt?.[user?.uid||""]||0)).length;
  useEffect(()=>{const unread=notificationCount+chatUnreadCount;document.title=`${unread>0?`(${unread}) `:""}Bubbsun – listor med karaktär`;return()=>{document.title="Bubbsun – listor med karaktär"}},[notificationCount,chatUnreadCount]);
  useEffect(()=>{if(user&&account&&!account.activitySeenAt)void savePreferences(user.uid,{activitySeenAt:Date.now()})},[user,account]);
  useEffect(()=>{
    if(!user||!account)return;
    const firedStorage="bubbsun-calendar-reminders-fired-v1";
    const check=async()=>{
      const now=new Date(),from=calendarDateKey(now),toDate=new Date(now);toDate.setDate(toDate.getDate()+31);
      const occurrences=expandCalendarEvents(activeCalendarEvents,from,calendarDateKey(toDate));
      let fired:string[]=[];try{fired=JSON.parse(localStorage.getItem(firedStorage)||"[]") as string[]}catch{fired=[]}
      const firedSet=new Set(fired),fresh:string[]=[];
      for(const occurrence of occurrences){
        const minutes=occurrence.reminderMinutes||0;if(!minutes)continue;
        const start=new Date(`${occurrence.occurrenceDate}T${occurrence.allDay||!occurrence.time?"09:00":occurrence.time}:00`),reminderAt=start.getTime()-minutes*60000,key=`${privateMode?"private":account.activeGroupId}:${occurrence.id}:${occurrence.occurrenceDate}:${minutes}`;
        if(firedSet.has(key)||now.getTime()<reminderAt||now.getTime()>start.getTime())continue;
        firedSet.add(key);fresh.push(key);
        const category=calendarCategory(occurrence.category),body=`${category.icon?`${category.icon} `:""}${occurrence.allDay?"Heldag":occurrence.time||"Idag"}${occurrence.note?` · ${occurrence.note}`:""}`;
        try{
          if("Notification" in window&&Notification.permission==="granted"){
            const registration=await navigator.serviceWorker?.ready;
            if(registration)await registration.showNotification(`Bubbsun · ${occurrence.title}`,{body,icon:"/assets/bubbsun-icon.png",badge:"/assets/bubbsun-icon.png",tag:key,requireInteraction:true,data:{url:"/beta/"}} as NotificationOptions);
            else new Notification(`Bubbsun · ${occurrence.title}`,{body,icon:"/assets/bubbsun-icon.png",tag:key,requireInteraction:true});
          }else window.alert(`🔔 PÅMINNELSE\n\n${occurrence.title}\n${body}`);
        }catch{window.alert(`🔔 PÅMINNELSE\n\n${occurrence.title}\n${body}`)}
      }
      if(fresh.length)localStorage.setItem(firedStorage,JSON.stringify(Array.from(firedSet).slice(-500)));
    };
    void check();const timer=window.setInterval(()=>void check(),30000);return()=>window.clearInterval(timer);
  },[activeCalendarEvents,privateMode,account?.activeGroupId,user?.uid]);
  const persistCalendarEvent=async(event:CalendarEvent,targetLocations:string[]=[],previousLocations:string[]=[])=>{if(!user||!account)return;const sourceLocation=privateMode?"private":account.activeGroupId,locations=targetLocations?.length?targetLocations:[sourceLocation],previous=previousLocations?.length?previousLocations:[sourceLocation],complete:CalendarEvent={id:event.id,title:event.title,date:event.date,time:event.time||"",endTime:event.endTime||"",allDay:Boolean(event.allDay),category:event.category||"",mealType:event.mealType||"",color:event.color||account.personalColor||colorOptions[0],birthYear:event.birthYear||0,recurrenceType:event.recurrenceType||"",recurrenceDays:event.recurrenceDays||[],recurrenceForever:Boolean(event.recurrenceForever),recurrenceUntil:event.recurrenceUntil||"",excludedDates:event.excludedDates||[],note:event.note||"",linkedListIds:event.linkedListIds||[],linkedRecipeIds:event.linkedRecipeIds||[],reminderMinutes:event.reminderMinutes||0,creatorId:event.creatorId||user.uid,creatorName:event.creatorName||account.displayName,createdAt:event.createdAt||Date.now(),updatedAt:Date.now(),updatedBy:user.uid,locations};await syncCalendarEventLocations(user.uid,complete,previous,locations)};
  const deleteCalendarEvent=async(event:CalendarEvent)=>{if(!user||!account)return;await removeCalendarEventEverywhere(user.uid,event,privateMode?"private":account.activeGroupId)};
  const persistBudgetEntry=async(entry:BudgetEntry)=>{if(!user||!account)return;const aliases=new Map(linkedBudgetAccounts.map(item=>[item.id,item])),used=[entry.accountId,entry.fromAccountId,entry.toAccountId].flatMap(id=>id&&aliases.has(id)?[aliases.get(id)!]:[]),targetGroups=new Set(used.map(item=>item.linkedGroupId!));if(privateMode&&(entry.sourceGroupId||targetGroups.size)){if(targetGroups.size>1){window.alert("En överföring kan inte gå mellan två länkade konton från olika grupper.");return}const groupId=entry.sourceGroupId||[...targetGroups][0],translate=(id?:string)=>id&&aliases.get(id)?.linkedAccountId||id,{sourceGroupId:_sourceGroupId,...stored}=entry;await saveBudgetEntry(groupId,{...stored,accountId:translate(entry.accountId),fromAccountId:translate(entry.fromAccountId),toAccountId:translate(entry.toAccountId)});return}const complete={...entry};if(privateMode)await savePrivateBudgetEntry(user.uid,complete);else if(account.activeGroupId)await saveBudgetEntry(account.activeGroupId,complete)};
  const deleteBudgetEntry=async(entry:BudgetEntry)=>{if(!user||!account)return;if(privateMode&&entry.sourceGroupId)await removeBudgetEntry(entry.sourceGroupId,entry.id);else if(privateMode)await removePrivateBudgetEntry(user.uid,entry.id);else if(account.activeGroupId)await removeBudgetEntry(account.activeGroupId,entry.id)};
  const persistBudgetSettings=async(settings:BudgetSettings)=>{if(!user||!account)return;if(privateMode){
    const previousAccounts=privateBudgetSettings.banks.flatMap(bank=>bank.accounts),nextAccounts=settings.banks.flatMap(bank=>bank.accounts),previousById=new Map(previousAccounts.map(item=>[item.id,item])),nextById=new Map(nextAccounts.map(item=>[item.id,item]));
    const newlyLinked=nextAccounts.filter(item=>item.linkedGroupId&&item.linkedAccountId&&(!previousById.get(item.id)?.linkedGroupId||previousById.get(item.id)?.linkedGroupId!==item.linkedGroupId||previousById.get(item.id)?.linkedAccountId!==item.linkedAccountId));
    const newlyUnlinked=previousAccounts.filter(item=>item.linkedGroupId&&item.linkedAccountId&&nextById.has(item.id)&&(!nextById.get(item.id)?.linkedGroupId||!nextById.get(item.id)?.linkedAccountId));
    const sourceUpdates=new Map<string,BudgetSettings>();for(const alias of nextAccounts.filter(item=>item.linkedGroupId&&item.linkedAccountId)){const current=sourceUpdates.get(alias.linkedGroupId!)||groupBudgetSettings[alias.linkedGroupId!];if(!current)continue;const source=current.banks.flatMap(bank=>bank.accounts).find(item=>item.id===alias.linkedAccountId);if(!source||source.name===alias.name&&source.icon===alias.icon&&source.openingBalance===alias.openingBalance&&source.reconciledBalance===alias.reconciledBalance&&source.reconciledAt===alias.reconciledAt)continue;sourceUpdates.set(alias.linkedGroupId!,{...current,banks:current.banks.map(bank=>({...bank,accounts:bank.accounts.map(item=>item.id===alias.linkedAccountId?{...item,name:alias.name,icon:alias.icon,openingBalance:alias.openingBalance,reconciledBalance:alias.reconciledBalance,reconciledAt:alias.reconciledAt}:item)})),updatedAt:Date.now()})}
    await Promise.all([...sourceUpdates].map(([groupId,value])=>saveBudgetSettings(groupId,value)));
    for(const alias of newlyLinked){const translate=(id?:string)=>id===alias.id?alias.linkedAccountId:id;for(const entry of privateBudgetEntries.filter(item=>item.accountId===alias.id||item.fromAccountId===alias.id||item.toAccountId===alias.id)){await saveBudgetEntry(alias.linkedGroupId!,{...entry,accountId:translate(entry.accountId),fromAccountId:translate(entry.fromAccountId),toAccountId:translate(entry.toAccountId)});await removePrivateBudgetEntry(user.uid,entry.id)}}
    for(const previous of newlyUnlinked){const translate=(id?:string)=>id===previous.linkedAccountId?previous.id:id;for(const entry of (groupBudgetEntries[previous.linkedGroupId!]||[]).filter(item=>item.accountId===previous.linkedAccountId||item.fromAccountId===previous.linkedAccountId||item.toAccountId===previous.linkedAccountId)){await savePrivateBudgetEntry(user.uid,{...entry,accountId:translate(entry.accountId),fromAccountId:translate(entry.fromAccountId),toAccountId:translate(entry.toAccountId)})}}
    await savePrivateBudgetSettings(user.uid,settings)
  }else if(account.activeGroupId)await saveBudgetSettings(account.activeGroupId,settings)};
  useEffect(()=>{
    const hasLegacyBank=privateBudgetSettings.banks.some(bank=>bank.id==="linked-group-accounts"||bank.name.trim().toLocaleLowerCase("sv-SE")==="delade gruppkonton");
    if(!databaseReady||!user||page!=="budget"||!privateMode||!hasLegacyBank||legacyBudgetAccountMigrationRef.current)return;
    legacyBudgetAccountMigrationRef.current=true;
    void persistBudgetSettings(normalizedPrivateBudgetSettings).catch(()=>{legacyBudgetAccountMigrationRef.current=false});
  },[databaseReady,user,page,privateMode,privateBudgetSettings,normalizedPrivateBudgetSettings]);
  const resetActiveBudget=async()=>{if(!user||!account)return;if(privateMode)await resetPrivateBudget(user.uid);else if(account.activeGroupId)await resetBudget(account.activeGroupId)};
  const clearActiveBudgetMoney=async()=>{if(!user||!account)return;if(privateMode)await clearPrivateBudgetMoney(user.uid,activeBudgetSettings);else if(account.activeGroupId)await clearBudgetMoney(account.activeGroupId,activeBudgetSettings)};
  const persistRecipe=async(recipe:Recipe,targetLocations:string[]=[],previousLocations:string[]=[])=>{if(!user||!account)return;const sourceLocation=privateMode?"private":account.activeGroupId,locations=targetLocations?.length?targetLocations:[sourceLocation],previous=previousLocations?.length?previousLocations:[sourceLocation],complete={...recipe,locations,updatedAt:Date.now(),updatedBy:user.uid};await syncRecipeLocations(user.uid,complete,previous,locations)};
  const deleteRecipe=async(recipe:Recipe)=>{if(!user||!account)return;await removeRecipeEverywhere(user.uid,recipe,privateMode?"private":account.activeGroupId)};
  const addRecipeToList=async(recipe:Recipe,listId:string)=>{if(!user||!account)return;const source=(privateMode?privateLists:lists).find(list=>list.id===listId);if(!source)return;const createdAt=Date.now(),newItems:ListItem[]=recipe.ingredients.filter(ingredient=>!ingredient.isHeading).map((ingredient,index)=>({id:crypto.randomUUID(),name:ingredient.name,quantity:[ingredient.amount,ingredient.unit].filter(Boolean).join(" "),ownerId:user.uid,completed:false,createdAt:createdAt+index,completedAt:null,likedBy:[],note:`Från receptet ${recipe.title}`}));const next={...source,items:[...source.items,...newItems]};if(privateMode){setPrivateLists(current=>current.map(list=>list.id===next.id?next:list));await savePrivateList(user.uid,next)}else if(account.activeGroupId){setLists(current=>current.map(list=>list.id===next.id?next:list));await saveList(account.activeGroupId,next,user.uid)}};
  const createRecipeIngredientList=async(recipe:Recipe,targetLocation:string,ingredientIds:string[])=>{
    if(!user)return;
    const createdAt=Date.now();
    const selected=new Set(ingredientIds);
    const items:ListItem[]=recipe.ingredients.filter(ingredient=>!ingredient.isHeading&&ingredient.name.trim()&&selected.has(ingredient.id)).map((ingredient,index)=>({id:crypto.randomUUID(),name:ingredient.name.trim(),quantity:[ingredient.amount.trim(),ingredient.unit.trim()].filter(Boolean).join(" "),ownerId:user.uid,completed:false,createdAt:createdAt+index,completedAt:null,likedBy:[],note:`Från receptet ${recipe.title}`}));
    const name=recipe.title.trim().slice(0,60)||"Recept";
    if(targetLocation==="private"){
      const list:BubbsunList={id:crypto.randomUUID(),name,icon:"list_cart",iconColor:0xff2b7a78,listType:"shopping",creatorId:user.uid,createdAt,sortMode:"custom",doneFirst:false,doneExpanded:false,order:privateLists.length,items};
      setPrivateLists(current=>[...current,list]);
      try{await savePrivateList(user.uid,list)}catch(reason){setPrivateLists(current=>current.filter(item=>item.id!==list.id));throw reason}
      return;
    }
    const created=await createList(targetLocation,name,user.uid,lists.length,"shopping");
    const list={...created,items};
    await saveList(targetLocation,list,user.uid);
    if(account?.activeGroupId===targetLocation)setLists(current=>current.some(item=>item.id===list.id)?current:[...current,list]);
  };
  const savePublicRecipeCopy=async(recipe:Recipe,targetLocation:string)=>{
    if(!user||!account)return;
    const now=Date.now();
    const copied:Recipe={...recipe,id:crypto.randomUUID(),locations:[targetLocation],isPublic:false,linkedListId:"",likedBy:[],copiedFromRecipeId:recipe.copiedFromRecipeId||recipe.id,originalCreatorId:recipe.originalCreatorId||recipe.creatorId,originalCreatorName:recipe.originalCreatorName||recipe.creatorName,originalCreatorColor:recipe.originalCreatorColor??recipe.creatorColor,publicationLocked:true,creatorId:user.uid,creatorName:account.displayName,creatorColor:account.personalColor||recipe.creatorColor,createdAt:now,updatedAt:now,updatedBy:user.uid};
    delete copied.sourcePath;
    if(targetLocation==="private")await savePrivateRecipe(user.uid,copied);
    else await saveRecipe(targetLocation,copied);
  };
  const openNote=(note:BubbsunNote,isPrivate=privateMode)=>{setSelectedNote(note);setSelectedNotePrivate(isPrivate);window.history.pushState({bubbsunPage:"note",noteId:note.id,privateNote:isPrivate,privateMode:isPrivate},"");setPage("note");if(!window.matchMedia("(min-width: 900px)").matches)setMenuOpen(false);setListToolsOpen(false);};
  const persistNote=async(note:BubbsunNote,isPrivate=selectedNotePrivate):Promise<boolean>=>{if(!user||!account)return false;const changed=note.title!==selectedNote?.title||note.text!==selectedNote?.text||note.icon!==selectedNote?.icon||note.color!==selectedNote?.color;const entry={uid:user.uid,name:account.displayName,at:Date.now()},complete={...note,creatorId:note.creatorId||user.uid,creatorName:note.creatorName||account.displayName,creatorColor:note.creatorColor??account.personalColor,history:changed?[entry,...(note.history||[])].slice(0,20):note.history||[]};try{if(isPrivate)await savePrivateNote(user.uid,complete);else if(account.activeGroupId)await saveNote(account.activeGroupId,complete);else return false;setSelectedNote(complete);return true;}catch(error){console.error("Could not save note",error);window.alert("Anteckningen kunde inte sparas. Försök igen.");return false;}};
  const createNote=async(note:BubbsunNote)=>{if(!user||!account)return;const entry={uid:user.uid,name:account.displayName,at:Date.now()},complete={...note,creatorId:user.uid,creatorName:account.displayName,creatorColor:account.personalColor,history:[entry],order:activeNotes.length};try{if(privateMode){await savePrivateNote(user.uid,complete);setPrivateNotes(current=>[...current,complete]);}else if(account.activeGroupId){await saveNote(account.activeGroupId,complete);setNotes(current=>[...current,complete]);}else return;setAddingNote(false);openNote(complete,privateMode);}catch(error){console.error("Could not create note",error);window.alert("Anteckningen kunde inte sparas. Försök igen.");}};
  const reorderNotes=async(from:number,to:number)=>{if(!user)return;const changed=arrayMove(activeNotes,from,to).map((note,index)=>({...note,order:index}));if(privateMode){setPrivateNotes(changed);await Promise.all(changed.map(note=>savePrivateNote(user.uid,note)));}else if(account?.activeGroupId){setNotes(changed);await Promise.all(changed.map(note=>saveNote(account.activeGroupId,note)));}};

  if (user === undefined) {
    const loadingTheme =
      themes.find((item) => item.id === themeId) || themes[0];
    return (
      <main
        className="loading-page bubbsun-loading"
        style={
          {
            background: loadingTheme.bg,
            color: loadingTheme.text,
            "--loading-accent": loadingTheme.accent,
            "--loading-outline": loadingTheme.outline,
          } as CSSProperties
        }
      >
        <div className="loading-portrait">
          <img src="/assets/sanja-loading-portrait.png" alt="" />
          <span />
        </div>
      </main>
    );
  }
  if (!user)
    return <LoginPage onLogin={login} onGoogleCredential={loginWithGoogleCredential} error={loginError} busy={busy} />;
  if (!account) {
    const loadingTheme =
      themes.find((item) => item.id === themeId) || themes[0];
    return (
      <main
        className="loading-page bubbsun-loading"
        style={
          {
            background: loadingTheme.bg,
            color: loadingTheme.text,
            "--loading-accent": loadingTheme.accent,
            "--loading-outline": loadingTheme.outline,
          } as CSSProperties
        }
      >
        <div className="loading-portrait">
          <img src="/assets/sanja-loading-portrait.png" alt="" />
          <span />
        </div>
      </main>
    );
  }

  if (account.privacyVersion < 1)
    return (
      <main className="login-page">
        <img
          src="/assets/bubbsun-logo.png"
          alt="Bubbsun"
          className="login-logo"
        />
        <section className="login-card privacy-card">
          <h1>INTEGRITET & MOLNDATA</h1>
          <p>
            Bubbsun sparar ditt namn, dina grupper och dina listor på ditt
            konto. Därför kan du se samma innehåll på både telefon och dator.
          </p>
          <p>
            Dina privata listor kan bara ses av dig. Gruppens listor kan ses av
            medlemmarna i gruppen.
          </p>
          <button onClick={() => void acceptPrivacy(user.uid)}>
            <Check /> JAG GODKÄNNER
          </button>
          <button className="privacy-cancel cancel" onClick={() => void signOut(auth)}>
            AVBRYT & LOGGA UT
          </button>
        </section>
      </main>
    );

  return (
    <main className={`app-shell theme-${activeTheme.id}`} style={themeStyle}>
      <UnsavedModalGuard />
      <LanguageBridge language={language} />
      <ActionButtonBridge />
      <Header
        supporterTitle={account.supporter ? account.supporterTitle : undefined}
        glow={account.supporter && account.supporterGlow !== false}
        glowColor={account.supporterGlowColor}
        tabTitle={page === "list" ? activeSelected?.name : page === "note" ? selectedNote?.title : page === "calendar" ? "Kalender" : page === "meal-planner" ? "Veckans måltider" : page === "recipes" ? "Kokboken" : page === "recipe-discover" ? "Upptäck recept" : page === "budget" ? "Budget" : undefined}
        onMenu={() => setMenuOpen(open=>!open)}
        onHome={() => navigate(page==="notes"||page==="note"?"notes":page==="calendar"?"calendar":page==="meal-planner"?"meal-planner":page==="recipes"?"recipes":page==="recipe-discover"?"recipe-discover":page==="budget"?"budget":"lists")}
        onAdd={() => page === "notes" ? setAddingNote(true) : page === "calendar" ? setAddingCalendar(true) : page === "meal-planner" ? setAddingMealPlan(true) : page === "recipes" ? setAddingRecipe(true) : page === "budget" ? setBudgetCalculatorOpen(true) : page === "chat" ? window.dispatchEvent(new Event("bubbsun:new-chat")) : setAdding(true)}
        onManage={() => setListToolsOpen((open) => !open)}
        mode={page === "budget" ? "calculator" : page === "lists" || page === "notes" || page === "calendar" || page === "meal-planner" || page === "recipes" || (page === "chat"&&memberships.length>0) ? "add" : page === "list" || page === "note" ? "manage" : "none"}
        onlineCount={(account.megaSuperBoss || account.founder)&&isAdminPage ? onlineCount : undefined}
        reportCount={(account.megaSuperBoss || account.founder)&&isAdminPage ? reports.filter(report=>report.status==="new").length : undefined}
        notificationCount={notificationCount}
        chatUnreadCount={chatUnreadCount}
        onOpenAdmin={
          account.megaSuperBoss || account.founder
            ? () => {setAdminStartTab("members");navigate("admin")}
            : undefined
        }
        onOpenReports={account.megaSuperBoss || account.founder?()=>{setAdminStartTab("reports");navigate("admin")}:undefined}
        language={language}
        wallet={null}
      />
      {page === "lists" && (
        <ListsPage
          lists={lists}
          privateLists={privateLists}
          privateMode={privateMode}
          members={members}
          uid={user.uid}
          personalColor={account.personalColor || colorOptions[0]}
          supporter={account.supporter}
          globalPin={
            globalPin &&
            (account.hiddenGlobalPinId !== globalPin.id ||
              globalPin.revision > (account.hiddenGlobalPinRevision ?? 0))
              ? globalPin
              : null
          }
          onHidePin={() =>
            globalPin &&
            void hideGlobalPin(user.uid, globalPin.id, globalPin.revision)
          }
          onOpen={openList}
          onHelp={() => navigate("help")}
          onNotes={() => navigate("notes")}
          onSupport={() => navigate("support")}
          onMode={(value) => {
            setPrivateMode(value);
            setSelected(null);
          }}
          onReorder={(from, to) => void reorderLists(from, to)}
          onEdit={(list, values) => void editList(list, values)}
          onDelete={(list) => void deleteList(list)}
          onPin={togglePrivatePin}
          followedListIds={followedListIds}
          listReadAt={listReadAt}
          groupId={account.activeGroupId}
          groupName={groupName}
          groupIconId={activeGroup?.iconId}
          activeGroupId={account.activeGroupId}
          memberships={memberships}
          groups={groups}
          onSwitchGroup={async id=>{await switchGroup(user.uid,id);setPrivateMode(false)}}
          canReorder={privateMode || canManageGroup}
        />
      )}
      {page === "list" && activeSelected && (
        <ListPage
          list={activeSelected}
          siblingLists={(selectedPrivate ? privateLists : lists).filter(
            (candidate) => candidate.id !== activeSelected.id,
          )}
          members={members}
          uid={user.uid}
          supporter={account.supporter}
          isPrivate={selectedPrivate}
          canManage={selectedPrivate || canManageGroup}
          groupId={
            selectedPrivate ? `private-${user.uid}` : account.activeGroupId
          }
          toolsOpen={listToolsOpen}
          onToolsOpen={setListToolsOpen}
          onBack={() => navigate("lists")}
          onSupport={() => navigate("support")}
          onChange={saveChanged}
          onMoveItem={moveItemBetweenLists}
          onMoveItems={moveItemsBetweenLists}
          onDelete={async () => {
            if (selectedPrivate) {
              setPrivateLists((old) =>
                old.filter((x) => x.id !== activeSelected.id),
              );
              await removePrivateList(user.uid, activeSelected.id);
            } else if (account.activeGroupId)
              await removeList(account.activeGroupId, activeSelected.id);
            navigate("lists");
          }}
          unreadAfter={selectedUnreadAfter}
        />
      )}
      {page === "notes" && <NotesPage notes={activeNotes} privateMode={privateMode} groupName={groupName} groupIconId={activeGroup?.iconId} activeGroupId={account.activeGroupId} memberships={memberships} groups={groups} resolveCreatorColor={note=>privateMode?(account.personalColor??colorOptions[0]):(members.find(member=>member.uid===note.creatorId)?.color??note.creatorColor??account.personalColor??colorOptions[0])} followedNoteIds={followedNoteIds} onMode={value=>{setPrivateMode(value);setSelectedNote(null)}} onSwitchGroup={async id=>{await switchGroup(user.uid,id);setPrivateMode(false)}} onLists={()=>navigate("lists")} onHelp={()=>navigate("help")} onOpen={note=>openNote(note)} onReorder={(from,to)=>void reorderNotes(from,to)} />}
      {page === "note" && selectedNote && <NoteEditorPage note={selectedNote} creator={selectedNotePrivate?{name:account.displayName,color:account.personalColor??selectedNote.creatorColor??colorOptions[0]}:(()=>{const member=members.find(value=>value.uid===selectedNote.creatorId);return member?{name:member.displayName,color:member.color}:undefined})()} follow={!selectedNotePrivate&&account.activeGroupId?{uid:user.uid,groupId:account.activeGroupId}:undefined} toolsOpen={listToolsOpen} onToolsOpen={setListToolsOpen} onBack={()=>navigate("notes")} onSave={note=>persistNote(note)} onDelete={async()=>{if(selectedNotePrivate)await removePrivateNote(user.uid,selectedNote.id);else if(account.activeGroupId)await removeNote(account.activeGroupId,selectedNote.id);navigate("notes")}}/>}
      {page === "calendar" && <CalendarPage
        events={activeCalendarEvents.filter(event=>event.category!=="meal-plan")}
        lists={visibleLists}
        privateMode={privateMode}
        account={account}
        memberships={memberships}
        groups={groups}
        members={members}
        creating={addingCalendar}
        onCreating={setAddingCalendar}
        onMode={setPrivateMode}
        onSwitchGroup={async id=>{await switchGroup(user.uid,id);setPrivateMode(false)}}
        onSave={persistCalendarEvent}
        onDelete={deleteCalendarEvent}
        onOpenList={list=>openList(list,privateMode)}
        openEventId={activityCalendarEventId}
        onEventOpened={()=>setActivityCalendarEventId("")}
      />}
      {page === "meal-planner" && <MealPlannerPage events={activeCalendarEvents.filter(event=>event.category==="meal-plan")} recipes={syncedActiveRecipes} lists={visibleLists} privateMode={privateMode} account={account} memberships={memberships} groups={groups} creating={addingMealPlan} onCreating={setAddingMealPlan} onMode={setPrivateMode} onSwitchGroup={async id=>{await switchGroup(user.uid,id);setPrivateMode(false)}} onSave={persistCalendarEvent} onDelete={deleteCalendarEvent}/>}
      {page === "budget" && <BudgetPage entries={activeBudgetEntries} settings={activeBudgetSettings} privateMode={privateMode} sharedAccountIds={sharedGroupBudgetAccountIds} account={account} memberships={memberships} groups={groups} groupBudgetSettings={groupBudgetSettings} creating={addingBudget} onCreating={setAddingBudget} onMode={setPrivateMode} onSwitchGroup={async id=>{await switchGroup(user.uid,id);setPrivateMode(false)}} onSave={persistBudgetEntry} onDelete={deleteBudgetEntry} onSaveSettings={persistBudgetSettings} onReset={resetActiveBudget} onClearMoney={clearActiveBudgetMoney}/>}
      {budgetCalculatorOpen&&<BudgetCalculator onClose={()=>setBudgetCalculatorOpen(false)}/>}
      {page === "recipes" && <RecipesPage
        recipes={syncedActiveRecipes}
        lists={visibleLists}
        privateMode={privateMode}
        account={account}
        uid={user.uid}
        memberships={memberships}
        groups={groups}
        members={members}
        creating={addingRecipe}
        onCreating={setAddingRecipe}
        onMode={setPrivateMode}
        onSwitchGroup={async id=>{await switchGroup(user.uid,id);setPrivateMode(false)}}
        onSave={persistRecipe}
        onDelete={deleteRecipe}
        onAddToList={addRecipeToList}
        onCreateIngredientList={createRecipeIngredientList}
        onMessageCreator={recipe=>setChatPeer({uid:recipe.creatorId,name:recipe.creatorName,color:recipe.creatorColor??colorOptions[0]})}
        openRecipeId={activityRecipeId}
        onRecipeOpened={()=>setActivityRecipeId("")}
      />}
      {page === "recipe-discover" && (
        <DiscoverRecipesPage recipes={publicRecipes} uid={user.uid} memberships={memberships} groups={groups} onCreateIngredientList={createRecipeIngredientList} onSaveCopy={savePublicRecipeCopy} onMessageCreator={recipe=>setChatPeer({uid:recipe.creatorId,name:recipe.creatorName,color:recipe.creatorColor??colorOptions[0]})}/>
      )}
      {page === "chat"&&<ChatPage account={account} chats={directChats} memberships={memberships} groups={groups} language={language} onOpen={setChatPeer}/>}
      {page === "notifications" && <NotificationsPage entries={activityEntries} seenAt={notificationPageSeenAt??activitySeenAt} onOpen={entry=>{
        setPrivateMode(entry.isPrivate);
        if(entry.kind==="list"){
          const list=(entry.isPrivate?privateLists:lists).find(value=>value.id===entry.targetId);
          if(list)openList(list,entry.isPrivate);
        }else if(entry.kind==="note"){
          const note=(entry.isPrivate?privateNotes:notes).find(value=>value.id===entry.targetId);
          if(note)openNote(note,entry.isPrivate);
        }else if(entry.kind==="recipe"){
          setActivityRecipeId(entry.targetId);
          navigate("recipes");
        }else{
          const calendarEvent=activeCalendarEvents.find(value=>value.id===entry.targetId);
          if(calendarEvent?.category==="meal-plan")navigate("meal-planner");
          else{setActivityCalendarEventId(entry.targetId);navigate("calendar")}
        }
      }}/>
      }
      {page === "people" && (
        <PeoplePage
          account={account}
          group={activeGroup}
          members={members}
          memberships={memberships}
          groups={groups}
          language={language}
          onlineUserIds={groupOnlineUserIds}
          onSelectGroup={async id=>{if(id===account.activeGroupId)return;await switchGroup(user.uid,id);setPrivateMode(false)}}
        />
      )}
      {page === "settings" && (
        <SettingsPage
          account={account}
          themeId={themeId}
          language={language}
          onTheme={setThemeId}
          onLanguage={setLanguage}
          onPage={navigate}
        />
      )}
      {page === "support" && (
        <SupportPage
          account={account}
          onActivate={() =>
            savePreferences(user.uid, {
              supporter: true,
              supporterTitle: "lifetime",
              supporterGlow: true,
            })
          }
          onSave={(values) => void savePreferences(user.uid, values)}
          onPage={navigate}
        />
      )}
      {page === "help" && <HelpPage onPage={navigate} />}
      {page === "privacy" && <PrivacyPage />}
      {page === "feedback" && (
        <FeedbackPage uid={user.uid} language={language} themeId={themeId} />
      )}
      {page === "versions" && <VersionsPage onPage={navigate} />}
      {page === "about" && <AboutPage onPage={navigate} />}
      {page === "admin" && (account.megaSuperBoss || account.founder) && (
        <AdminPage
          lists={[...allAdminLists, ...allAdminPrivateLists]}
          members={members}
          accounts={allAccounts}
          reports={reports}
          palettes={themePalettes}
          onlineUserIds={onlineUserIds}
          userCounts={adminUserCounts}
          publicRecipes={publicRecipes}
          messageCount={adminMessageCount}
          initialTab={adminStartTab}
        />
      )}
      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        account={account}
        userInfo={user}
        groups={groups}
        memberships={memberships}
        activePrivate={privateMode}
        onPrivate={() => {
          setPrivateMode(true);
        }}
        onGroup={async (id) => {
          await switchGroup(user.uid, id);
          setPrivateMode(false);
        }}
        onPage={navigate}
        onLogout={() => signOut(auth)}
        onInvite={() => void inviteFriend()}
        unreadChats={chatUnreadCount}
        onChat={()=>{setMenuOpen(false);navigate("chat")}}
        notificationCount={notificationCount}
        onNotifications={()=>{setMenuOpen(false);setNotificationPageSeenAt(activitySeenAt);navigate("notifications");void savePreferences(user.uid,{activitySeenAt:Date.now()})}}
      />
      {chatPeer&&chatPeer.uid!==user.uid&&<ChatWindow account={account} peer={chatPeer} language={language} onClose={()=>setChatPeer(null)}/>}
      {saveConflict && (
        <div className="modal-backdrop">
          <div className="modal conflict-modal">
            <h2>LISTAN ÄNDRADES AV NÅGON ANNAN</h2>
            <p>
              Din ändring sparades inte, så att den andra personens nya
              uppgifter inte skrivs över. Listan har nu uppdaterats. Gör din
              ändring en gång till.
            </p>
            <button onClick={() => setSaveConflict(false)}>JAG FÖRSTÅR</button>
          </div>
        </div>
      )}
      {adding && (
        <ListEditor
          title={`NY ${privateMode ? "PRIVAT LISTA" : "GRUPPLISTA"}`}
          supporter={account.supporter}
          onSupport={() => {
            setAdding(false);
            navigate("support");
          }}
          onCancel={() => setAdding(false)}
          onSave={(values) => void addNewList(values)}
        />
      )}
      {addingNote&&(
        <NewNoteEditor onCancel={()=>setAddingNote(false)} onSave={note=>void createNote(note)}/>
      )}
    </main>
  );
}

function usePublicRecipeMetadata(recipe:Recipe|null|undefined){
  useEffect(()=>{
    if(recipe===undefined)return;
    const title=recipe?`${recipe.title} – recept | Bubbsun`:"Receptet hittades inte | Bubbsun",description=recipe?`${recipeCategoryLabel(recipe)} av ${recipe.creatorName}.${recipe.servings>0?` ${recipeYieldLabel(recipe)}`:""}${recipe.minutes?`, ${recipe.minutes} minuter`:""}.`:"Det publika receptet finns inte längre.";
    document.title=title;
    const setMeta=(selector:string,attribute:string,value:string)=>{let node=document.head.querySelector<HTMLMetaElement>(selector);if(!node){node=document.createElement("meta");const match=selector.match(/\[(name|property)="([^"]+)"\]/);if(match)node.setAttribute(match[1],match[2]);document.head.appendChild(node)}node.setAttribute(attribute,value)};
    setMeta('meta[name="description"]',"content",description);setMeta('meta[name="robots"]',"content",recipe?"index,follow":"noindex,follow");setMeta('meta[property="og:title"]',"content",title);setMeta('meta[property="og:description"]',"content",description);setMeta('meta[property="og:type"]',"content","article");if(recipe?.image)setMeta('meta[property="og:image"]',"content",recipe.image);
    let canonical=document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');if(!canonical){canonical=document.createElement("link");canonical.rel="canonical";document.head.appendChild(canonical)}canonical.href=window.location.href.split(/[?#]/)[0];
    if(recipe){const script=document.createElement("script");script.id="public-recipe-jsonld";script.type="application/ld+json";script.text=JSON.stringify({"@context":"https://schema.org","@type":"Recipe",name:recipe.title,image:recipe.image?[recipe.image]:undefined,author:{"@type":"Person",name:recipe.creatorName},recipeCategory:recipe.category,recipeCuisine:recipe.subcategory,recipeYield:recipe.servings>0?recipeYieldLabel(recipe):undefined,totalTime:recipe.minutes?`PT${recipe.minutes}M`:undefined,recipeIngredient:recipe.ingredients.filter(item=>!item.isHeading).map(item=>[[item.amount,item.unit].filter(Boolean).join(" "),item.name].filter(Boolean).join(" ")),recipeInstructions:recipeInstructionSteps(recipe.instructions).map(text=>({"@type":"HowToStep",text}))});document.getElementById(script.id)?.remove();document.head.appendChild(script)}
  },[recipe]);
}

function PublicRecipeArticle({recipe}:{recipe:Recipe}){return <article className="recipe-view public-recipe-view" style={{"--recipe-creator":"var(--theme-accent)"} as CSSProperties}>{recipe.image?<img className="recipe-hero" src={recipe.image} alt={recipe.title}/>:<div className="recipe-hero fallback">🍲</div>}<small>{recipeCategoryLabel(recipe)}</small><h1>{recipe.title}</h1><div className="recipe-view-tools"><RecipePrintButton/><RecipeShareControl recipe={recipe}/><span className="public-recipe-like-count" aria-label={`${recipe.likedBy?.length||0} gillningar`} title="Gillningar"><ThumbsUp/><b>{recipe.likedBy?.length||0}</b></span></div><div className="recipe-facts">{recipe.servings>0&&<span>🍽️ {recipeYieldLabel(recipe)}</span>}{recipe.minutes>0&&<span>⏱️ {recipe.minutes} minuter</span>}</div><div className="recipe-creator-line">Skapad av {recipe.creatorName}</div>{recipe.description&&<section className="recipe-description"><h3>OM RECEPTET</h3><p>{recipe.description}</p></section>}<RecipeIngredients recipe={recipe}/><section><h3>GÖR SÅ HÄR</h3><div className="recipe-instructions">{recipeInstructionSteps(recipe.instructions).map((step,index)=><p key={index}><b>{index+1}</b><span>{step}</span></p>)}</div></section>{recipe.note&&<aside><b>ANTECKNING</b><p>{recipe.note}</p></aside>}<RecipeSourceLink recipe={recipe}/><footer><a href="/recept">← Upptäck fler recept</a></footer></article>}

function PublicRecipeBrand(){return <a className="public-recipe-brand" href="/"><strong>Bubbsun<span>.se</span></strong><small>LISTOR MED KARAKTÄR <b>✦</b></small></a>}

function PublicRecipePage({recipeId}:{recipeId:string}){
  const [recipe,setRecipe]=useState<Recipe|null|undefined>(undefined);
  useEffect(()=>{void getPublicRecipe(recipeId).then(value=>setRecipe(value?.isPublic===false?null:value)).catch(()=>setRecipe(null))},[recipeId]);usePublicRecipeMetadata(recipe);
  if(recipe===undefined)return <main className="public-recipe-page"><p>Laddar receptet…</p></main>;
  if(!recipe)return <main className="public-recipe-page public-recipe-missing"><h1>Receptet finns inte längre</h1><p>Det kan ha tagits bort eller slutat delas offentligt.</p><a href="/recept">Upptäck andra recept</a></main>;
  return <main className="public-recipe-page"><PublicRecipeBrand/><PublicRecipeArticle recipe={recipe}/></main>;
}

function PublicRecipesIndexPage(){
  const [recipes,setRecipes]=useState<Recipe[]>([]),[ready,setReady]=useState(false);useEffect(()=>watchPublicRecipes(values=>{setRecipes(values.filter(value=>value.isPublic!==false));setReady(true)}),[]);useEffect(()=>{document.title="Publika recept | Bubbsun";document.querySelector('meta[name="robots"]')?.setAttribute("content","index,follow")},[]);
  return <main className="public-recipes-index"><PublicRecipeBrand/><header><BookOpen/><div><small>BUBBSUNS RECEPT</small><h1>Upptäck något gott</h1><p>Publika recept från Bubbsun-användare. Inget konto behövs.</p></div></header>{!ready?<p>Laddar recept…</p>:recipes.length?<div className="recipe-grid">{recipes.map(recipe=><a className="recipe-card public" href={`/recept/${encodeURIComponent(recipe.id)}/${recipeSlug(recipe.title)}`} key={recipe.id}>{recipe.image?<img src={recipe.image} alt={recipe.title}/>:<span className="recipe-fallback">🍲</span>}<span><small>{recipeCategoryLabel(recipe)}</small><strong>{recipe.title}</strong><em className="recipe-card-facts">{recipe.minutes>0&&<span>⏱️ {recipe.minutes} min</span>}{recipe.servings>0&&<span>🍽️ {recipeYieldLabel(recipe)}</span>}</em><em className="recipe-card-creator"><UserRound/><span>Skapad av <b>{recipe.creatorName}</b></span></em></span></a>)}</div>:<p>Inga publika recept ännu.</p>}</main>;
}

function PublicSharedListPage({code}:{code:string}) {
  const [share,setShare]=useState<PublicListShare|null|undefined>(undefined);
  useEffect(()=>{void getPublicListShare(code).then(setShare).catch(()=>setShare(null));},[code]);
  if(share===undefined)return <main className="public-list-page"><div className="public-list-card"><p>Laddar listan…</p></div></main>;
  if(!share)return <main className="public-list-page"><div className="public-list-card"><h1>Länken fungerar inte</h1><a href="/">Gå till Bubbsun.se</a></div></main>;
  const pending=share.items.filter(item=>!item.completed);
  return <main className="public-list-page">
    <div className="public-list-wrap">
      <a className="public-bubbsun-link" href="/"><img src="/assets/bubbsun-logo-new.png" alt="Bubbsun" /> Gå till Bubbsun.se</a>
      <section className="public-list-card">
        <div className="public-list-heading"><span className="public-readonly">SKRIVSKYDDAD DELAD LISTA</span><button onClick={()=>window.print()}><Printer/> Skriv ut</button></div>
        <h1>{share.name}</h1>
        <div className="public-items">
          {pending.map((item,index)=><div key={`${item.name}-${index}`}><span className="public-check"/><strong>{item.name}</strong>{item.quantity&&<small>{item.quantity}</small>}{share.showNotes&&item.note&&<p className="public-item-note"><NotebookPen />{item.note}</p>}</div>)}
          {!pending.length&&<p className="public-empty">Det finns inga poster kvar.</p>}
        </div>
      </section>
    </div>
  </main>;
}

function GlobalBackdropDismiss() {
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      const backdrop = event.target;
      if (!(backdrop instanceof HTMLElement) || !backdrop.matches(".modal-backdrop,.recipe-modal-backdrop")) return;
      const modal = backdrop.querySelector<HTMLElement>(":scope > .modal,:scope > .recipe-editor-modal,:scope > .recipe-view");
      if (!modal) return;
      // RecipeEditor owns its backdrop rule because it must preserve unsaved form state.
      if (modal.classList.contains("recipe-editor-modal")) return;
      const buttons = Array.from(modal.querySelectorAll<HTMLButtonElement>("button"));
      const closeButton = buttons.find(button =>
        button.matches('[aria-label="Stäng"],.modal-close,.modal-x,.calendar-editor-close,.recipe-close,.cancel') ||
        ["STÄNG", "AVBRYT", "KLAR"].includes(button.textContent?.trim().toLocaleUpperCase("sv-SE") || "")
      );
      if (!closeButton) return;
      event.preventDefault();
      event.stopPropagation();
      closeButton.click();
    };
    document.addEventListener("pointerdown", dismiss, true);
    return () => document.removeEventListener("pointerdown", dismiss, true);
  }, []);
  return null;
}

export default function App() {
  const listMatch=window.location.pathname.match(/^\/list\/(?:.*-)?([a-f0-9]{10})\/?$/i),recipeMatch=window.location.pathname.match(/^\/recept\/([^/]+)(?:\/[^/]*)?\/?$/i),recipeIndex=/^\/recept\/?$/i.test(window.location.pathname);
  return <><GlobalBackdropDismiss/>{listMatch?<PublicSharedListPage code={listMatch[1]} />:recipeMatch?<PublicRecipePage recipeId={decodeURIComponent(recipeMatch[1])}/>:recipeIndex?<PublicRecipesIndexPage/>:<AuthenticatedApp />}</>;
}
