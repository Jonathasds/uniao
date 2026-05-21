import DashboardLayout from "../_dashboard/layout";
import EstoquePage from "../_dashboard/estoque/page";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export const dynamic = "force-dynamic";

export default function EstoqueRoute(props: Props) {
  return (
    <DashboardLayout>
      <EstoquePage {...props} />
    </DashboardLayout>
  );
}
