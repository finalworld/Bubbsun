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
  hiddenGlobalPinId?: string;
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

export type JoinRequest = { groupId: string; uid: string; displayName: string; status: string; requestedColor: number };

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
  note?: string;
  assignedTo?: string;
  status?: string;
  priority?: string;
  room?: string;
  recurrence?: string;
  dueDate?: string;
  taskType?: string;
};

export type BubbsunList = {
  id: string;
  name: string;
  icon: string;
  iconColor: number | string;
  listType?: string;
  packPeople?: string[];
  creatorId: string;
  sortMode: string;
  doneFirst: boolean;
  doneExpanded: boolean;
  order: number;
  pinned?: boolean;
  updatedBy?: string;
  updatedAt?: number;
  revision?: number;
  items: ListItem[];
};
export type NoteLogEntry={uid:string;name:string;at:number};
export type BubbsunNote = { id:string; title:string; text:string; icon:string; color:number; order:number; creatorId:string; creatorName?:string; creatorColor?:number; createdAt?:number; updatedAt?:number; history?:NoteLogEntry[] };

export type GlobalPin = { id: string; title: string; infoText: string; status: string; revision: number; createdAt?: unknown; updatedAt?: unknown; publishedAt?: unknown; unpublishedAt?: unknown; items: Array<{ id: string; name: string; quantity: string; order: number; reactionCount: number }> };
export type PublicListShare = { id: string; name: string; createdAt?: unknown; showNotes?: boolean; items: Array<{ name: string; quantity: string; completed: boolean; note?: string }> };
export type Page = "lists" | "list" | "notes" | "note" | "people" | "stats" | "settings" | "support" | "about" | "help" | "privacy" | "feedback" | "versions" | "admin";

export type Report = { id: string; authorUid: string; kind: string; category: string; title: string; description: string; status: string; createdAt?: unknown };
export type ThemePalette = { id: string; bg: string; paper: string; panel: string; text: string; accent: string; outline: string; header?: string; headerButton?: string };
