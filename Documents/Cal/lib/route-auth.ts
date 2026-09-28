import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import type { Session } from "next-auth";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { DEMO_USER_ID, isDemoModeEnabled } from "@/lib/demo";
import { getFreshGoogleToken, type GoogleTokenSet } from "@/lib/google";

export type RouteAuth =
  | { session: Session; userId: string; googleToken: GoogleTokenSet; isDemo: false }
  | { session: Session; userId: string; googleToken: null; isDemo: true };

export async function getRouteAuth(req: NextRequest): Promise<RouteAuth | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return null;

  if (isDemoModeEnabled() && token.sub === DEMO_USER_ID) {
    return { session, userId: DEMO_USER_ID, googleToken: null, isDemo: true };
  }

  const googleToken = await getFreshGoogleToken(token);
  if (!googleToken) return null;

  return {
    session,
    userId: session.user.id,
    googleToken,
    isDemo: false
  };
}
