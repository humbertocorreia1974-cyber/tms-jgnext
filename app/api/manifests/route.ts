import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? undefined;

  const manifests = await prisma.manifest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      vehicle: { select: { plate: true, model: true, capacityKg: true, capacityM3: true } },
      driver: { select: { name: true, type: true } },
      _count: { select: { items: true, transportOrders: true } },
    },
  });
  return NextResponse.json({ manifests });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== 'admin' && role !== 'operador') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 });

  const { vehicleId, driverId, transportOrderIds } = body as {
    vehicleId?: string;
    driverId?: string;
    transportOrderIds?: string[];
  };
  if (!vehicleId || !driverId || !Array.isArray(transportOrderIds) || transportOrderIds.length === 0) {
    return NextResponse.json({ error: 'vehicleId, driverId e transportOrderIds são obrigatórios' }, { status: 400 });
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) return NextResponse.json({ error: 'veículo não encontrado' }, { status: 404 });

  const ots = await prisma.transportOrder.findMany({
    where: { id: { in: transportOrderIds }, manifestId: null },
  });
  if (ots.length === 0) {
    return NextResponse.json({ error: 'nenhuma OT disponível para romaneio' }, { status: 400 });
  }

  const totalWeightKg = ots.reduce((s, o) => s + (o.weightKg ?? 0), 0);
  const totalCubageWeightKg = ots.reduce((s, o) => s + (o.cubageWeightKg ?? 0), 0);
  const totalVolumeM3 = ots.reduce((s, o) => s + (o.volumeM3 ?? 0), 0);

  if (totalWeightKg > vehicle.capacityKg) {
    return NextResponse.json(
      { error: `Peso total (${totalWeightKg.toFixed(0)}kg) excede a capacidade do veículo (${vehicle.capacityKg.toFixed(0)}kg)` },
      { status: 400 },
    );
  }
  if (totalVolumeM3 > vehicle.capacityM3) {
    return NextResponse.json(
      { error: `Volume total (${totalVolumeM3.toFixed(2)}m³) excede a capacidade do veículo (${vehicle.capacityM3.toFixed(2)}m³)` },
      { status: 400 },
    );
  }

  const code = `ROM-${Date.now().toString(36).toUpperCase()}`;

  const manifest = await prisma.$transaction(async (tx) => {
    const created = await tx.manifest.create({
      data: {
        code,
        vehicleId,
        driverId,
        status: 'aberto',
        totalWeightKg,
        totalCubageWeightKg,
        totalVolumeM3,
        capacityKg: vehicle.capacityKg,
        capacityM3: vehicle.capacityM3,
        createdById: session.user.id,
        items: {
          create: ots.map((o, i) => ({
            transportOrderId: o.id,
            weightKg: o.weightKg ?? 0,
            cubageWeightKg: o.cubageWeightKg ?? 0,
            volumeM3: o.volumeM3 ?? 0,
            sequence: i + 1,
          })),
        },
      },
    });
    await tx.transportOrder.updateMany({
      where: { id: { in: ots.map((o) => o.id) } },
      data: { manifestId: created.id, status: 'em_romaneio' },
    });
    return created;
  });

  return NextResponse.json({ manifest }, { status: 201 });
}
