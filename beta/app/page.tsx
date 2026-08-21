import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  CirclePlus,
  Copy,
  Home,
  ListChecks,
  LockKeyhole,
  GripVertical,
  LogOut,
  Menu,
  MoveRight,
  NotebookPen,
  Palette,
  Pencil,
  Pin,
  Plus,
  Printer,
  Search,
  Share2,
  Settings,
  SlidersHorizontal,
  Trash2,
  UserCog,
  UserRound,
  Users,
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
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "../src/lib/firebase";
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
  watchAllFollowedLists,
  watchAllLists,
  watchAllPrivateLists,
  watchFollowedLists,
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
  watchNotes,
  watchPrivateNotes,
  watchPrivateLists,
  watchReports,
  watchThemePalettes,
  removeNote,
  removePrivateNote,
} from "../src/lib/bubbsun-data";
import type {
  Account,
  BubbsunList,
  BubbsunNote,
  GlobalPin,
  Group,
  JoinRequest,
  ListItem,
  Membership,
  Page,
  PublicListShare,
  Report,
  ThemePalette,
} from "../src/types";
import { LanguageBridge } from "../src/LanguageBridge";
import "./globals.css";
import "./v700.css";
import "./v700-fixes.css";
import "./beta-final.css";

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
  "group_paws",
  "group_heart",
  "group_star",
  "group_tree",
  "group_cottage",
  "group_people",
  "group_cart",
  "group_sun",
  "group_moon",
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
const normalizedGroupIcon = (value?: string) =>
  value?.startsWith("group_")
    ? value
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
      src={`/assets/new-icons/groups/${normalizedGroupIcon(id)}.png`}
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
const noteIcons=["idea","star","search","alarm","palette","archive","tag","lock"] as const;
const noteIconSource=(icon:string)=>`${import.meta.env.BASE_URL}assets/note-icons/${noteIcons.includes(icon as typeof noteIcons[number])?icon:"idea"}.png`;
const listTypeInfo = (id?: string) =>
  listTypes.find((type) => type.id === id) || listTypes[listTypes.length - 1];
