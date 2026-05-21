import DashboardLayout from "../../_dashboard/layout";
import NovoOrcamentoPage from "../../_dashboard/orcamentos/novo/page";

export const dynamic = "force-dynamic";

export default function NovoOrcamentoRoute() {
  return (
    <DashboardLayout>
      <NovoOrcamentoPage />
    </DashboardLayout>
  );
}
