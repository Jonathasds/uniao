import { getServiceOrders } from "@/services/service-order.service";
import { ServiceOrdersPage } from "@/components/services/service-orders-page";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

/**
 * Busca e renderiza a página de ordens de serviço.
 * @param props - Parâmetros de busca da rota.
 * @returns Página do módulo de serviços.
 */
export default async function ServicosPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const { data, totalPages } = await getServiceOrders({ page });

  return (
    <ServiceOrdersPage
      orders={data}
      totalPages={totalPages}
      currentPage={page}
    />
  );
}
