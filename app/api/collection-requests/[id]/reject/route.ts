import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const role = (session.user as any).role as string;
  if (!['admin', 'operador', 'dono'].includes(role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (!reason) return NextResponse.json({ error: 'Motivo obrigatório' }, { status: 400 });

  const cr = await prisma.collectionRequest.findUnique({ where: { id: params.id } });
  if (!cr) return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 });
  if (cr.status !== 'pendente') return NextResponse.json({ error: 'Solicitação já processada' }, { status: 400 });

  await prisma.collectionRequest.update({
    where: { id: cr.id },
    data: {
      status: 'rejeitada',
      rejectionReason: reason,
      approvedById: session.user.id,
      approvedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
