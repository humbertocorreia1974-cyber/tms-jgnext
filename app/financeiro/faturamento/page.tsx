import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Download, Send, Plus } from 'lucide-react';
import GenerateBatchForm from './generate-batch-form';
import InvoiceActions from './invoice-actions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Faturamento em Lote | TMS JGNEXT',
  description: 'Gere faturas por cliente e período com PDF/DANFE simplificada, envie por e-mail e acompanhe o status de cobrança.',
  openGraph: { title: 'Faturamento em Lote | TMS JGNEXT', description: 'Faturamento por cliente/período com PDF/DANFE.' },
};

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default async function Page({ searchParams }: { searchParams: { clientId?: string; status?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'gestor'].includes(session.user.role ?? '')) redirect('/painel');

  const where: any = {};
  if (searchParams.clientId) where.clientId = searchParams.clientId;
  if (searchParams.status) where.status = searchParams.status;

  const [clients, invoices, totals] = await Promise.all([
    prisma.client.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.invoice.findMany({
      where,
      orderBy: { issueDate: 'desc' },
      take: 100,
      include: { client: { select: { name: true } }, _count: { select: { items: true } } },
    }),
    prisma.invoice.aggregate({ where, _sum: { total: true }, _count: { _all: true } }),
  ]);

  const statusColor: Record<string, string> = {
    emitida: 'bg-brand/10 text-brand',
    enviada: 'bg-accent/10 text-accent',
    paga: 'bg-emerald-500/10 text-emerald-500',
    vencida: 'bg-red-500/10 text-red-500',
    cancelada: 'bg-fg-muted/10 text-fg-muted',
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg">Faturamento em Lote</h1>
          <p className="text-sm text-fg-muted">Gere faturas por cliente e período, com PDF/DANFE simplificada e envio por e-mail/WhatsApp.</p>
        </div>
        <GenerateBatchForm clients={clients} />
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardBody>
          <p className="text-xs uppercase tracking-wide text-fg-muted">Faturas listadas</p>
          <p className="mt-1 text-2xl font-bold text-fg">{totals._count._all}</p>
        </CardBody></Card>
        <Card><CardBody>
          <p className="text-xs uppercase tracking-wide text-fg-muted">Valor total</p>
          <p className="mt-1 text-2xl font-bold text-fg">{brl(totals._sum.total ?? 0)}</p>
        </CardBody></Card>
        <Card><CardBody>
          <p className="text-xs uppercase tracking-wide text-fg-muted">Ticket médio</p>
          <p className="mt-1 text-2xl font-bold text-fg">{brl(totals._count._all ? (totals._sum.total ?? 0) / totals._count._all : 0)}</p>
        </CardBody></Card>
      </div>

      <Card><CardBody>
        <form className="flex flex-wrap items-end gap-3" action="/financeiro/faturamento">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-fg-muted">Cliente</label>
            <select name="clientId" defaultValue={searchParams.clientId ?? ''} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
              <option value="">Todos</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-fg-muted">Status</label>
            <select name="status" defaultValue={searchParams.status ?? ''} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
              <option value="">Todos</option>
              <option value="emitida">Emitida</option>
              <option value="enviada">Enviada</option>
              <option value="paga">Paga</option>
              <option value="vencida">Vencida</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          <Button type="submit" variant="secondary" size="sm">Filtrar</Button>
          <Link href="/financeiro/faturamento" className="text-xs text-fg-muted underline">Limpar</Link>
        </form>
      </CardBody></Card>

      {invoices.length === 0 ? (
        <Card><CardBody>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <FileText className="h-8 w-8 text-fg-muted" />
            <p className="text-sm text-fg-muted">Nenhuma fatura encontrada. Gere a primeira em lote por cliente e período.</p>
          </div>
        </CardBody></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                <tr>
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Período</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">OTs</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map(inv => (
                  <tr key={inv.id} className="transition-colors duration-150 hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-fg">{inv.number}</td>
                    <td className="px-4 py-3 text-fg">{inv.client.name}</td>
                    <td className="px-4 py-3 text-fg-muted">
                      {inv.periodStart.toLocaleDateString('pt-BR')} → {inv.periodEnd.toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-fg-muted">{inv.dueDate.toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 text-fg-muted">{inv._count.items}</td>
                    <td className="px-4 py-3 text-right font-semibold text-fg">{brl(inv.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${statusColor[inv.status] ?? 'bg-fg-muted/10 text-fg-muted'}`}>{inv.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <InvoiceActions id={inv.id} status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
