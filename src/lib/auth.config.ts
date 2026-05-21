import type { NextAuthConfig } from "next-auth";
import { canAccessRoute, getDefaultRoute } from "@/lib/permissions";
import type { UserRole } from "@prisma/client";

/**
 * Configuração do NextAuth compatível com Edge (middleware).
 * Não importa Prisma nem módulos Node.js nativos.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { nextUrl } = request;
      const isLoggedIn = !!auth?.user;
      const isAuthPage =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/recuperar-senha");

      if (!isLoggedIn && !isAuthPage) {
        return false;
      }

      if (isLoggedIn && isAuthPage) {
        const role = auth.user.role as UserRole;
        return Response.redirect(new URL(getDefaultRoute(role), nextUrl));
      }

      if (isLoggedIn && !isAuthPage) {
        const role = auth.user.role as UserRole;
        const pathname = nextUrl.pathname;

        if (!canAccessRoute(role, pathname)) {
          return Response.redirect(new URL(getDefaultRoute(role), nextUrl));
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role: UserRole }).role;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
