import { requireAuth } from "@/lib/require-auth";
import { getCustomers } from "@/services/customer.service";
import { CustomersPage } from "@/components/customers/customers-page";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ page?: string; search?: string }>;
};

export default async function ClientesPage({ searchParams }: Props) {
  await requireAuth();
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const { data, totalPages } = await getCustomers({
    page,
    search: params.search,
  });

  return (
    <CustomersPage
      customers={data}
      totalPages={totalPages}
      currentPage={page}
    />
  );
}
