import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await requireRole(["admin", "operador", "dono"]);
  if (!guard.ok) return NextResponse.json({ error: "não autorizado" }, { status: guard.status });
  const url = new URL(request.url);
  const clientId = url.searchParams.get("clientId");
  const tables = await prisma.freightTable.findMany({
    where: clientId ? { clientId } : undefined,
    include: { client: true, _count: { select: { rates: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ tables });
}

export async function POST(request: Request) {
  const guard = await requireRole(["admin", "operador", "dono"]);
  if (!guard.ok) return NextResponse.json({ error: "não autorizado" }, { status: guard.status });
  const body = await request.json();
  if (!body.clientId || !body.name) {
    return NextResponse.json({ error: "clientId e name obrigatórios" }, { status: 400 });
  }
  const table = await prisma.freightTable.create({
    data: {
      clientId: body.clientId,
      name: body.name,
      validFrom: body.validFrom ? new Date(body.validFrom) : new Date(),
      validTo: body.validTo ? new Date(body.validTo) : null,
      cubageFactor: body.cubageFactor ? Number(body.cubageFactor) : 300,
      grisPercent: body.grisPercent ? Number(body.grisPercent) : 0,
      tdeValue: body.tdeValue ? Number(body.tdeValue) : 0,
      tollValue: body.tollValue ? Number(body.tollValue) : 0,
      minValue: body.minValue ? Number(body.minValue) : 0,
    },
  });
  return NextResponse.json({ table }, { status: 201 });
}
