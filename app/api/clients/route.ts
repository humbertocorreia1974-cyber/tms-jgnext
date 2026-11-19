import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireRole(["admin", "operador", "dono"]);
  if (!guard.ok) return NextResponse.json({ error: "não autorizado" }, { status: guard.status });
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { transportOrders: true, invoices: true } } },
  });
  return NextResponse.json({ clients });
}

export async function POST(request: Request) {
  const guard = await requireRole(["admin", "operador", "dono"]);
  if (!guard.ok) return NextResponse.json({ error: "não autorizado" }, { status: guard.status });
  const body = await request.json();
  if (!body.name || !body.document) {
    return NextResponse.json({ error: "name e document são obrigatórios" }, { status: 400 });
  }
  try {
    const client = await prisma.client.create({
      data: {
        name: body.name,
        tradeName: body.tradeName ?? null,
        document: body.document,
        email: body.email ?? null,
        phone: body.phone ?? null,
        address: body.address ?? null,
        city: body.city ?? null,
        state: body.state ?? null,
        zipCode: body.zipCode ?? null,
      },
    });
    await logAudit({
      userId: (guard.session.user as any).id,
      action: "create",
      entity: "Client",
      entityId: client.id,
      after: client,
    });
    return NextResponse.json({ client }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "erro" }, { status: 400 });
  }
}
