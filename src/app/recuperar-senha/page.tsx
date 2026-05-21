import Link from "next/link";
import { Boxes, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RecuperarSenhaPage() {
  return (
    <div className="flex min-h-dvh min-h-screen flex-col md:flex-row">
      <div className="flex flex-1 flex-col justify-between bg-primary p-8 text-white sm:p-10 md:min-h-0 md:p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Boxes className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold">União ERP</span>
        </div>
        <div className="my-8 md:my-0">
          <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
            Recupere o acesso
            <br />
            à sua conta
          </h2>
          <p className="mt-4 text-sm text-blue-100 sm:text-base">
            Enviaremos instruções para o e-mail cadastrado no sistema.
          </p>
        </div>
        <p className="text-sm text-blue-200">© 2026 União ERP</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-6 sm:p-8">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-slate-900">Recuperar senha</h1>
          <p className="mt-1 text-sm text-slate-500">
            Informe seu e-mail para receber instruções de recuperação.
          </p>
          <form className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Enviar instruções
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            <Link href="/login" className="text-primary hover:underline">
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
