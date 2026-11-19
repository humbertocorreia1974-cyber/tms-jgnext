import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole(["admin", "operador", "dono"]);
  if (!guard.ok) return NextResponse.json({ error: "não autorizado" }, { status: guard.status });
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      freightTables: { include: { rates: { include: { route: true } } } },
      _count: { select: { transportOrders: true, invoices: true, collectionRequests: true } },
    },
  });
  if (!client) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  return NextResponse.json({ client });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole(["admin", "operador", "dono"]);
  if (!guard.ok) return NextResponse.json({ error: "não autorizado" }, { status: guard.status });
  const body = await request.json();
  const before = await prisma.client.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  const client = await prisma.client.update({
    where: { id: params.id },
    data: {
      name: body.name ?? undefined,
      tradeName: body.tradeName ?? undefined,
      email: body.email ?? undefined,
      phone: body.phone ?? undefined,
      address: body.address ?? undefined,
      city: body.city ?? undefined,
      state: body.state ?? undefined,
      zipCode: body.zipCode ?? undefined,
      isActive: body.isActive ?? undefined,
    },
  });
  await logAudit({
    userId: (guard.session.user as any).id,
    action: "update",
    entity: "Client",
    entityId: client.id,
    before,
    after: client,
  });
  return NextResponse.json({ client });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole(["admin", "dono"]);
  if (!guard.ok) return NextResponse.json({ error: "não autorizado" }, { status: guard.status });
  await prisma.client.update({ where: { id: params.id }, data: { isActive: false } });
  await logAudit({
    userId: (guard.session.user as any).id,
    action: "deactivate",
    entity: "Client",
    entityId: params.id,
  });
  return NextResponse.json({ ok: true });
}
