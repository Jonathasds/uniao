"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar, SIDEBAR_OFFSET_CLASS } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { CompanyBrandData } from "@/components/layout/company-brand";

type AppShellProps = {
  company: CompanyBrandData;
  userImage?: string | null;
  userName?: string | null;
  children: React.ReactNode;
};

/**
 * Estrutura responsiva do painel: mesma sidebar e topbar em todas as larguras de tela.
 * @param props - Marca, usuário e conteúdo das páginas internas.
 * @returns Layout principal autenticado.
 */
export function AppShell({
  company,
  userImage,
  userName,
  children,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <>
      <Sidebar
        company={company}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <div className={`flex min-w-0 flex-col ${SIDEBAR_OFFSET_CLASS}`}>
        <Topbar
          userImage={userImage}
          userName={userName}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="app-content min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </>
  );
}
