/**
 * Remove vendas, orçamentos, clientes, produtos, serviços e usuários (exceto o admin).
 * Mantém CompanySettings (dados da empresa).
 * Uso: npm run db:purge -- --confirm
 */
import "dotenv/config";
import { createPrismaClient, resetPrismaConnection } from "../src/lib/create-prisma-client";

const ADMIN_EMAIL =
  process.env.PURGE_KEEP_ADMIN_EMAIL?.trim() || "jonathadelgado@gmail.com";

/**
 * Executa a limpeza transacional do banco.
 * @returns void
 */
async function purgeBusinessData() {
  const prisma = createPrismaClient();

  const admin = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (!admin || admin.role !== "ADMIN") {
    throw new Error(
      `Administrador não encontrado (${ADMIN_EMAIL}). Crie o admin antes de limpar (npm run db:seed).`
    );
  }

  const counts = await prisma.$transaction(async (tx) => {
    const serviceOrders = await tx.serviceOrder.deleteMany();
    const saleItems = await tx.saleItem.deleteMany();
    const sales = await tx.sale.deleteMany();
    const quoteItems = await tx.quoteItem.deleteMany();
    const quotes = await tx.quote.deleteMany();
    const stockMovements = await tx.stockMovement.deleteMany();
    const financial = await tx.financialTransaction.deleteMany();
    const products = await tx.product.deleteMany();
    const customers = await tx.customer.deleteMany();
    const categories = await tx.category.deleteMany();
    const users = await tx.user.deleteMany({
      where: { email: { not: ADMIN_EMAIL } },
    });

    return {
      serviceOrders: serviceOrders.count,
      saleItems: saleItems.count,
      sales: sales.count,
      quoteItems: quoteItems.count,
      quotes: quotes.count,
      stockMovements: stockMovements.count,
      financial: financial.count,
      products: products.count,
      customers: customers.count,
      categories: categories.count,
      users: users.count,
    };
  });

  console.log("Limpeza concluída. Registros removidos:");
  console.log(`  Serviços:        ${counts.serviceOrders}`);
  console.log(`  Itens de venda:  ${counts.saleItems}`);
  console.log(`  Vendas:          ${counts.sales}`);
  console.log(`  Itens orçamento:  ${counts.quoteItems}`);
  console.log(`  Orçamentos:      ${counts.quotes}`);
  console.log(`  Mov. estoque:    ${counts.stockMovements}`);
  console.log(`  Financeiro:      ${counts.financial}`);
  console.log(`  Produtos:        ${counts.products}`);
  console.log(`  Clientes:        ${counts.customers}`);
  console.log(`  Categorias:      ${counts.categories}`);
  console.log(`  Usuários:        ${counts.users}`);
  console.log(`\nAdministrador mantido: ${ADMIN_EMAIL} (${admin.name})`);
  console.log("Configurações da empresa (CompanySettings) preservadas.");

  await resetPrismaConnection();
}

async function main() {
  if (!process.argv.includes("--confirm")) {
    console.error(
      "Operação destrutiva. Confirme com:\n  npm run db:purge -- --confirm"
    );
    process.exit(1);
  }

  console.log(`⚠️  Zerando dados no Supabase (admin: ${ADMIN_EMAIL})...\n`);
  await purgeBusinessData();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
