import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { ROOT_PASSWORD, ROOT_USERNAME, createSessionCookie, ensureRootAdmin } from "@/app/lib/server-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };
    const username = body.username?.trim();
    const password = body.password?.trim();

    if (!username || !password) {
      return NextResponse.json({ error: "username and password are required" }, { status: 400 });
    }

    await ensureRootAdmin();

    const db = getDb();
    const rows = await db
      .select()
      .from(users)
      .where(and(eq(users.username, username), eq(users.password, password), eq(users.isActive, 1)))
      .limit(1);

    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (user.username === ROOT_USERNAME && user.password !== ROOT_PASSWORD) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const response = NextResponse.json({
      user: { id: user.id, username: user.username, role: user.role },
      status: "ok",
    });
    await createSessionCookie(response, user.id);
    return response;
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
