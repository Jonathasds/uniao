import {
  getTopProducts,
  getTopCustomers,
  getMonthlyRevenue,
} from "@/services/report.service";
import { ReportsPage } from "@/components/reports/reports-page";

export default async function RelatoriosPage() {
  const year = new Date().getFullYear();
  const [topProducts, topCustomers, monthlyRevenue] = await Promise.all([
    getTopProducts(),
    getTopCustomers(),
    getMonthlyRevenue(year),
  ]);

  return (
    <ReportsPage
      topProducts={topProducts.map((p) => ({
        product: { name: p.product.name },
        quantity: p.quantity,
      }))}
      topCustomers={topCustomers}
      monthlyRevenue={monthlyRevenue}
    />
  );
}
