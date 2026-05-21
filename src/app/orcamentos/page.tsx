import DashboardLayout from "../_dashboard/layout";
import OrcamentosPage from "../_dashboard/orcamentos/page";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export const dynamic = "force-dynamic";

export default function OrcamentosRoute(props: Props) {
  return (
    <DashboardLayout>
      <OrcamentosPage {...props} />
    </DashboardLayout>
  );
}
