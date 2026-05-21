"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { POST_LOGIN_PATH } from "@/lib/auth-routes";

type AuthGateProps = {
  children: React.ReactNode;
  /** Quando true, redireciona usuário logado para o dashboard (ex.: página de login). */
  redirectIfAuthenticated?: boolean;
};

/**
 * Protege rotas no cliente (mobile e desktop): exige login ou impede acesso ao login já autenticado.
 * @param props - Filhos e modo de redirecionamento.
 * @returns Conteúdo ou tela de carregamento.
 */
export function AuthGate({
  children,
  redirectIfAuthenticated = false,
}: AuthGateProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (redirectIfAuthenticated) {
      if (status === "authenticated" && session?.user) {
        router.replace(POST_LOGIN_PATH);
      }
      return;
    }

    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, session, router, redirectIfAuthenticated]);

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-sm text-slate-500">Carregando...</p>
      </div>
    );
  }

  if (redirectIfAuthenticated) {
    if (status === "authenticated") {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-background">
          <p className="text-sm text-slate-500">Redirecionando...</p>
        </div>
      );
    }
    return <>{children}</>;
  }

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-sm text-slate-500">Redirecionando para login...</p>
      </div>
    );
  }

  return <>{children}</>;
}
