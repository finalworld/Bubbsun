import { and, desc, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { appState, sessions, users } from "@/db/schema";

const SESSION_COOKIE_NAME = "rk-kassa-session";
const SESSION_TTL_DAYS = 30;
const ROOT_USERNAME = "finalworld";
const ROOT_PASSWORD = "sadani11";

const getSessionExpiration = () =>
  Math.floor(Date.now() / 1000) + SESSION_TTL_DAYS * 24 * 60 * 60;

export type SessionUser = {
  id: number;
  username: string;
  role: string;
};

export async function ensureRootAdmin() {
  const db = getDb();
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, ROOT_USERNAME))
    .limit(1);

  if (existing.length > 0) return;

  await db.insert(users).values({
    username: ROOT_USERNAME,
    password: ROOT_PASSWORD,
    role: "admin",
    isActive: 1,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      isActive: users.isActive,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)));

  if (!rows.length || !rows[0].isActive) return null;
  return { id: rows[0].id, username: rows[0].username, role: rows[0].role };
}

export async function createSessionCookie(response: NextResponse, userId: number) {
  const token = crypto.randomUUID();
  const expiresAt = getSessionExpiration();
  const db = getDb();

  await db.insert(sessions).values({ token, userId, expiresAt });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

export async function clearSession(response: NextResponse) {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return null;
  }
  return user;
}

export async function getAppState() {
  const db = getDb();
  const rows = await db.select().from(appState).orderBy(desc(appState.updatedAt));
  const map = new Map<string, string>();
  for (const row of rows) map.set(row.key, row.value);
  return map;
}

export async function saveAppState(changes: Record<string, string>) {
  const db = getDb();
  const entries = Object.entries(changes);
  for (const [key, value] of entries) {
    await db
      .insert(appState)
      .values({ key, value })
      .onConflictDoUpdate({
        target: appState.key,
        set: { value, updatedAt: Math.floor(Date.now() / 1000) },
      });
  }
}

export { ROOT_USERNAME, ROOT_PASSWORD };

