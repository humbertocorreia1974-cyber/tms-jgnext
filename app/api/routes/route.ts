import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireRole(["admin", "operador", "dono"]);
  if (!guard.ok) return NextResponse.json({ error: "não autorizado" }, { status: guard.status });
  const routes = await prisma.route.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ routes });
}

export async function POST(request: Request) {
  const guard = await requireRole(["admin", "operador", "dono"]);
  if (!guard.ok) return NextResponse.json({ error: "não autorizado" }, { status: guard.status });
  const body = await request.json();
  if (!body.originCity || !body.destinationCity) {
    return NextResponse.json({ error: "origem e destino obrigatórios" }, { status: 400 });
  }
  const route = await prisma.route.create({
    data: {
      originCity: body.originCity,
      originState: body.originState ?? "",
      originZip: body.originZip ?? null,
      destinationCity: body.destinationCity,
      destinationState: body.destinationState ?? "",
      destinationZip: body.destinationZip ?? null,
      distanceKm: body.distanceKm ? Number(body.distanceKm) : null,
      estimatedHours: body.estimatedHours ? Number(body.estimatedHours) : null,
    },
  });
  return NextResponse.json({ route }, { status: 201 });
}
