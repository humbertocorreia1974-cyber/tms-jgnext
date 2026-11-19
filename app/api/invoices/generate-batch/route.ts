import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'gestor'].includes(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  const body = await request.json();
  const { clientId, periodStart, periodEnd, dueDate } = body ?? {};
  if (!clientId || !periodStart || !periodEnd || !dueDate) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
  }

  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  end.setHours(23, 59, 59, 999);

  const orders = await prisma.transportOrder.findMany({
    where: {
      clientId,
      status: { in: ['entregue', 'em_rota', 'coletada'] },
      createdAt: { gte: start, lte: end },
      invoiceItems: { none: {} },
    },
    select: { id: true, code: true, freightTotalValue: true },
  });

  if (orders.length === 0) {
    return NextResponse.json({ error: 'Nenhuma OT faturável no período' }, { status: 400 });
  }

  const subtotal = orders.reduce((s, o) => s + (o.freightTotalValue ?? 0), 0);
  const taxes = +(subtotal * 0.12).toFixed(2);
  const total = +(subtotal + taxes).toFixed(2);

  const count = await prisma.invoice.count();
  const number = `FAT-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

  const invoice = await prisma.invoice.create({
    data: {
      number,
      clientId,
      periodStart: start,
      periodEnd: end,
      dueDate: new Date(dueDate),
      subtotal,
      taxes,
      total,
      status: 'emitida',
      createdById: session.user.id,
      items: {
        create: orders.map(o => ({
          transportOrderId: o.id,
          description: `OT ${o.code}`,
          value: o.freightTotalValue ?? 0,
        })),
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'invoice.generate_batch',
      entity: 'Invoice',
      entityId: invoice.id,
      after: { number, total, items: orders.length },
    },
  });

  return NextResponse.json({ id: invoice.id, number, items: orders.length, total });
}
