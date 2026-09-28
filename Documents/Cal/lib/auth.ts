import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { DEMO_USER_ID, isDemoModeEnabled } from "@/lib/demo";
import { refreshGoogleAccessToken, shouldRefreshAccessToken } from "@/lib/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    // Passwordless demo login used for local testing when Google OAuth and
    // Supabase are not configured. Only registered when DEMO_MODE=true.
    ...(isDemoModeEnabled()
      ? [
          Credentials({
            id: "demo",
            name: "Demo",
            credentials: {},
            async authorize() {
              return {
                id: DEMO_USER_ID,
                name: "Demo User",
                email: "demo@example.com"
              };
            }
          })
        ]
      : [])
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.provider = account.provider;
        // Demo sessions have no Google tokens; skip the refresh flow entirely.
        if (account.provider === "demo") {
          return token;
        }
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token ?? token.refreshToken;
        token.accessTokenExpiresAt = account.expires_at;
      }

      if (token.provider === "demo") {
        return token;
      }

      if (shouldRefreshAccessToken(token.accessTokenExpiresAt)) {
        return refreshGoogleAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
      }
      session.error = token.error;
      return session;
    }
  },
  pages: {
    signIn: "/"
  },
  secret: process.env.NEXTAUTH_SECRET
};
