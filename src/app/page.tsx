import { resolveChartMonth, resolveChartYear } from "@/lib/chart-year";
import { requireAuth } from "@/lib/require-auth";
import { getDashboardStats } from "@/services/dashboard.service";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import DashboardLayout from "./_dashboard/layout";
import type { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const chartYear = resolveChartYear(params.year);
  const chartMonth = resolveChartMonth(params.month);
  const session = await requireAuth();
  const stats = await getDashboardStats(chartYear, chartMonth);
  const userRole = session.user.role as UserRole;

  return (
    <DashboardLayout>
      <DashboardContent stats={stats} userRole={userRole} />
    </DashboardLayout>
  );
}
