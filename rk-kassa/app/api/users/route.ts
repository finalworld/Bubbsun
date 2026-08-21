import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { getSessionUser, requireAdmin } from "@/app/lib/server-auth";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.id));

    return NextResponse.json({
      users: rows.map((row) => ({ ...row, isActive: row.isActive === 1 })),
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as {
      username?: string;
      password?: string;
      role?: string;
    };
    const username = body.username?.trim();
    const password = body.password?.trim();
    const role = body.role?.trim() || "cashier";

    if (!username || !password) {
      return NextResponse.json({ error: "username and password are required" }, { status: 400 });
    }

    const db = getDb();
    const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existing.length) {
      return NextResponse.json({ error: "Användarnamnet används redan" }, { status: 409 });
    }

    const [inserted] = await db
      .insert(users)
      .values({ username, password, role, isActive: 1 })
      .returning({ id: users.id, username: users.username, role: users.role, isActive: users.isActive, createdAt: users.createdAt });

    return NextResponse.json({ user: { ...inserted, isActive: inserted.isActive === 1 } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as {
      id?: number;
      role?: string;
      isActive?: boolean;
      password?: string;
    };
    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updates: Record<string, string | number | boolean> = {};
    if (body.role) updates.role = body.role;
    if (typeof body.isActive === "boolean") updates.isActive = body.isActive ? 1 : 0;
    if (body.password?.trim()) updates.password = body.password.trim();

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "No changes" }, { status: 400 });
    }

    const db = getDb();
    await db.update(users).set(updates).where(eq(users.id, body.id));
    return NextResponse.json({ status: "updated" });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = new URL(request.url).searchParams;
    const id = Number(searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const db = getDb();
    await db.delete(users).where(eq(users.id, id));
    await db.delete(sessions).where(eq(sessions.userId, id));
    return NextResponse.json({ status: "deleted" });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