const themes = [
  {
    id: "retro",
    name: "Retro",
    icon: "theme_retro.png",
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
    icon: "theme_light.png",
    bg: "#fffaf0",
    paper: "#ffffff",
    panel: "#f3e7cd",
    text: "#3a2a20",
    accent: "#a9782f",
    outline: "#c5a477",
    header: "#f7ecd5",
    headerButton: "#8c744e",
  },
  {
    id: "ocean",
    name: "Hav",
    icon: "theme_ocean.png",
    bg: "#dceff3",
    paper: "#f7fdff",
    panel: "#a9d5df",
    text: "#173842",
    accent: "#247d91",
    outline: "#579cac",
    header: "#86c3d1",
    headerButton: "#176b80",
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
          <button onClick={() => void install()}>📲 INSTALLERA BUBBSUN</button>
          <span>Få en egen ikon och öppna Bubbsun som en vanlig app.</span>
        </div>
      )}
      {place === "banner" && (
        <section className="install-banner">
          <div className="install-banner-copy">
            <i aria-hidden="true">📲</i>
            <span>
              <strong>HA BUBBSUN SOM EN APP</strong>
              <small>Snabbare att hitta, med en egen ikon på telefonen eller datorn.</small>
            </span>
          </div>
          <button className="install-banner-primary" onClick={() => void install()}>
            INSTALLERA
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
          <h2>HA BUBBSUN SOM EN APP</h2>
          <p>
            Installera Bubbsun på telefonen eller datorn. Då får du en egen ikon
            och kan öppna Bubbsun som en vanlig app.
          </p>
          <button onClick={() => void install()}>
            {installed ? "✓ BUBBSUN ÄR INSTALLERAD" : "📲 INSTALLERA BUBBSUN"}
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
  error,
  busy,
}: {
  onLogin: () => void;
  error: string;
  busy: boolean;
}) {
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
          <button onClick={onLogin} disabled={busy}>
            <GoogleMark /> {busy ? "ANSLUTER…" : "FORTSÄTT MED GOOGLE"}
          </button>
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

function Header({
  onMenu,
  onHome,
  onAdd,
  onManage,
  mode,
  supporterTitle,
  glow,
  tabTitle,
  onlineCount,
  onOpenAdmin,
  language,
}: {
  onMenu: () => void;
  onHome: () => void;
  onAdd: () => void;
  onManage: () => void;
  mode: "add" | "manage" | "none";
  supporterTitle?: string;
  glow?: boolean;
  tabTitle?: string;
  onlineCount?: number;
  onOpenAdmin?: () => void;
  language: string;
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
          </div>
          {typeof onlineCount === "number" && (
            <button
              type="button"
              className="admin-online-count"
              onClick={onOpenAdmin}
              aria-label="Öppna medlemslistan i administrationen"
              title="Öppna medlemslistan"
            >
              Online: {onlineCount}
            </button>
          )}
        </div>
        <button
          className={`brand text-brand header-brand-v3 ${glow ? "brand-glow" : ""}`}
          aria-label="Gå till Mina listor"
          onClick={onHome}
        >
          <span className="header-brand-title">Bubbsun</span>
          <span className="header-brand-tagline">{language === "en" ? "LISTS WITH CHARACTER" : "LISTOR MED KARAKTÄR"}</span>
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
        {mode === "add" ? (
          <button
            className="theme-button header-add"
            aria-label="Skapa en lista"
            onClick={onAdd}
          >
            <Plus />
          </button>
        ) : mode === "manage" ? (
          <button
            className="theme-button header-manage"
            aria-label={tabTitle ? `Hantera ${tabTitle}` : "Hantera listan"}
            onClick={onManage}
          >
            <SlidersHorizontal />
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
            <X />
          </button>
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
            <div className="group-picker">
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
                  {groups[m.groupId]?.name || "Grupp"}
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
            <button onClick={() => onPage("people")}>
              <Users />
              <span>Användare & grupper</span>
              <ChevronRight />
            </button>
            <button onClick={() => onPage("stats")}>
              <BarChart3 />
              <span>Statistik</span>
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
            Bubbsun v0.700 · Web Edition Beta
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
            <span className="list-type-mark" title={`Typ: ${type.label}`}>
              {type.icon} {type.label}
            </span>
            {followed && (
              <Bell className="followed-list-mark" aria-label="Du följer listan" />
            )}
            <span>{list.items.length - done} kvar · {done} klara</span>
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

function NotesPage({notes,privateMode,groupName,groupIconId,resolveCreatorColor,onMode,onLists,onHelp,onOpen,onReorder}:{notes:BubbsunNote[];privateMode:boolean;groupName:string;groupIconId?:string;resolveCreatorColor:(note:BubbsunNote)=>number;onMode:(value:boolean)=>void;onLists:()=>void;onHelp:()=>void;onOpen:(note:BubbsunNote)=>void;onReorder:(from:number,to:number)=>void}){
  const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:5}}),useSensor(TouchSensor,{activationConstraint:{delay:180,tolerance:8}}));
  const end=(event:DragEndEvent)=>{if(!event.over||event.active.id===event.over.id)return;const from=notes.findIndex(note=>note.id===event.active.id),to=notes.findIndex(note=>note.id===event.over?.id);if(from>=0&&to>=0)onReorder(from,to)};
  return <section className="content list-page notes-page"><div className="space-tabs space-tabs-refined"><button className={privateMode?"selected":""} onClick={()=>onMode(true)}><LockKeyhole/><span>PRIVAT</span></button><button className={!privateMode?"selected":""} onClick={()=>onMode(false)}>{groupIconId?<GroupIcon id={groupIconId}/>:<Users/>}<span>GRUPP<small>{groupName}</small></span></button></div><div className="content-tabs content-tabs-refined"><button onClick={onLists}><ListChecks/> LISTOR</button><button className="selected"><NotebookPen/> ANTECKNINGAR</button></div><div className="notes-heading"><div><h2>{privateMode?"MINA ANTECKNINGAR":"GRUPPENS ANTECKNINGAR"}</h2><p>{privateMode?"Bara du ser dessa.":`I ${groupName}.`}</p></div></div>{!notes.length&&<div className="empty-card"><NotebookPen/><strong>{privateMode?"Här är tomt än så länge":"Gruppen har inga anteckningar än"}</strong><span>{privateMode?"Skapa din första anteckning med plusknappen uppe till höger.":"Skapa gruppens första anteckning med plusknappen uppe till höger."}</span><button type="button" onClick={onHelp}><span>👋</span><span><b>NY HÄR?</b><small>Här kan du skriva idéer, planer och sådant du vill minnas.</small></span><ChevronRight/></button></div>}<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={end}><SortableContext items={notes.map(note=>note.id)} strategy={rectSortingStrategy}><div className="note-stack">{notes.map(note=><SortableNoteCard key={note.id} note={note} creatorColor={resolveCreatorColor(note)} onOpen={()=>onOpen(note)}/>)}</div></SortableContext></DndContext></section>
}
function SortableNoteCard({note,creatorColor,onOpen}:{note:BubbsunNote;creatorColor:number;onOpen:()=>void}){const sortable=useSortable({id:note.id});return <article ref={sortable.setNodeRef} style={{transform:CSS.Transform.toString(sortable.transform),transition:sortable.transition} as CSSProperties} className={`note-card ${sortable.isDragging?"dragging":""}`} onClick={onOpen}><span className="note-color" style={{background:rgbaHex(note.color)}}><img src={noteIconSource(note.icon)} alt=""/></span><i className="note-creator-stripe" style={{background:rgbaHex(creatorColor)}}/><div className="note-copy"><strong>{note.title}</strong><small>{note.text.trim()||"Tom anteckning"}</small></div><button aria-label="Flytta anteckning" onClick={event=>event.stopPropagation()} {...sortable.attributes} {...sortable.listeners}><GripVertical/></button><ChevronRight/></article>}
function NoteAppearancePicker({icon,color,onIcon,onColor}:{icon:string;color:number;onIcon:(icon:string)=>void;onColor:(color:number)=>void}){return <><div className="note-icon-picker">{noteIcons.map(value=><button type="button" key={value} className={icon===value?"selected":""} onClick={()=>onIcon(value)}><img src={noteIconSource(value)} alt=""/></button>)}</div><div className="color-picker">{listColorOptions.map(value=><button type="button" key={value} className={color===value?"selected":""} onClick={()=>onColor(value)} style={{"--choice-color":rgbaHex(value)} as CSSProperties}/>)}</div></>}
function NoteEditorPage({note,onSave,onBack,onDelete}:{note:BubbsunNote;onSave:(note:BubbsunNote)=>Promise<boolean>;onBack:()=>void;onDelete:()=>void}){const [title,setTitle]=useState(note.title),[text,setText]=useState(note.text),[icon,setIcon]=useState(note.icon),[color,setColor]=useState(note.color),[logOpen,setLogOpen]=useState(false),[appearanceOpen,setAppearanceOpen]=useState(false),[confirmDelete,setConfirmDelete]=useState(false),[saving,setSaving]=useState(false);useEffect(()=>{setTitle(note.title);setText(note.text);setIcon(note.icon);setColor(note.color)},[note.id,note.title,note.text,note.icon,note.color]);const save=async()=>{if(!title.trim()||saving)return;setSaving(true);try{if(await onSave({...note,title:title.trim(),text,icon,color}))onBack()}finally{setSaving(false)}};return <section className="content note-editor-page"><button className="back-button" onClick={onBack}>‹ ANTECKNINGAR</button><article><div className="note-editor-title"><span style={{background:rgbaHex(color)}}><img src={noteIconSource(icon)} alt=""/></span><input value={title} onChange={event=>setTitle(event.target.value)} maxLength={80} placeholder="Rubrik"/><button className="note-appearance-button" onClick={()=>setAppearanceOpen(true)} title="Ändra ikon och färg"><Palette/></button><button className="note-log-button" onClick={()=>setLogOpen(true)} title="Visa ändringslogg">🕘</button></div><p className="note-created" style={note.creatorColor?{color:rgbaHex(note.creatorColor)}:undefined}>Skapad av {note.creatorName||"Bubbsun"}</p><textarea value={text} onChange={event=>setText(event.target.value)} placeholder="Skriv din anteckning här…"/><div className="note-editor-actions"><button className="danger" onClick={()=>setConfirmDelete(true)}><Trash2/> TA BORT</button><span/><button className="cancel" onClick={onBack}>AVBRYT</button><button disabled={saving||!title.trim()} onClick={()=>void save()}>{saving?"SPARAR…":"SPARA"}</button></div></article>{appearanceOpen&&<div className="modal-backdrop"><div className="modal note-appearance-modal"><div className="note-log-head"><h2>ÄNDRA UTSEENDE</h2><button className="modal-close" onClick={()=>setAppearanceOpen(false)} aria-label="Stäng"><X/></button></div><NoteAppearancePicker icon={icon} color={color} onIcon={setIcon} onColor={setColor}/><div className="modal-actions"><button className="cancel" onClick={()=>setAppearanceOpen(false)}>KLAR</button></div></div></div>}{confirmDelete&&<div className="modal-backdrop"><div className="modal confirm-delete-modal"><h2>TA BORT ANTECKNINGEN?</h2><p>Anteckningen “{note.title}” försvinner.</p><div className="modal-actions"><button className="cancel" onClick={()=>setConfirmDelete(false)}>AVBRYT</button><button className="danger" onClick={()=>onDelete()}>TA BORT</button></div></div></div>}{logOpen&&<div className="modal-backdrop"><div className="modal note-log-modal"><div className="note-log-head"><h2>ÄNDRINGSLOGG</h2><button className="modal-close" onClick={()=>setLogOpen(false)} aria-label="Stäng"><X/></button></div>{note.history?.length?<ul>{note.history.map((entry,index)=><li key={`${entry.at}-${index}`}><strong>{entry.name}</strong><small>{new Date(entry.at).toLocaleString("sv-SE")}</small></li>)}</ul>:<p>Ingen har sparat några ändringar ännu.</p>}</div></div>}</section>}
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
        <button
          className={!privateMode ? "selected" : ""}
          onClick={() => onMode(false)}
        >
          <Users /> <span>GRUPP<small>{groupName}</small></span>
        </button>
      </div>
      <div className="content-tabs content-tabs-refined"><button className="selected"><ListChecks/> LISTOR</button><button onClick={onNotes}><NotebookPen/> ANTECKNINGAR</button></div>
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
}) {
  const sortable = useSortable({ id: item.id, disabled: !canDrag });
  const liked = item.likedBy.includes(uid);
  const [draftName,setDraftName]=useState(item.name);
  const [draftQuantity,setDraftQuantity]=useState(item.quantity);
  const [draftNote,setDraftNote]=useState(item.note||"");
  const [draftAssignedTo,setDraftAssignedTo]=useState(item.assignedTo||"");
  const [draftStatus,setDraftStatus]=useState(item.status||"");
  const [draftPriority,setDraftPriority]=useState(item.priority||"Normal");
  const swipeStart=useRef<{x:number;y:number;pointerId:number}|null>(null);
  const suppressSwipeClick=useRef(false);
  const [swipeOffset,setSwipeOffset]=useState(0);
  const [swiping,setSwiping]=useState(false);
  useEffect(()=>{setDraftName(item.name);setDraftQuantity(item.quantity);setDraftNote(item.note||"");setDraftAssignedTo(item.assignedTo||"");setDraftStatus(item.status||"");setDraftPriority(item.priority||"Normal");},[item.name,item.quantity,item.note,item.assignedTo,item.status,item.priority]);
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
        {(item.quantity||item.assignedTo||item.status||item.priority) && <small>{[item.quantity,item.assignedTo&&`Till: ${item.assignedTo}`,item.status,item.priority&&`Prioritet: ${item.priority}`].filter(Boolean).join(" · ")}</small>}
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
      <div><button className="cancel" onClick={()=>{setDraftName(item.name);setDraftQuantity(item.quantity);setDraftNote(item.note||"");onDirtyChange(false);onCloseEditor()}}>AVBRYT</button><button onClick={()=>{const clean=draftName.trim();if(!clean)return;onPatch(value=>({...value,name:clean,quantity:draftQuantity.trim(),note:draftNote.trim(),assignedTo:draftAssignedTo,status:draftStatus,priority:draftPriority}));onDirtyChange(false);onCloseEditor()}}>SPARA</button></div>
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
  const [assignedTo,setAssignedTo]=useState("");
  const [itemStatus,setItemStatus]=useState("");
  const [priority,setPriority]=useState("Normal");
  const [search, setSearch] = useState("");
  const [showDone, setShowDone] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectMode, setSelectMode] = useState<"" | "delete" | "move">("");
  const selecting = Boolean(selectMode);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
      ...(list.listType==="packing"&&assignedTo?{assignedTo}:{}),
      ...((list.listType==="home"||list.listType==="orders")&&itemStatus?{status:itemStatus}:{}),
      ...(list.listType==="wishlist"?{priority}:{}),
    };
    onChange({ ...list, items: [item, ...list.items] });
    setName("");
    setQuantity("");
    setAssignedTo("");setItemStatus("");setPriority("Normal");
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
      <div className="add-panel">
        <h2>LÄGG TILL</h2>
        <div>
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
            {name.trim().length >= 3 && (
              <span className="suggestions">
                {Array.from(new Set(list.items.map((item) => item.name)))
                  .filter((value) =>
                    value
                      .toLocaleLowerCase("sv")
                      .includes(name.trim().toLocaleLowerCase("sv")),
                  )
                  .slice(0, 6)
                  .map((value) => (
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
          {list.listType==="home"&&<select value={itemStatus} onChange={event=>setItemStatus(event.target.value)}><option value="">Status</option><option>Att göra</option><option>Pågår</option><option>Klart</option></select>}
          {list.listType==="orders"&&<select value={itemStatus} onChange={event=>setItemStatus(event.target.value)}><option value="">Status</option><option>Beställt</option><option>På gång</option><option>Skickat</option><option>Levererat</option><option>Klart</option></select>}
          {list.listType==="wishlist"&&<select value={priority} onChange={event=>setPriority(event.target.value)}><option>Låg</option><option>Normal</option><option>Hög</option><option>Dröm</option></select>}
          <button onClick={() => add()}>
            <Check />
          </button>
        </div>
      </div>
      {selecting && (
        <div
          className={`bulk-delete-bar ${selectMode === "move" ? "bulk-move-bar" : ""}`}
        >
          <button
            onClick={() =>
              setSelectedIds(new Set(list.items.map((item) => item.id)))
            }
          >
            MARKERA ALLA
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
                onChange({
                  ...list,
                  items: list.items.filter((item) => !selectedIds.has(item.id)),
                });
                setSelectMode("");
                setSelectedIds(new Set());
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
                  onChange({
                    ...list,
                    items: list.items.filter((item) => item.id !== itemMenu.id),
                  });
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

function PeoplePage({
  account,
  group,
  members,
  memberships,
  groups,
  language,
}: {
  account: Account;
  group?: Group;
  members: Membership[];
  memberships: Membership[];
  groups: Record<string, Group>;
  language: string;
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
            </span>
            {account.supporter && m.uid === account.uid ? <b>♥</b> : null}
            {isBoss && m.uid !== account.uid && <UserCog />}
          </button>
        ))}
      </div>
      <h2 className="small-heading">MINA GRUPPER</h2>
      <div className="group-list">
        {memberships.map((m) => (
          <div key={m.groupId}>
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
                  className="danger"
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
                  <Trash2 /> TA BORT
                  <br />
                  MEDLEM
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

function StatsPage({
  lists,
  members,
  groupName,
}: {
  lists: BubbsunList[];
  members: Membership[];
  groupName: string;
}) {
  const items = lists.flatMap((x) => x.items),
    completed = items.filter((x) => x.completed),
    likes = items.reduce((n, x) => n + x.likedBy.length, 0);
  const top = [...lists].sort((a, b) => b.items.length - a.items.length)[0],
    mostDone = [...lists].sort(
      (a, b) =>
        b.items.filter((x) => x.completed).length -
        a.items.filter((x) => x.completed).length,
    )[0];
  const avg = lists.length
      ? Math.round((items.length / lists.length) * 10) / 10
      : 0,
    completion = items.length
      ? Math.round((completed.length / items.length) * 100)
      : 0,
    open = items.length - completed.length;
  return (
    <section className="content subpage">
      <div className="content-heading">
        <BarChart3 />
        <div>
          <h1>STATISTIK</h1>
          <p>{groupName}</p>
        </div>
      </div>
      <div className="stats-grid">
        <div>
          <ListChecks />
          <small>LISTOR</small>
          <strong>{lists.length}</strong>
        </div>
        <div>
          <CirclePlus />
          <small>POSTER</small>
          <strong>{items.length}</strong>
        </div>
        <div>
          <Check />
          <small>KLARA</small>
          <strong>{completed.length}</strong>
        </div>
        <div>
          <span className="stats-flame">🔥</span>
          <small>ELDAR</small>
          <strong>{likes}</strong>
        </div>
      </div>
      <div className="stats-fun-grid">
        <div>
          <strong>{open}</strong>
          <small>KVAR JUST NU</small>
        </div>
        <div>
          <strong>{avg}</strong>
          <small>POSTER PER LISTA</small>
        </div>
        <div>
          <strong>{lists.filter((x) => x.items.length === 0).length}</strong>
          <small>TOMMA LISTOR</small>
        </div>
        <div>
          <strong>{items.filter((x) => x.quantity.trim()).length}</strong>
          <small>MED MÄNGD</small>
        </div>
      </div>
      <div className="bar-card">
        <h2>KLART I PROCENT</h2>
        <div>
          <i style={{ width: `${completion}%` }} />
        </div>
        <strong>{completion}%</strong>
      </div>
      <div className="feature-card">
        <span>🏆</span>
        <div>
          <small>MEST ANVÄNDA LISTA</small>
          <strong>{top?.name || "Ingen ännu"}</strong>
          <p>{top?.items.length || 0} poster</p>
        </div>
      </div>
      <div className="feature-card">
        <span>👥</span>
        <div>
          <small>AKTIVA I GRUPPEN</small>
          <strong>{members.length}</strong>
          <p>familjemedlemmar</p>
        </div>
      </div>
      <div className="feature-card">
        <span>✅</span>
        <div>
          <small>FLEST AVBOCKNINGAR</small>
          <strong>{mostDone?.name || "Ingen ännu"}</strong>
          <p>
            {mostDone?.items.filter((x) => x.completed).length || 0} klara
            poster
          </p>
        </div>
      </div>
      <div className="stats-cheer">
        <span>{completion >= 75 ? "🏆" : completion >= 40 ? "✨" : "🌱"}</span>
        <div>
          <strong>
            {completion >= 75
              ? "Riktigt listproffs!"
              : completion >= 40
                ? "Bra fart i listorna!"
                : "Allt börjar med en post."}
          </strong>
          <p>
            {likes
              ? `${likes} tummar har delats ut i ${groupName}.`
              : "Här finns plats för de första tummarna."}
          </p>
        </div>
      </div>
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
                <img src={`/assets/android/${theme.icon}`} alt="" />
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

function SupportPage({
  account,
  onActivate,
  onSave,
}: {
  account: Account;
  onActivate: () => Promise<void>;
  onSave: (values: Record<string, unknown>) => void;
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
    <section className="content subpage">
      <div className="content-heading">
        <span className="heading-emoji">♥</span>
        <div>
          <h1>STÖD BUBBSUN</h1>
          <p>Supporter, Facebook och Bubbsun</p>
        </div>
      </div>
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

function HelpPage() {
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
  ];
  const [open, setOpen] = useState("");
  return (
    <section className="content subpage help-page">
      <div className="content-heading">
        <ListChecks />
        <div>
          <h1>HJÄLP & GUIDER</h1>
          <p>Enkla förklaringar, steg för steg</p>
        </div>
      </div>
      <div className="help-welcome">
        <span>👋</span>
        <div>
          <h2>Välkommen till Bubbsun!</h2>
          <p>
            Här finns hjälp utan krångliga ord. Tryck på en fråga nedan för att
            läsa svaret.
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
      <h2 className="help-all-title">ALLA GUIDER</h2>
      <div className="guide-list help-guide-list">
        {guides.map((guide) => {
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
          "Google-kontots unika ID, visningsnamn, vald färg, gruppmedlemskap, notisinställningar samt delade och privata listor.",
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

function VersionsPage() {
  return (
    <section className="content subpage">
      <div className="content-heading">
        <ListChecks />
        <div>
          <h1>VERSIONER & NYHETER</h1>
          <p>Patch notes</p>
        </div>
      </div>
      <div className="version-card">
        <strong>WEBBAPP · FÖRHANDSVISNING</strong>
        <p>
          Ny responsiv Bubbsun-webbapp med delade och privata listor,
          Google-inloggning, teman och gruppsynkning.
        </p>
      </div>
      {["0.604", "0.603", "0.602", "0.601", "0.600", "0.501", "0.500"].map(
        (v) => (
          <a
            className="version-link"
            key={v}
            href={`https://github.com/finalworld/Bubbsun/releases/tag/v${v}`}
            target="_blank"
            rel="noreferrer"
          >
            Bubbsun v{v}
            <ChevronRight />
          </a>
        ),
      )}
    </section>
  );
}

function AboutPage({ onPage }: { onPage: (page: Page) => void }) {
  return (
    <section className="content subpage">
      <div className="content-heading">
        <span className="heading-emoji">ⓘ</span>
        <div>
          <h1>OM BUBBSUN</h1>
          <p>Version, skapare och kontakt</p>
        </div>
      </div>
      <div className="about-top">
        <div className="creator-card">
          <div>
            <img src="/assets/android/about_man.png" />
            <span>
              <strong>Daniel Grandin</strong>
              <small>Utveckling & design</small>
            </span>
          </div>
          <div>
            <img src="/assets/android/about_woman.png" />
            <span>
              <strong>Sanja Kropsu</strong>
              <small>Idéer, testning & feedback</small>
            </span>
          </div>
          <div>
            <img src="/assets/android/frasse.png" />
            <span>
              <strong>Frasse</strong>
              <small>Support & kvalitetskontroll</small>
            </span>
          </div>
        </div>
        <div className="info-card about-story">
          <span>✦</span>
          <h2>LISTOR MED HJÄRTA</h2>
          <p>
            Bubbsun föddes ur vardagens små listor – och växte till en varm
            plats där familjen kan hjälpas åt, minnas mer och glömma mindre.
          </p>
          <strong>Enkelt. Personligt. Tillsammans.</strong>
        </div>
      </div>
      <div className="about-links">
        <button className="problem" onClick={() => onPage("feedback")}>
          🐞 RAPPORTERA PROBLEM
        </button>
        <button onClick={() => onPage("feedback")}>💡 SKICKA FÖRSLAG</button>
        <button onClick={() => onPage("versions")}>
          📋 VERSIONER & NYHETER
        </button>
        <button onClick={() => onPage("help")}>ⓘ HJÄLP & GUIDER</button>
        <button onClick={() => onPage("privacy")}>
          🔒 INTEGRITET & MOLNDATA
        </button>
        <button onClick={() => onPage("support")}>♥ STÖD BUBBSUN</button>
      </div>
    </section>
  );
}

function AdminPage({
  lists,
  members,
  accounts,
  reports,
  palettes,
  followedCount,
  onlineUserIds,
}: {
  lists: BubbsunList[];
  members: Membership[];
  accounts: Account[];
  reports: Report[];
  palettes: Record<string, ThemePalette>;
  followedCount: number;
  onlineUserIds: Set<string>;
}) {
  const [tab, setTab] = useState<"members" | "reports" | "pin" | "themes">(
      "members",
    ),
    [selected, setSelected] = useState<Account | null>(null);
  const items = lists.flatMap((list) => list.items);
  const orderedAccounts = [...accounts].sort((a, b) => {
    const onlineDifference = Number(onlineUserIds.has(b.uid)) - Number(onlineUserIds.has(a.uid));
    return onlineDifference || a.displayName.localeCompare(b.displayName, "sv");
  });
  return (
    <section className="content subpage admin-page">
      <div className="content-heading">
        <span className="heading-emoji">👑</span>
        <div>
          <h1>MEGASUPERBOSS</h1>
          <p>Global administration</p>
        </div>
      </div>
      <div className="stats-grid">
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
        <div>
          <Bell />
          <small>ANTAL FÖLJNINGAR</small>
          <strong>{followedCount}</strong>
        </div>
        <button onClick={() => setTab("reports")}>
          <span>🐞</span>
          <small>NYA RAPPORTER</small>
          <strong>
            {reports.filter((report) => report.status === "new").length}
          </strong>
        </button>
      </div>
      <div className="admin-tabs">
        <button
          className={tab === "members" ? "selected" : ""}
          onClick={() => setTab("members")}
        >
          MEDLEMMAR
        </button>
        <button
          className={tab === "reports" ? "selected" : ""}
          onClick={() => setTab("reports")}
        >
          BUGGAR & FÖRSLAG
        </button>
        <button
          className={tab === "pin" ? "selected" : ""}
          onClick={() => setTab("pin")}
        >
          GLOBAL PIN
        </button>
        <button
          className={tab === "themes" ? "selected" : ""}
          onClick={() => setTab("themes")}
        >
          TEMAFÄRGER
        </button>
      </div>
      {tab === "members" && (
        <div className="admin-member-list">
          {orderedAccounts.map((person) => (
            <button key={person.uid} onClick={() => setSelected(person)}>
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
              <ChevronRight />
            </button>
          ))}
        </div>
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
      {tab === "pin" && <GlobalPinEditor />}{" "}
      {tab === "themes" && (
        <div className="admin-themes">
          {themes.map((theme) => (
            <ThemeEditor
              key={theme.id}
              theme={{ ...theme, ...palettes[theme.id] }}
            />
          ))}
        </div>
      )}
      <a
        className="version-link"
        href="https://github.com/finalworld/Bubbsun/releases"
        target="_blank"
        rel="noreferrer"
      >
        RELEASER & NEDLADDNINGAR
        <ChevronRight />
      </a>
      {selected && (
        <AdminUserDialog
          account={selected}
          lists={lists}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
function AdminUserDialog({
  account,
  lists,
  onClose,
}: {
  account: Account;
  lists: BubbsunList[];
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
  const madeLists = lists.filter((x) => x.creatorId === account.uid),
    madeItems = lists
      .flatMap((x) => x.items)
      .filter((x) => x.ownerId === account.uid);
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
        <div className="member-stats">
          <span>
            <b>{madeLists.length}</b> listor
          </span>
          <span>
            <b>{madeItems.filter((x) => !x.completed).length}</b> kvar
          </span>
          <span>
            <b>{madeItems.filter((x) => x.completed).length}</b> klara
          </span>
        </div>
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
    ],
  );
  return (
    <details>
      <summary>
        <img src={`/assets/android/${theme.icon}`} />
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
            {key}
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
            await saveThemePalette({ id: theme.id, ...values });
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

function AuthenticatedApp() {
  const privateListsLoadedFor = useRef("");
  const listsHistoryRef = useRef<BubbsunList[]>([]);
  const privateListsHistoryRef = useRef<BubbsunList[]>([]);
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
  const [privateMode, setPrivateMode] = useState(false);
  const [page, setPage] = useState<Page>("lists");
  const [selected, setSelected] = useState<BubbsunList | null>(null);
  const [selectedPrivate, setSelectedPrivate] = useState(false);
  const [selectedNote,setSelectedNote]=useState<BubbsunNote|null>(null);
  const [selectedNotePrivate,setSelectedNotePrivate]=useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addingNote,setAddingNote]=useState(false);
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
  const [listReadAt,setListReadAt]=useState<Map<string,number>>(new Map());
  const [selectedUnreadAfter,setSelectedUnreadAfter]=useState(NEW_BADGE_EPOCH);
  const notifiedVersions = useRef<Record<string, number>>({});
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [themePalettes, setThemePalettes] = useState<
    Record<string, ThemePalette>
  >({});
  const [allAdminLists, setAllAdminLists] = useState<BubbsunList[]>([]);
  const [allAdminPrivateLists, setAllAdminPrivateLists] = useState<
    BubbsunList[]
  >([]);
  const [allAdminFollowedCount, setAllAdminFollowedCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [saveConflict, setSaveConflict] = useState(false);
  const [databaseReady, setDatabaseReady] = useState(false);

  useEffect(() => {
    listsHistoryRef.current = lists;
  }, [lists]);

  useEffect(() => {
    privateListsHistoryRef.current = privateLists;
  }, [privateLists]);

  useEffect(() => {
    const currentState = window.history.state ?? {};
    if (!currentState.bubbsunPage) {
      window.history.replaceState(
        { ...currentState, bubbsunPage: "lists", privateMode: false },
        "",
      );
    }

    const restoreFromHistory = (event: PopStateEvent) => {
      const state = event.state as
        | {
            bubbsunPage?: Page;
            listId?: string;
            privateList?: boolean;
            privateMode?: boolean;
          }
        | null;
      if (!state?.bubbsunPage) return;

      setMenuOpen(false);
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

      setSelected(null);
      setPage(state.bubbsunPage === "list" ? "lists" : state.bubbsunPage);
    };

    window.addEventListener("popstate", restoreFromHistory);
    return () => window.removeEventListener("popstate", restoreFromHistory);
  }, []);

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
  useEffect(()=>user&&databaseReady?watchPrivateNotes(user.uid,setPrivateNotes):undefined,[user,databaseReady]);
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
    if (!account?.megaSuperBoss && !account?.founder) {
      setOnlineCount(0);
      return;
    }
    return watchOnlineCount(setOnlineCount);
  }, [account?.megaSuperBoss, account?.founder]);
  useEffect(() => {
    if (!account?.megaSuperBoss && !account?.founder) {
      setOnlineUserIds(new Set());
      return;
    }
    return watchOnlineUserIds(setOnlineUserIds);
  }, [account?.megaSuperBoss, account?.founder]);
  useEffect(
    () =>
      user && databaseReady
        ? watchMemberships(user.uid, setMemberships)
        : undefined,
    [user, databaseReady],
  );
  useEffect(
    () =>
      user && databaseReady
        ? watchPrivateLists(user.uid, setPrivateLists)
        : undefined,
    [user, databaseReady],
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
  useEffect(() => {
    if (!account?.activeGroupId || privateMode) {
      setMembers([]);
      setLists([]);
      return;
    }
    const a = watchGroupMembers(account.activeGroupId, setMembers),
      b = watchLists(account.activeGroupId, setLists);
    return () => {
      a();
      b();
    };
  }, [account?.activeGroupId, privateMode]);
  useEffect(()=>{if(!account?.activeGroupId||privateMode){setNotes([]);return;}return watchNotes(account.activeGroupId,setNotes);},[account?.activeGroupId,privateMode]);
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
  useEffect(
    () =>
      user && databaseReady
        ? watchFollowedLists(user.uid, setFollowedListIds)
        : undefined,
    [user, databaseReady],
  );
  useEffect(
    () => user&&databaseReady?watchListReadStates(user.uid,setListReadAt):undefined,
    [user,databaseReady],
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
  useEffect(() => {
    if (!account?.megaSuperBoss && !account?.founder) return;
    const a = watchAllAccounts(setAllAccounts),
      b = watchReports(setReports),
      c = watchThemePalettes(setThemePalettes);
    return () => {
      a();
      b();
      c();
    };
  }, [account?.megaSuperBoss, account?.founder]);
  useEffect(() => {
    if (!account?.megaSuperBoss && !account?.founder) return;
    const a = watchAllLists(setAllAdminLists),
      b = watchAllPrivateLists(setAllAdminPrivateLists);
    return () => {
      a();
      b();
    };
  }, [account?.megaSuperBoss, account?.founder]);
  useEffect(() => {
    if (!account?.megaSuperBoss && !account?.founder) return;
    return watchAllFollowedLists(
      allAccounts.map((item) => item.uid),
      setAllAdminFollowedCount,
    );
  }, [account?.megaSuperBoss, account?.founder, allAccounts]);
  useEffect(() => {
    localStorage.setItem("bubbsun-theme", themeId);
  }, [themeId]);
  useEffect(() => {
    localStorage.setItem("bubbsun-language", language);
  }, [language]);
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const first = requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        window.scrollTo({ top: 0, left: 0, behavior: "auto" }),
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
  const groupName = privateMode
    ? "Mina privata listor"
    : activeGroup?.name || "Ingen grupp vald";
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
  const activeTheme = { ...themeBase, ...themePalettes[themeBase.id] };
  const themeStyle = {
    "--theme-bg": activeTheme.bg,
    "--theme-paper": activeTheme.paper,
    "--theme-panel": activeTheme.panel,
    "--theme-text": activeTheme.text,
    "--theme-accent": activeTheme.accent,
    "--theme-outline": activeTheme.outline,
    "--theme-header": activeTheme.header || activeTheme.panel,
    "--theme-header-button": activeTheme.headerButton || activeTheme.accent,
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
      // uses the firebaseapp.com helper domain and modern mobile browsers can
      // return without carrying that cross-domain session back to Bubbsun.
      // A popup/custom tab is started directly by the button press and works
      // consistently on Android, iPhone and desktop.
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Google sign-in failed", e);
      const code = (e as { code?: string })?.code;
      setLoginError(
        code === "auth/popup-blocked"
          ? "Safari blockerade inloggningsfönstret. Tillåt popup-fönster för Bubbsun och försök igen."
          : "Google-inloggningen kunde inte slutföras. Försök igen.",
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
    setMenuOpen(false);
    setListToolsOpen(false);
  };
  const openList = (list: BubbsunList, isPrivate: boolean) => {
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
    setSelected(next);
    if (selectedPrivate && user) {
      setPrivateLists((old) => old.map((x) => (x.id === next.id ? next : x)));
      await savePrivateList(user.uid, next);
    } else if (account && user)
      try {
        await saveList(account.activeGroupId, next, user.uid);
      } catch (error) {
        if (error instanceof Error && error.message === "LIST_CONFLICT")
          setSaveConflict(true);
        else throw error;
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
  const openNote=(note:BubbsunNote,isPrivate=privateMode)=>{setSelectedNote(note);setSelectedNotePrivate(isPrivate);navigate("note");};
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
    return <LoginPage onLogin={login} error={loginError} busy={busy} />;
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
      <LanguageBridge language={language} />
      <Header
        supporterTitle={account.supporter ? account.supporterTitle : undefined}
        glow={account.supporter && account.supporterGlow !== false}
        tabTitle={page === "list" ? activeSelected?.name : page === "note" ? selectedNote?.title : undefined}
        onMenu={() => setMenuOpen(true)}
        onHome={() => navigate("lists")}
        onAdd={() => page === "notes" ? setAddingNote(true) : setAdding(true)}
        onManage={() => setListToolsOpen((open) => !open)}
        mode={page === "lists" || page === "notes" ? "add" : page === "list" ? "manage" : "none"}
        onlineCount={account.megaSuperBoss || account.founder ? onlineCount : undefined}
        onOpenAdmin={
          account.megaSuperBoss || account.founder
            ? () => navigate("admin")
            : undefined
        }
        language={language}
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
      {page === "notes" && <NotesPage notes={activeNotes} privateMode={privateMode} groupName={groupName} groupIconId={activeGroup?.iconId} resolveCreatorColor={note=>privateMode?account.personalColor:(members.find(member=>member.uid===note.creatorId)?.color??note.creatorColor??note.color)} onMode={value=>{setPrivateMode(value);setSelectedNote(null)}} onLists={()=>navigate("lists")} onHelp={()=>navigate("help")} onOpen={note=>openNote(note)} onReorder={(from,to)=>void reorderNotes(from,to)} />}
      {page === "note" && selectedNote && <NoteEditorPage note={selectedNote} onBack={()=>navigate("notes")} onSave={note=>persistNote(note)} onDelete={async()=>{if(selectedNotePrivate)await removePrivateNote(user.uid,selectedNote.id);else if(account.activeGroupId)await removeNote(account.activeGroupId,selectedNote.id);navigate("notes")}}/>}
      {page === "people" && (
        <PeoplePage
          account={account}
          group={activeGroup}
          members={members}
          memberships={memberships}
          groups={groups}
          language={language}
        />
      )}
      {page === "stats" && (
        <StatsPage
          lists={visibleLists}
          members={members}
          groupName={groupName}
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
        />
      )}
      {page === "help" && <HelpPage />}
      {page === "privacy" && <PrivacyPage />}
      {page === "feedback" && (
        <FeedbackPage uid={user.uid} language={language} themeId={themeId} />
      )}
      {page === "versions" && <VersionsPage />}
      {page === "about" && <AboutPage onPage={navigate} />}
      {page === "admin" && (account.megaSuperBoss || account.founder) && (
        <AdminPage
          lists={[...allAdminLists, ...allAdminPrivateLists]}
          members={members}
          accounts={allAccounts}
          reports={reports}
          palettes={themePalettes}
          followedCount={allAdminFollowedCount}
          onlineUserIds={onlineUserIds}
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
          navigate("lists");
        }}
        onGroup={async (id) => {
          await switchGroup(user.uid, id);
          setPrivateMode(false);
          navigate("lists");
        }}
        onPage={navigate}
        onLogout={() => signOut(auth)}
        onInvite={() => void inviteFriend()}
      />
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
      {addingNote&&<NewNoteEditor onCancel={()=>setAddingNote(false)} onSave={note=>void createNote(note)}/>} 
    </main>
  );
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

export default function App() {
  const match=window.location.pathname.match(/^\/list\/(?:.*-)?([a-f0-9]{10})\/?$/i);
  return match?<PublicSharedListPage code={match[1]} />:<AuthenticatedApp />;
}
