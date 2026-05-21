import DashboardLayout from "../_dashboard/layout";
import VendasPage from "../_dashboard/vendas/page";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export const dynamic = "force-dynamic";

export default function VendasRoute(props: Props) {
  return (
    <DashboardLayout>
      <VendasPage {...props} />
    </DashboardLayout>
  );
}
