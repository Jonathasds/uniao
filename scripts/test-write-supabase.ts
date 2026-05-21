/**
 * Confirma gravação no Postgres Supabase via Prisma.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { resetPrismaConnection } from "../src/lib/create-prisma-client";

async function main() {
  const before = await prisma.customer.count();
  const doc = `test-${Date.now()}`;
  const created = await prisma.customer.create({
    data: {
      name: "Teste Supabase Write",
      document: doc,
      email: `write-${Date.now()}@test.local`,
    },
  });
  const after = await prisma.customer.count();
  await prisma.customer.delete({ where: { id: created.id } });

  console.log("Gravação OK no Supabase.");
  console.log(`Clientes: ${before} → ${after} (esperado +1 temporário)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await resetPrismaConnection();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Falha:", e instanceof Error ? e.message : e);
    await resetPrismaConnection();
    process.exit(1);
  });
