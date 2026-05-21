import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCompanySettings, getUsers } from "@/services/settings.service";
import { SettingsPage } from "@/components/settings/settings-page";
import { toNumber } from "@/lib/utils";
import {
  canAccessSettings,
  canEditCompany,
  canManageCategories,
  canManageUsers,
} from "@/lib/permissions";
import { getCategoriesWithProductCount } from "@/services/category.service";
import { getPixKeys } from "@/services/pix-key.service";

export default async function ConfiguracoesPage() {
  const session = await auth();
  const role = session?.user?.role;

  if (!role || !canAccessSettings(role)) {
    redirect("/");
  }

  const isAdmin = role === "ADMIN";

  const canEdit = canEditCompany(role);

  const [company, users, categories, pixKeys] = await Promise.all([
    getCompanySettings(),
    isAdmin ? getUsers() : Promise.resolve([]),
    isAdmin ? getCategoriesWithProductCount() : Promise.resolve([]),
    canEdit ? getPixKeys() : Promise.resolve([]),
  ]);

  return (
    <SettingsPage
      company={{ ...company, taxRate: toNumber(company.taxRate) }}
      users={users}
      categories={categories}
      pixKeys={pixKeys}
      currentUserId={session!.user!.id}
      canManageUsers={canManageUsers(role)}
      canManageCategories={canManageCategories(role)}
      canEditCompany={canEditCompany(role)}
    />
  );
}
