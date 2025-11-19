import { NextRequest, NextResponse } from "next/server";
import * as client from "openid-client";
import { getAuthConfig } from "@/server/auth/replitAuth";
import { upsertUser } from "@/server/auth/storage";
import type { UserSession } from "@/server/auth/replitAuth";

export async function GET(req: NextRequest) {
  try {
    const hostname = req.headers.get("host") || "";
    const pkceVerifier = req.cookies.get("pkce_verifier")?.value;
    
    if (!pkceVerifier) {
      return NextResponse.redirect(new URL("/api/login", req.url));
    }
    
    const config = await getAuthConfig();
    const callbackUrl = new URL(req.url);
    
    const tokens = await client.authorizationCodeGrant(config, callbackUrl, {
      pkceCodeVerifier: pkceVerifier,
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
    
    const userSession: UserSession = {
      claims: {
        sub: claims.sub as string,
        email: claims.email as string,
        first_name: claims.first_name as string,
        last_name: claims.last_name as string,
        profile_image_url: claims.profile_image_url as string,
        exp: claims.exp as number,
      },
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: claims.exp as number,
    };
    
    const response = NextResponse.redirect(new URL("/", req.url));
    
    response.cookies.set("user_session", JSON.stringify(userSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    
    response.cookies.delete("pkce_verifier");
    
    return response;
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(new URL("/api/login", req.url));
  }
}
