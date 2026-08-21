import { NextResponse } from "next/server";
import { getSessionUser } from "@/app/lib/server-auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({
      id: user.id,
      username: user.username,
      role: user.role,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

