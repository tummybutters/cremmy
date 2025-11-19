import { NextRequest, NextResponse } from "next/server";
import { buildLogoutUrl } from "@/server/auth/replitAuth";

export async function GET(req: NextRequest) {
  try {
    const hostname = req.headers.get("host") || "";
    const logoutUrl = await buildLogoutUrl(hostname);
    
    const response = NextResponse.redirect(logoutUrl);
    response.cookies.delete("user_session");
    
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    const response = NextResponse.redirect(new URL("/", req.url));
    response.cookies.delete("user_session");
    return response;
  }
}
