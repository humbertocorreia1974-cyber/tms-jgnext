import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const COLUMNS = ['emitida', 'coletada', 'em_rota', 'entregue', 'ocorrencia'] as const;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const ots = await prisma.transportOrder.findMany({
    where: { status: { in: [...COLUMNS] } },
    orderBy: { updatedAt: 'desc' },
    take: 300,
    include: {
      client: { select: { name: true } },
      route: { select: { originCity: true, destinationCity: true, destinationState: true } },
      manifest: { select: { code: true, vehicle: { select: { plate: true } } } },
    },
  });

  const grouped: Record<string, typeof ots> = {};
  for (const c of COLUMNS) grouped[c] = [];
  for (const ot of ots) {
    const key = COLUMNS.includes(ot.status as (typeof COLUMNS)[number]) ? ot.status : 'emitida';
    grouped[key].push(ot);
  }

  return NextResponse.json({ columns: COLUMNS, grouped });
}
