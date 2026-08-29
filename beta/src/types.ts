export type Account = {
  uid: string;
  displayName: string;
  activeGroupId: string;
  globalTitle: string;
  titleColor: number;
  supporter: boolean;
  supporterTitle?: string;
  supporterGlow?: boolean;
  supporterGlowColor?: string;
  themeId?: string;
  personalColor?: number;
  megaSuperBoss: boolean;
  founder: boolean;
  suspended?: boolean;
  hiddenGlobalPinRevision?: number;
  hiddenGlobalPinId?: string;
  privacyVersion: number;
  activitySeenAt?: number;
  createdAt?: number;
  lastActiveAt?: number;
  visitCount?: number;
  visitLog?: number[];
};

export type AdminUserCounts = {
  notes: number;
  calendarEvents: number;
  recipes: number;
  groups: number;
  followedLists: number;
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
  assigneeId?: string;
  assigneeName?: string;
  status?: string;
  priority?: string;
  room?: string;
  recurrence?: string;
  dueDate?: string;
  taskType?: string;
};

export type DirectChat = { id:string; participantIds:string[]; participantNames:Record<string,string>; participantColors:Record<string,number>; lastMessage:string; lastMessageAt:number; lastSenderId:string; readAt:Record<string,number> };
export type DirectMessage = { id:string; senderId:string; text:string; createdAt:number };

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
  createdAt?: number;
  updatedBy?: string;
  updatedAt?: number;
  revision?: number;
  items: ListItem[];
};
export type NoteLogEntry={uid:string;name:string;at:number};
export type BubbsunNote = { id:string; title:string; text:string; icon:string; color:number; order:number; creatorId:string; creatorName?:string; creatorColor?:number; createdAt?:number; updatedAt?:number; history?:NoteLogEntry[] };

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time?: string;
  endTime?: string;
  allDay?: boolean;
  category?: string;
  mealType?: string;
  color?: number;
  birthYear?: number;
  recurrenceType?: "" | "weekly" | "yearly";
  recurrenceDays?: number[];
  recurrenceForever?: boolean;
  recurrenceUntil?: string;
  excludedDates?: string[];
  note?: string;
  linkedListIds?: string[];
  linkedRecipeIds?: string[];
  reminderMinutes?: number;
  creatorId: string;
  creatorName: string;
  createdAt: number;
  updatedAt: number;
  updatedBy?: string;
  locations?: string[];
};

export type BudgetEntry = {
  id: string;
  type: "income" | "expense" | "transfer";
  title: string;
  amount: number;
  category: string;
  subcategory?: string;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  date: string;
  recurrence?: "monthly";
  status?: "planned" | "paid";
  paidAt?: number;
  note?: string;
  creatorId: string;
  creatorName: string;
  createdAt: number;
  updatedAt: number;
};

export type BudgetAccount = { id: string; name: string; icon?: string; openingBalance?: number; reconciledBalance?: number; reconciledAt?: number };
export type BudgetBank = { id: string; name: string; accounts: BudgetAccount[] };
export type BudgetSavingsGoal = { id: string; name: string; target: number; saved: number; accountId?: string };
export type BudgetSettings = { banks: BudgetBank[]; categoryBudgets?: Record<string,number>; savingsGoals?: BudgetSavingsGoal[]; updatedAt: number };

export type RecipeIngredient = { id: string; amount: string; unit: string; name: string; isHeading?: boolean };
export type Recipe = {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  isPublic?: boolean;
  sourcePath?: string;
  locations?: string[];
  copiedFromRecipeId?: string;
  originalCreatorId?: string;
  originalCreatorName?: string;
  originalCreatorColor?: number;
  publicationLocked?: boolean;
  image?: string;
  servings: number;
  servingUnit?: string;
  minutes: number;
  ingredients: RecipeIngredient[];
  instructions: string;
  description?: string;
  sourceUrl?: string;
  note?: string;
  linkedListId?: string;
  linkedRecipeIds?: string[];
  dietaryTags?: string[];
  creatorId: string;
  creatorName: string;
  creatorColor: number;
  createdAt: number;
  updatedAt: number;
  updatedBy?: string;
  likedBy?: string[];
};

export type GlobalPin = { id: string; title: string; infoText: string; status: string; revision: number; createdAt?: unknown; updatedAt?: unknown; publishedAt?: unknown; unpublishedAt?: unknown; items: Array<{ id: string; name: string; quantity: string; order: number; reactionCount: number }> };
export type PublicListShare = { id: string; name: string; createdAt?: unknown; showNotes?: boolean; items: Array<{ name: string; quantity: string; completed: boolean; note?: string }> };
export type Page = "lists" | "list" | "notes" | "note" | "calendar" | "meal-planner" | "recipes" | "recipe-discover" | "budget" | "games" | "frasse" | "yatzy" | "notifications" | "chat" | "people" | "stats" | "settings" | "support" | "about" | "help" | "privacy" | "feedback" | "versions" | "admin";

export type Report = { id: string; authorUid: string; kind: string; category: string; title: string; description: string; status: string; createdAt?: unknown };
export type ThemePalette = { id: string; bg: string; paper: string; panel: string; text: string; accent: string; outline: string; header?: string; headerButton?: string; brandDecoration?: string; brandSuffix?: string; calendarEventBackground?: string; paletteVersion?: number };
