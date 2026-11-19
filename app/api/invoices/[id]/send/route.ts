import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'gestor'].includes(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  const inv = await prisma.invoice.findUnique({ where: { id: params.id }, include: { client: true } });
  if (!inv) return NextResponse.json({ error: 'Fatura não encontrada' }, { status: 404 });
  if (!inv.client.email) return NextResponse.json({ error: 'Cliente sem e-mail cadastrado' }, { status: 400 });

  const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  await sendEmail({
    to: inv.client.email,
    subject: `Fatura ${inv.number} — TMS JGNEXT`,
    html: `<p>Olá ${inv.client.name},</p><p>Sua fatura <strong>${inv.number}</strong> no valor de <strong>${brl(inv.total)}</strong> vence em ${inv.dueDate.toLocaleDateString('pt-BR')}.</p><p>Baixe o PDF/DANFE no portal do cliente.</p>`,
  });

  await prisma.invoice.update({ where: { id: inv.id }, data: { status: 'enviada' } });
  return NextResponse.json({ ok: true });
}
