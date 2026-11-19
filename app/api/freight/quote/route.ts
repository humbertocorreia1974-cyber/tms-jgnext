import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { calculateFreight } from "@/lib/freight";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = await requireRole(["admin", "operador", "dono"]);
  if (!guard.ok) return NextResponse.json({ error: "não autorizado" }, { status: guard.status });
  const body = await request.json();
  const { freightTableId, routeId, weightKg, volumeM3 } = body;
  if (!freightTableId || !routeId || weightKg == null) {
    return NextResponse.json({ error: "freightTableId, routeId e weightKg obrigatórios" }, { status: 400 });
  }
  const table = await prisma.freightTable.findUnique({ where: { id: freightTableId } });
  if (!table) return NextResponse.json({ error: "tabela não encontrada" }, { status: 404 });

  const rate = await prisma.freightRate.findFirst({
    where: {
      freightTableId,
      routeId,
      weightFrom: { lte: Number(weightKg) },
      weightTo: { gte: Number(weightKg) },
    },
  });

  const quote = calculateFreight({
    weightKg: Number(weightKg),
    volumeM3: volumeM3 ? Number(volumeM3) : 0,
    cubageFactor: table.cubageFactor,
    pricePerKg: rate?.pricePerKg ?? null,
    fixedValue: rate?.fixedValue ?? null,
    minValue: rate?.minValue ?? table.minValue,
    grisPercent: table.grisPercent,
    tdeValue: table.tdeValue,
    tollValue: table.tollValue,
  });

  return NextResponse.json({ quote, rate, table });
}
