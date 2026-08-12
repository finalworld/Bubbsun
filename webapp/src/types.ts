export type Account = {
  uid: string;
  displayName: string;
  activeGroupId: string;
  globalTitle: string;
  titleColor: number;
  supporter: boolean;
  supporterTitle?: string;
  supporterGlow?: boolean;
  personalColor?: number;
  megaSuperBoss: boolean;
  founder: boolean;
  suspended?: boolean;
  hiddenGlobalPinRevision?: number;
  privacyVersion: number;
};

export type Membership = {
  groupId: string;
  uid: string;
  displayName: string;
  color: number;
  role: string;
  order: number;
};

export type Group = {
  id: string;
  name: string;
  iconId: string;
  color: number;
  ownerId: string;
  joinCode: string;
};

export type ListItem = {
  id: string;
  name: string;
  quantity: string;
  ownerId: string;
  completed: boolean;
  createdAt: number;
  completedAt: number | null;
  likedBy: string[];
};

export type BubbsunList = {
  id: string;
  name: string;
  icon: string;
  iconColor: number | string;
  creatorId: string;
  sortMode: string;
  doneFirst: boolean;
  doneExpanded: boolean;
  order: number;
  items: ListItem[];
};

export type GlobalPin = { id: string; title: string; infoText: string; status: string; revision: number; createdAt?: unknown; items: Array<{ id: string; name: string; quantity: string; order: number; reactionCount: number }> };
export type Page = "lists" | "list" | "people" | "stats" | "settings" | "support" | "about" | "help" | "privacy" | "feedback" | "versions" | "admin";

export type Report = { id: string; authorUid: string; kind: string; category: string; title: string; description: string; status: string; createdAt?: unknown };
export type ThemePalette = { id: string; bg: string; paper: string; panel: string; text: string; accent: string; outline: string };
