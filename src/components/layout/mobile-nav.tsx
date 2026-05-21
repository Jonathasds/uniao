"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getNavItemsForRole } from "@/lib/permissions";
import { CompanyBrand, type CompanyBrandData } from "@/components/layout/company-brand";
import type { UserRole } from "@prisma/client";
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

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  company: CompanyBrandData;
};

export function MobileNav({ open, onClose, company }: MobileNavProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (!open || status !== "authenticated" || !session?.user) return null;

  const role = session.user.role as UserRole;
  const navItems = getNavItemsForRole(role);

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-xl">
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <CompanyBrand name={company.name} logo={company.logo} compact />
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-4">
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
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  isActive
                    ? "bg-primary text-white"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            Sair da sessão
          </Button>
        </div>
      </aside>
    </div>
  );
}
