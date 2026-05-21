import DashboardLayout from "../_dashboard/layout";
import ProdutosPage from "../_dashboard/produtos/page";

type Props = {
  searchParams: Promise<{ page?: string; search?: string; categoryId?: string }>;
};

export const dynamic = "force-dynamic";

export default function ProdutosRoute(props: Props) {
  return (
    <DashboardLayout>
      <ProdutosPage {...props} />
    </DashboardLayout>
  );
}
