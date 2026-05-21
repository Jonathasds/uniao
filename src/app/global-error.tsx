"use client";

/**
 * Erro global — sem providers (evita falha de build/prerender com useContext).
 * @param props - Erro e função de retry do Next.js.
 * @returns Página mínima de recuperação.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-dvh items-center justify-center bg-slate-50 p-6 font-sans antialiased">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-semibold text-slate-900">
            Algo deu errado
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Ocorreu um erro inesperado. Tente novamente ou volte ao login.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Tentar novamente
            </button>
            <a
              href="/login"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Ir para login
            </a>
          </div>
          {process.env.NODE_ENV === "development" && error.message ? (
            <p className="mt-4 break-all text-left text-xs text-slate-400">
              {error.message}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
