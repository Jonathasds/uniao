import DashboardLayout from "../_dashboard/layout";
import RelatoriosPage from "../_dashboard/relatorios/page";

export const dynamic = "force-dynamic";

export default function RelatoriosRoute() {
  return (
    <DashboardLayout>
      <RelatoriosPage />
    </DashboardLayout>
  );
}
