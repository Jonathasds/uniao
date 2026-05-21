import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { getDefaultRoute, canAccessRoute } from "@/lib/permissions";
import { updateSession } from "@/utils/supabase/middleware";
import type { UserRole } from "@prisma/client";

const { auth } = NextAuth(authConfig);

import { PUBLIC_AUTH_PATHS } from "@/lib/auth-routes";

const PUBLIC_PATHS = [...PUBLIC_AUTH_PATHS];

/**
 * Indica rota pública (login / recuperar senha).
 * @param pathname - Caminho da URL.
 * @returns true quando não exige sessão NextAuth.
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

/**
 * Proxy (Next.js 16+): protege rotas com NextAuth e atualiza sessão Supabase só após login.
 */
export default auth(async (request) => {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;
  const user = request.auth?.user;
  const isLoggedIn = Boolean(user?.id && user.email);

  if (!isLoggedIn) {
    if (isPublicPath(pathname)) {
      try {
        return await updateSession(request);
      } catch {
        return NextResponse.next();
      }
    }

    return NextResponse.redirect(new URL("/login", nextUrl.origin));
  }

  const role = user!.role as UserRole;

  if (isPublicPath(pathname)) {
    return NextResponse.redirect(new URL(getDefaultRoute(role), nextUrl));
  }

  if (!canAccessRoute(role, pathname)) {
    return NextResponse.redirect(new URL(getDefaultRoute(role), nextUrl));
  }

  try {
    return await updateSession(request);
  } catch {
    return NextResponse.next();
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
};
