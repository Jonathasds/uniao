import DashboardLayout from "../_dashboard/layout";
import ClientesPage from "../_dashboard/clientes/page";

type Props = {
  searchParams: Promise<{ page?: string; search?: string }>;
};

export const dynamic = "force-dynamic";

export default function ClientesRoute(props: Props) {
  return (
    <DashboardLayout>
      <ClientesPage {...props} />
    </DashboardLayout>
  );
}
