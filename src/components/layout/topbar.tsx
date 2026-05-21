"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Bell, Camera, LogOut, Menu, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MobileNav } from "./mobile-nav";
import { CompanyBrand, type CompanyBrandData } from "@/components/layout/company-brand";
import { USER_ROLES } from "@/lib/constants";
import { updateUserAvatarAction } from "@/app/actions/profile";
import { toast } from "sonner";
import type { UserRole } from "@prisma/client";

type TopbarProps = {
  company: CompanyBrandData;
  userImage?: string | null;
  userName?: string | null;
};

/**
 * Barra superior do painel com busca, avatar do usuário e menu da conta.
 * @param props - Dados da empresa e foto de perfil do usuário logado.
 * @returns Cabeçalho fixo da aplicação.
 */
export function Topbar({ company, userImage, userName }: TopbarProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const displayName =
    userName?.trim() ||
    session?.user?.name?.trim() ||
    "Usuário";
  const displayRole = session?.user?.role
    ? USER_ROLES[session.user.role as UserRole]
    : "Usuário";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    userImage ?? null
  );
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAvatarPreview(userImage ?? null);
  }, [userImage]);

  /**
   * Abre o seletor de arquivo para trocar a foto de perfil.
   * @returns void
   */
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Envia a nova foto de perfil para o servidor.
   * @param event - Evento de alteração do input de arquivo.
   * @returns void
   */
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("avatar", file);

    startTransition(async () => {
      const result = await updateUserAvatarAction(formData);
      if (result.error) {
        toast.error(result.error);
        setAvatarPreview(userImage ?? null);
        return;
      }

      if (result.image) {
        setAvatarPreview(result.image);
      }
      toast.success("Foto de perfil atualizada!");
      router.refresh();
    });

    event.target.value = "";
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-100 bg-white/80 px-4 backdrop-blur-md lg:px-8">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="lg:hidden">
            <CompanyBrand name={company.name} logo={company.logo} compact />
          </div>
          <div className="relative hidden sm:block lg:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar..."
              className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-slate-500" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarChange}
          />

          <DropdownMenu.Root>
            <div className="flex items-center gap-1 rounded-lg hover:bg-slate-50">
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={pending}
                title="Clique para alterar sua foto"
                className="group relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-primary/10 transition hover:border-primary/40 disabled:opacity-60"
              >
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Foto de perfil"
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <User className="h-4 w-4 text-primary" />
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition group-hover:bg-slate-900/35">
                  <Camera className="h-4 w-4 text-white opacity-0 transition group-hover:opacity-100" />
                </span>
              </button>

              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 outline-none"
                >
                  <div className="hidden min-w-0 text-left sm:block">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {displayRole}
                    </p>
                  </div>
                </button>
              </DropdownMenu.Trigger>
            </div>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[180px] rounded-lg border border-slate-100 bg-white p-1 shadow-lg"
                sideOffset={8}
                align="end"
              >
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 outline-none hover:bg-slate-50"
                  onSelect={(event) => {
                    event.preventDefault();
                    handleAvatarClick();
                  }}
                >
                  <Camera className="h-4 w-4" />
                  Alterar foto
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 outline-none hover:bg-red-50"
                  onSelect={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </header>
      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        company={company}
      />
    </>
  );
}
