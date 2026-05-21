import DashboardLayout from "../_dashboard/layout";
import ConfiguracoesPage from "../_dashboard/configuracoes/page";

export const dynamic = "force-dynamic";

export default function ConfiguracoesRoute() {
  return (
    <DashboardLayout>
      <ConfiguracoesPage />
    </DashboardLayout>
  );
}
