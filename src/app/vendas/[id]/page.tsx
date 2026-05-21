import DashboardLayout from "../../_dashboard/layout";
import VendaDetailPage from "../../_dashboard/vendas/[id]/page";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default function VendaDetailRoute(props: Props) {
  return (
    <DashboardLayout>
      <VendaDetailPage {...props} />
    </DashboardLayout>
  );
}
