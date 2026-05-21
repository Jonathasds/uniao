"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FileText,
  Warehouse,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CompanyBrand, type CompanyBrandData } from "@/components/layout/company-brand";
import type { NAV_ITEMS } from "@/lib/constants";

type NavItem = (typeof NAV_ITEMS)[number];

const iconMap = {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FileText,
  Warehouse,
  BarChart3,
  Settings,
};

type SidebarNavProps = {
  company: CompanyBrandData;
  navItems: NavItem[];
  onNavigate?: () => void;
};

/**
 * Conteúdo da barra lateral (marca, links e rodapé) — idêntico em desktop e mobile.
 * @param props - Empresa, itens de menu e callback ao trocar de rota no overlay mobile.
 * @returns Painel de navegação lateral.
 */
export function SidebarNav({ company, navItems, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <>
      <div className="flex h-16 shrink-0 items-center border-b border-slate-100 px-6">
        <CompanyBrand name={company.name} logo={company.logo} />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-slate-100 p-4">
        <p className="truncate text-center text-xs text-slate-400">
          v1.0.0 · {company.name}
        </p>
      </div>
    </>
  );
}
