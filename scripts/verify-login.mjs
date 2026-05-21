import "dotenv/config";
import { createPrismaClient } from "../src/lib/create-prisma-client.ts";
import bcrypt from "bcryptjs";

const prisma = createPrismaClient();
const email = "jonathadelgado@gmail.com";
const password = "ua042728";

const user = await prisma.user.findUnique({ where: { email } });
if (!user) {
  console.error("Usuário não encontrado");
  process.exit(1);
}

const ok = await bcrypt.compare(password, user.password);
console.log(ok ? "✅ Login OK" : "❌ Senha incorreta");
await prisma.$disconnect();
