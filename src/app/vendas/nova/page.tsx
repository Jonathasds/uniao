import DashboardLayout from "../../_dashboard/layout";
import NovaVendaPage from "../../_dashboard/vendas/nova/page";

type Props = {
  searchParams: Promise<{ quoteId?: string; saleId?: string }>;
};

export const dynamic = "force-dynamic";

export default function NovaVendaRoute(props: Props) {
  return (
    <DashboardLayout>
      <NovaVendaPage {...props} />
    </DashboardLayout>
  );
}
