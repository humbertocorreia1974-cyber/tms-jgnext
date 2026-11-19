import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const roles = await prisma.role.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ roles });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await request.json();
  const { name, description, permissions } = body ?? {};
  if (!name) return NextResponse.json({ error: "Nome do papel é obrigatório" }, { status: 400 });

  const role = await prisma.role.create({
    data: {
      name,
      description: description || null,
      permissions: Array.isArray(permissions) ? permissions : [],
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "create",
      entity: "Role",
      entityId: role.id,
      after: { name, permissions },
    },
  });
  return NextResponse.json({ ok: true, role });
}
