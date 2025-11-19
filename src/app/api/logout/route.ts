import { NextRequest, NextResponse } from "next/server";
import { buildLogoutUrl } from "@/server/auth/replitAuth";
import { getSession } from "@/server/auth/ironSession";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    session.destroy();
    
    const hostname = req.headers.get("host") || "";
    const logoutUrl = await buildLogoutUrl(hostname);
    
    return NextResponse.redirect(logoutUrl);
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.redirect(new URL("/", req.url));
  }
}
