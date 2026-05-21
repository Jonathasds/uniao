"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Detecta erro de conexão com o banco (apenas mensagem — seguro no client).
 * @param error - Erro capturado.
 * @returns true se parecer falha de conexão.
 */
function isDatabaseConnectionError(error: Error): boolean {
  const text = error.message.toLowerCase();
  return (
    text.includes("connection terminated") ||
    text.includes("connection closed") ||
    text.includes("server has closed the connection") ||
    text.includes("cannot use a pool") ||
    text.includes("p1017") ||
    text.includes("p2010") ||
    text.includes("database_url") ||
    text.includes("database unavailable")
  );
}

/**
 * Erro de rota da aplicação (sem html/body — evita hydration inválida).
 * @param props - Erro e função de retry do Next.js.
 * @returns UI de recuperação.
 */
export default function AppError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[app]", error);
  }, [error]);

  const isDatabase = isDatabaseConnectionError(error);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center p-6 text-center">
      <h1 className="text-lg font-semibold text-slate-900">Algo deu errado</h1>
      <p className="mt-2 text-sm text-slate-600">
        {isDatabase
          ? "Não foi possível conectar ao Supabase. Confira DATABASE_URL no .env, rode npm run db:check e reinicie npm run dev."
          : "Ocorreu um erro inesperado. Tente novamente."}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={() => reset()}>
          Tentar novamente
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/login">Ir para login</Link>
        </Button>
      </div>
    </div>
  );
}
