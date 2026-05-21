import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { PresenceHeartbeat } from "@/components/presence/presence-heartbeat";
import { AuthGate } from "@/components/auth/auth-gate";
import { requireAuth } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";
import { getCompanySettings } from "@/services/settings.service";

export const dynamic = "force-dynamic";

export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  const company = await getCompanySettings();
  const brand = {
    name: company.name,
    logo: company.logo,
  };

  const currentUser = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { image: true, name: true },
      })
    : null;

  return (
    <AuthGate>
      <div className="min-h-dvh min-h-screen bg-background">
        <PresenceHeartbeat />
        <Sidebar company={brand} />
        <div className="lg:pl-64">
          <Topbar
            company={brand}
            userImage={currentUser?.image ?? null}
            userName={currentUser?.name ?? null}
          />
          <main className="p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </AuthGate>
  );
}
