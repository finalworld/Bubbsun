import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { appState } from "@/db/schema";
import { getSessionUser, saveAppState } from "@/app/lib/server-auth";

type AppStatePayload = {
  sales?: unknown;
  days?: unknown;
  categories?: unknown;
  cashiers?: unknown;
  currentCashierId?: number;
};

const defaults: Record<string, string> = {
  sales: "[]",
  days: "[]",
  categories: "[]",
  cashiers: "[]",
  currentCashierId: "1",
};

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    const rows = await db.select().from(appState);
    const values = new Map(rows.map((row) => [row.key, row.value]));

    return NextResponse.json({
      sales: JSON.parse(values.get("sales") ?? defaults.sales),
      days: JSON.parse(values.get("days") ?? defaults.days),
      categories: JSON.parse(values.get("categories") ?? defaults.categories),
      cashiers: JSON.parse(values.get("cashiers") ?? defaults.cashiers),
      currentCashierId: Number(values.get("currentCashierId") ?? defaults.currentCashierId),
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = (await request.json()) as { state?: Partial<AppStatePayload> };
    const state = payload.state ?? {};
    const changes: Record<string, string> = {};

    if (state.sales !== undefined) changes.sales = JSON.stringify(state.sales);
    if (state.days !== undefined) changes.days = JSON.stringify(state.days);
    if (state.categories !== undefined) changes.categories = JSON.stringify(state.categories);
    if (state.cashiers !== undefined) changes.cashiers = JSON.stringify(state.cashiers);
    if (state.currentCashierId !== undefined) {
      changes.currentCashierId = String(state.currentCashierId);
    }

    if (!Object.keys(changes).length) {
      return NextResponse.json({ status: "ok", message: "No changes" });
    }

    await saveAppState(changes);
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
