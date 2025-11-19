import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/server/auth/storage";
import type { UserSession } from "@/server/auth/replitAuth";

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("user_session")?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const session: UserSession = JSON.parse(sessionCookie);
    
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && now > session.expires_at) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const user = await getUser(session.claims.sub);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
