import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole(["admin", "operador", "dono"]);
  if (!guard.ok) return NextResponse.json({ error: "não autorizado" }, { status: guard.status });
  const rates = await prisma.freightRate.findMany({
    where: { freightTableId: params.id },
    include: { route: true },
    orderBy: [{ routeId: "asc" }, { weightFrom: "asc" }],
  });
  return NextResponse.json({ rates });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole(["admin", "operador", "dono"]);
  if (!guard.ok) return NextResponse.json({ error: "não autorizado" }, { status: guard.status });
  const body = await request.json();
  if (!body.routeId) return NextResponse.json({ error: "routeId obrigatório" }, { status: 400 });
  const rate = await prisma.freightRate.create({
    data: {
      freightTableId: params.id,
      routeId: body.routeId,
      weightFrom: Number(body.weightFrom ?? 0),
      weightTo: Number(body.weightTo ?? 0),
      fixedValue: body.fixedValue != null ? Number(body.fixedValue) : null,
      pricePerKg: body.pricePerKg != null ? Number(body.pricePerKg) : null,
      minValue: body.minValue != null ? Number(body.minValue) : null,
    },
  });
  return NextResponse.json({ rate }, { status: 201 });
}
