import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const role = (session.user as any).role as string;
  if (!['admin', 'operador', 'dono'].includes(role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const cr = await prisma.collectionRequest.findUnique({ where: { id: params.id } });
  if (!cr) return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 });
  if (cr.status !== 'pendente') return NextResponse.json({ error: 'Solicitação já processada' }, { status: 400 });

  // Encontra rota compatível por cidade/UF de origem e destino
  const route = await prisma.route.findFirst({
    where: {
      originCity: { equals: cr.originCity, mode: 'insensitive' },
      originState: { equals: cr.originState, mode: 'insensitive' },
      destinationCity: { equals: cr.destinationCity, mode: 'insensitive' },
      destinationState: { equals: cr.destinationState, mode: 'insensitive' },
      isActive: true,
    },
  });
  if (!route) return NextResponse.json({ error: 'Nenhuma rota cadastrada para este trecho. Cadastre a rota antes de aprovar.' }, { status: 422 });

  const code = `OT-${Date.now().toString(36).toUpperCase()}`;

  const result = await prisma.$transaction(async (tx) => {
    const ot = await tx.transportOrder.create({
      data: {
        code,
        clientId: cr.clientId,
        routeId: route.id,
        originAddress: cr.originAddress,
        originCity: cr.originCity,
        originState: cr.originState,
        originZip: cr.originZip,
        destinationAddress: cr.destinationAddress,
        destinationCity: cr.destinationCity,
        destinationState: cr.destinationState,
        destinationZip: cr.destinationZip,
        cargoDescription: cr.cargoDescription,
        weightKg: cr.weightKg,
        volumeM3: cr.volumeM3 ?? 0,
        packages: cr.packages,
        status: 'emitida',
        scheduledPickupAt: cr.scheduledFor,
      },
    });
    await tx.collectionRequest.update({
      where: { id: cr.id },
      data: {
        status: 'aprovada',
        approvedById: session.user.id,
        approvedAt: new Date(),
        transportOrderId: ot.id,
      },
    });
    await tx.oTEvent.create({
      data: {
        transportOrderId: ot.id,
        type: 'criada',
        description: `OT gerada a partir da solicitação de coleta ${cr.id}`,
        registeredById: session.user.id,
      },
    });
    return ot;
  });

  return NextResponse.json({ ok: true, transportOrderId: result.id, code: result.code });
}
