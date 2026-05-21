import Link from "next/link";
import { Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RecuperarSenhaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-md rounded-xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Boxes className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold">União ERP</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900">Recuperar senha</h1>
        <p className="mt-1 text-sm text-slate-500">
          Informe seu e-mail para receber instruções de recuperação.
        </p>
        <form className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" placeholder="seu@email.com" />
          </div>
          <Button type="submit" className="w-full">
            Enviar instruções
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          <Link href="/login" className="text-primary hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}
