import * as client from "openid-client";
import memoize from "memoizee";

export interface UserClaims {
  sub: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
  iat?: number;
  exp?: number;
}

export interface UserSession {
  claims: UserClaims;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

const getOidcConfig = memoize(
  async () => {
    const issuerUrl = process.env.ISSUER_URL ?? "https://replit.com/oidc";
    const replId = process.env.REPL_ID;
    
    if (!replId) {
      throw new Error("REPL_ID environment variable is required for authentication");
    }
    
    return await client.discovery(new URL(issuerUrl), replId);
  },
  { maxAge: 3600 * 1000 }
);

export async function getAuthConfig() {
  return await getOidcConfig();
}

export async function buildAuthorizationUrl(domain: string): Promise<string> {
  const config = await getOidcConfig();
  const replId = process.env.REPL_ID!;
  
  const authorizationUrl = client.buildAuthorizationUrl(config, {
    client_id: replId,
    redirect_uri: `https://${domain}/api/callback`,
    scope: "openid email profile offline_access",
    prompt: "login consent",
  });
  
  return authorizationUrl.href;
}

export async function handleCallback(
  domain: string,
  callbackUrl: string,
  pkceVerifier: string
): Promise<UserSession> {
  const config = await getOidcConfig();
  
  const tokens = await client.authorizationCodeGrant(config, new URL(callbackUrl), {
    pkceCodeVerifier: pkceVerifier,
    idTokenExpected: true,
  });
  
  const claims = tokens.claims() as UserClaims;
  
  return {
    claims,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: claims.exp,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<UserSession> {
  const config = await getOidcConfig();
  
  const tokens = await client.refreshTokenGrant(config, refreshToken);
  const claims = tokens.claims() as UserClaims;
  
  return {
    claims,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: claims.exp,
  };
}

export async function buildLogoutUrl(domain: string): Promise<string> {
  const config = await getOidcConfig();
  const replId = process.env.REPL_ID!;
  
  const logoutUrl = client.buildEndSessionUrl(config, {
    client_id: replId,
    post_logout_redirect_uri: `https://${domain}`,
  });
  
  return logoutUrl.href;
}
