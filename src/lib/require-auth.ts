import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

/**
 * Exige sessão NextAuth válida; redireciona para /login se ausente.
 * @returns Sessão autenticada com usuário.
 */
export async function requireAuth(): Promise<Session> {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    redirect("/login");
  }

  return session;
}
