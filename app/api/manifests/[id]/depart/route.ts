import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const manifest = await prisma.manifest.findUnique({ where: { id: params.id } });
  if (!manifest) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (manifest.status !== 'aberto') {
    return NextResponse.json({ error: 'romaneio não está aberto' }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const m = await tx.manifest.update({
      where: { id: params.id },
      data: { status: 'em_rota', departureAt: new Date() },
    });
    await tx.transportOrder.updateMany({
      where: { manifestId: params.id },
      data: { status: 'em_rota' },
    });
    await tx.oTEvents.createMany({
      data: [],
    }).catch(() => undefined);
    return m;
  });

  return NextResponse.json({ manifest: updated });
}
