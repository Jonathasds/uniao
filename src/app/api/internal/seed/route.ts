import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Cria/atualiza usuário admin em produção (protegido por SEED_SECRET).
 * Rode após o primeiro deploy com `prisma db push` no build.
 * Uso: GET /api/internal/seed?secret=SEU_SEED_SECRET
 */
export async function GET(request: Request) {
  const secret = new URL(request.url).searchParams.get("secret");
  const expected = process.env.SEED_SECRET?.trim();

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const password = await bcrypt.hash("ua042728", 10);

    await prisma.user.upsert({
      where: { email: "jonathadelgado@gmail.com" },
      update: { password, active: true, role: "ADMIN" },
      create: {
        name: "Administrador",
        email: "jonathadelgado@gmail.com",
        password,
        role: "ADMIN",
        active: true,
      },
    });

    const users = await prisma.user.count();
    return NextResponse.json({
      ok: true,
      message: "Admin criado/atualizado.",
      email: "jonathadelgado@gmail.com",
      users,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
