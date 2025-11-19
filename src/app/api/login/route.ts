import { NextRequest, NextResponse } from "next/server";
import * as client from "openid-client";
import { getAuthConfig } from "@/server/auth/replitAuth";
import { getSession } from "@/server/auth/ironSession";

export async function GET(req: NextRequest) {
  try {
    const hostname = req.headers.get("host") || "";
    const config = await getAuthConfig();
    const replId = process.env.REPL_ID!;
    
    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
    const state = client.randomState();
    const nonce = client.randomNonce();
    
    const session = await getSession();
    session.pkceVerifier = codeVerifier;
    session.state = state;
    session.nonce = nonce;
    await session.save();
    
    const authorizationUrl = client.buildAuthorizationUrl(config, {
      client_id: replId,
      redirect_uri: `https://${hostname}/api/callback`,
      scope: "openid email profile offline_access",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
      nonce,
    });
    
    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Failed to initiate login" },
      { status: 500 }
    );
  }
}
