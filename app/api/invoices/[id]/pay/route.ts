import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'gestor'].includes(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  const inv = await prisma.invoice.update({ where: { id: params.id }, data: { status: 'paga' } });
  await prisma.auditLog.create({
    data: { userId: session.user.id, action: 'invoice.pay', entity: 'Invoice', entityId: inv.id },
  });
  return NextResponse.json({ ok: true });
}
