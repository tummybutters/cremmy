import { NextResponse } from "next/server";
import { getUser } from "@/server/auth/storage";
import { getSession } from "@/server/auth/ironSession";

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const now = Math.floor(Date.now() / 1000);
    if (session.expiresAt && now > session.expiresAt) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const user = await getUser(session.userId);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
