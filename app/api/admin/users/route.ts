import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Não autenticado", status: 401 as const };
  if (session.user.role !== "admin") return { error: "Acesso negado", status: 403 as const };
  return { session };
}

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      plan: true,
      createdAt: true,
      _count: { select: { clientUsers: true } },
    },
  });
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  const body = await request.json();
  const { name, email, role } = body ?? {};
  if (!name || !email) {
    return NextResponse.json({ error: "Nome e e-mail são obrigatórios" }, { status: 400 });
  }
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
  }
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: "pending",
      role: role || "user",
      termsAcceptedAt: new Date(),
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: guard.session.user.id,
      action: "create",
      entity: "User",
      entityId: user.id,
      after: { name, email, role: user.role },
    },
  });
  return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
