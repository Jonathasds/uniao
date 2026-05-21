"use client";

import { useSession } from "next-auth/react";
import { X } from "lucide-react";
import { getNavItemsForRole } from "@/lib/permissions";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import type { CompanyBrandData } from "@/components/layout/company-brand";
import type { UserRole } from "@prisma/client";

export const SIDEBAR_WIDTH_CLASS = "w-64";
export const SIDEBAR_OFFSET_CLASS = "lg:pl-64";

type SidebarProps = {
  company: CompanyBrandData;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

/**
 * Barra lateral fixa no desktop; no mobile abre o mesmo painel em overlay.
 * @param props - Dados da empresa e controle do menu em telas pequenas.
 * @returns Sidebar do painel.
 */
export function Sidebar({ company, mobileOpen = false, onMobileClose }: SidebarProps) {
  const { data: session } = useSession();
  const role = (session?.user?.role ?? "SELLER") as UserRole;
  const navItems = getNavItemsForRole(role);

  return (
    <>
      <aside
        className={`fixed left-0 top-0 z-40 hidden h-dvh ${SIDEBAR_WIDTH_CLASS} flex-col border-r border-slate-100 bg-white lg:flex`}
      >
        <SidebarNav company={company} navItems={navItems} />
      </aside>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            aria-label="Fechar menu"
            onClick={onMobileClose}
          />
          <aside
            className={`absolute left-0 top-0 flex h-dvh ${SIDEBAR_WIDTH_CLASS} flex-col bg-white shadow-xl`}
          >
            <button
              type="button"
              onClick={onMobileClose}
              className="absolute right-3 top-4 z-10 rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarNav
              company={company}
              navItems={navItems}
              onNavigate={onMobileClose}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}
