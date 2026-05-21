"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { getNavItemsForRole } from "@/lib/permissions";
import { CompanyBrand, type CompanyBrandData } from "@/components/layout/company-brand";
import type { UserRole } from "@prisma/client";

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

type SidebarProps = {
  company: CompanyBrandData;
};

export function Sidebar({ company }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user?.role ?? "SELLER") as UserRole;
  const navItems = getNavItemsForRole(role);

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-slate-100 bg-white lg:flex">
      <div className="flex h-16 items-center border-b border-slate-100 px-6">
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

      <div className="border-t border-slate-100 p-4">
        <p className="truncate text-center text-xs text-slate-400">
          v1.0.0 · {company.name}
        </p>
      </div>
    </aside>
  );
}
