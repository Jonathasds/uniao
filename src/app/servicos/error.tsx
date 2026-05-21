"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type ServicosErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Exibe erro amigável na listagem de serviços (ex.: banco indisponível).
 * @param props - Erro capturado e função de retry do Next.js.
 * @returns UI de recuperação.
 */
export default function ServicosError({ error, reset }: ServicosErrorProps) {
  useEffect(() => {
    console.error("[servicos]", error);
  }, [error]);

  const isDatabase =
    error.message.includes("DATABASE_UNAVAILABLE") ||
    error.message.includes("connection") ||
    error.message.includes("Connection") ||
    error.message.includes("pool") ||
    error.message.includes("P1017") ||
    error.message.includes("DATABASE_URL");

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-red-100 bg-red-50/50 p-6 text-center">
      <h2 className="text-lg font-semibold text-slate-900">
        Não foi possível abrir Serviços
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {isDatabase
          ? "Supabase indisponível. Confira .env, execute npm run db:check e reinicie npm run dev."
          : "Ocorreu um erro ao carregar as ordens de serviço."}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={() => reset()}>
          Tentar novamente
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/">Voltar ao dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
