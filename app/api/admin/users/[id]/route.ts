import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const before = await prisma.user.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (typeof body?.role === "string") data.role = body.role;
  if (typeof body?.name === "string") data.name = body.name;

  const user = await prisma.user.update({ where: { id }, data });
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "update",
      entity: "User",
      entityId: id,
      before: { role: before.role, name: before.name },
      after: data,
    },
  });
  return NextResponse.json({ ok: true, user: { id: user.id, role: user.role, name: user.name } });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  if (id === session.user.id) {
    return NextResponse.json({ error: "Não é possível excluir o próprio usuário" }, { status: 400 });
  }
  await prisma.user.delete({ where: { id } });
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "delete",
      entity: "User",
      entityId: id,
    },
  });
  return NextResponse.json({ ok: true });
}
