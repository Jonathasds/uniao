import DashboardLayout from "../../_dashboard/layout";
import ClienteDetailPage from "../../_dashboard/clientes/[id]/page";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default function ClienteDetailRoute(props: Props) {
  return (
    <DashboardLayout>
      <ClienteDetailPage {...props} />
    </DashboardLayout>
  );
}
