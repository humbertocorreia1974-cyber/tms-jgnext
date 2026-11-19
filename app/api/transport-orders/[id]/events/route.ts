import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const ALLOWED = ['admin', 'operador', 'gestor', 'dono', 'motorista'];
const VALID_TYPES = ['coletada', 'em_rota', 'em_transito', 'entregue', 'ocorrencia', 'cancelada'];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const { id } = await params;

  const events = await prisma.oTEvent.findMany({
    where: { transportOrderId: id },
    orderBy: { occurredAt: 'desc' },
    include: { registeredBy: { select: { name: true } } },
  });
  return NextResponse.json({ events });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? 'user';
  if (!ALLOWED.includes(role)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.type !== 'string' || !VALID_TYPES.includes(body.type)) {
    return NextResponse.json({ error: 'Tipo de evento inválido' }, { status: 400 });
  }

  const order = await prisma.transportOrder.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: 'OT não encontrada' }, { status: 404 });

  const now = new Date();
  const data: Record<string, unknown> = { status: body.type };
  if (body.type === 'entregue') data.deliveredAt = now;

  const [event] = await prisma.$transaction([
    prisma.oTEvent.create({
      data: {
        transportOrderId: id,
        type: body.type,
        description: typeof body.description === 'string' ? body.description : null,
        latitude: typeof body.latitude === 'number' ? body.latitude : null,
        longitude: typeof body.longitude === 'number' ? body.longitude : null,
        registeredById: session.user.id,
      },
    }),
    prisma.transportOrder.update({ where: { id }, data }),
  ]);

  return NextResponse.json({ event }, { status: 201 });
}
