import DashboardLayout from "../../_dashboard/layout";
import ServicoDetailPage from "../../_dashboard/servicos/[id]/page";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

/**
 * Renderiza a rota pública de detalhe da ordem de serviço.
 * @param props - Parâmetros da rota com ID da OS.
 * @returns Página de detalhe com layout autenticado.
 */
export default function ServicoDetailRoute(props: Props) {
  return (
    <DashboardLayout>
      <ServicoDetailPage {...props} />
    </DashboardLayout>
  );
}
