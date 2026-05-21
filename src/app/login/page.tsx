"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Boxes, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getDatabaseOfflineHelp } from "@/lib/database-messages";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dbOffline, setDbOffline] = useState(false);
  const dbHelp = getDatabaseOfflineHelp();

  useEffect(() => {
    fetch("/api/health/db")
      .then((res) => setDbOffline(!res.ok))
      .catch(() => setDbOffline(true));
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      if (dbOffline) {
        toast.error(dbHelp.title);
      } else {
        toast.error("E-mail ou senha incorretos");
      }
      return;
    }

    toast.success("Login realizado com sucesso!");
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-primary p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Boxes className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold">União ERP</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Gestão comercial
            <br />
            simples e moderna
          </h2>
          <p className="mt-4 text-blue-100">
            Controle estoque, vendas, clientes e orçamentos em um só lugar.
          </p>
        </div>
        <p className="text-sm text-blue-200">© 2026 União ERP</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Boxes className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">União ERP</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">Bem-vindo de volta</h1>
          <p className="mt-1 text-sm text-slate-500">
            Entre com suas credenciais para acessar o sistema
          </p>

          {dbOffline && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-medium">{dbHelp.title}</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-amber-700">
                {dbHelp.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  error={errors.email?.message}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  error={errors.password?.message}
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Link
                href="/recuperar-senha"
                className="text-sm text-primary hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Demo: jonathadelgado@gmail.com / ua042728
          </p>
        </div>
      </div>
    </div>
  );
}
