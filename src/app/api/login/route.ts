import { NextRequest, NextResponse } from "next/server";
import * as client from "openid-client";
import { getAuthConfig } from "@/server/auth/replitAuth";

export async function GET(req: NextRequest) {
  try {
    const hostname = req.headers.get("host") || "";
    const config = await getAuthConfig();
    const replId = process.env.REPL_ID!;
    
    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
    
    const authorizationUrl = client.buildAuthorizationUrl(config, {
      client_id: replId,
      redirect_uri: `https://${hostname}/api/callback`,
      scope: "openid email profile offline_access",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });
    
    const response = NextResponse.redirect(authorizationUrl);
    
    response.cookies.set("pkce_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Failed to initiate login" },
      { status: 500 }
    );
  }
}
