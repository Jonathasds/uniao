import DashboardLayout from "../_dashboard/layout";
import ServicosPage from "../_dashboard/servicos/page";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export const dynamic = "force-dynamic";

/**
 * Renderiza a rota pública do módulo de serviços.
 * @param props - Parâmetros de busca da rota.
 * @returns Página de serviços com layout autenticado.
 */
export default function ServicosRoute(props: Props) {
  return (
    <DashboardLayout>
      <ServicosPage {...props} />
    </DashboardLayout>
  );
}
