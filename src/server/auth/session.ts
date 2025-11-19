import session from "express-session";
import connectPg from "connect-pg-simple";

const pgStore = connectPg(session);

const sessionTtl = 7 * 24 * 60 * 60 * 1000;

export const sessionStore = new pgStore({
  conString: process.env.DATABASE_URL,
  createTableIfMissing: false,
  ttl: sessionTtl,
  tableName: "sessions",
});

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET!,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionTtl,
    sameSite: "lax",
  },
});

declare module "express-session" {
  interface SessionData {
    user?: {
      claims: {
        sub: string;
        email?: string;
        first_name?: string;
        last_name?: string;
        profile_image_url?: string;
        exp?: number;
      };
      access_token: string;
      refresh_token?: string;
      expires_at?: number;
    };
    pkceVerifier?: string;
  }
}
