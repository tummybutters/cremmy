import { NextRequest, NextResponse } from "next/server";
import * as client from "openid-client";
import { getAuthConfig } from "@/server/auth/replitAuth";
import { upsertUser } from "@/server/auth/storage";
import { getSession } from "@/server/auth/ironSession";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    
    const { pkceVerifier, state: expectedState, nonce: expectedNonce } = session;
    
    if (!pkceVerifier || !expectedState || !expectedNonce) {
      return NextResponse.redirect(new URL("/api/login", req.url));
    }
    
    const config = await getAuthConfig();
    const callbackUrl = new URL(req.url);
    
    const receivedState = callbackUrl.searchParams.get("state");
    if (receivedState !== expectedState) {
      console.error("State mismatch - potential CSRF attack");
      return NextResponse.redirect(new URL("/api/login", req.url));
    }
    
    const tokens = await client.authorizationCodeGrant(config, callbackUrl, {
      pkceCodeVerifier: pkceVerifier,
      expectedNonce: expectedNonce,
      idTokenExpected: true,
    });
    
    const claims = tokens.claims();
    
    if (!claims) {
      return NextResponse.redirect(new URL("/api/login", req.url));
    }
    
    await upsertUser({
      id: claims.sub as string,
      email: (claims.email as string) ?? null,
      firstName: (claims.first_name as string) ?? null,
      lastName: (claims.last_name as string) ?? null,
      profileImageUrl: (claims.profile_image_url as string) ?? null,
    });
    
    session.userId = claims.sub as string;
    session.accessToken = tokens.access_token;
    session.refreshToken = tokens.refresh_token;
    session.expiresAt = (claims.exp as number) ?? undefined;
    
    delete session.pkceVerifier;
    delete session.state;
    delete session.nonce;
    
    await session.save();
    
    return NextResponse.redirect(new URL("/", req.url));
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(new URL("/api/login", req.url));
  }
}
