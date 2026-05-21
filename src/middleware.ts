import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { updateSession } from "@/utils/supabase/middleware";

const { auth } = NextAuth(authConfig);

/**
 * Middleware: NextAuth (permissões) + refresh da sessão Supabase.
 */
export default auth(async (request) => {
  try {
    return await updateSession(request);
  } catch {
    return NextResponse.next({ request });
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
};
