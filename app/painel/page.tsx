import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Truck,
  Clock,
  AlertTriangle,
  Wallet,
  ArrowRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Painel do Dono | TMS JGNEXT',
  description:
    'BI operacional: faturamento por cliente e rota, ocupação de frota, prazo médio de entrega, índice de ocorrências e inadimplência.',
  openGraph: {
    title: 'Painel do Dono | TMS JGNEXT',
    description:
      'BI operacional do TMS JGNEXT: faturamento, ocupação de frota, prazo médio, ocorrências e inadimplência.',
  },
};

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function PainelPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'admin' && session.user.role !== 'gestor' && session.user.role !== 'dono') {
    redirect('/');
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    invoicesMonth,
    invoicesOverdue,
    ordersMonth,
    ordersDelivered,
    vehicles,
    occurrencesOpen,
    topClientsRaw,
    topRoutesRaw,
  ] = await Promise.all([
    prisma.invoice.findMany({
      where: { issueDate: { gte: startOfMonth }, status: { not: 'cancelada' } },
      select: { total: true },
    }),
    prisma.invoice.findMany({
      where: { status: { in: ['emitida', 'vencida'] }, dueDate: { lt: now } },
      select: { total: true },
    }),
    prisma.transportOrder.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.transportOrder.findMany({
      where: {
        deliveredAt: { not: null },
        createdAt: { gte: startOfMonth },
      },
      select: { createdAt: true, deliveredAt: true },
    }),
    prisma.vehicle.findMany({
      where: { isActive: true },
      select: { status: true },
    }),
    prisma.occurrence.count({ where: { status: 'aberta' } }),
    prisma.invoice.groupBy({
      by: ['clientId'],
      where: { issueDate: { gte: startOfMonth } },
      _sum: { total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    }),
    prisma.transportOrder.groupBy({
      by: ['routeId'],
      where: { createdAt: { gte: startOfMonth } },
      _sum: { freightTotalValue: true },
      _count: { _all: true },
      orderBy: { _sum: { freightTotalValue: 'desc' } },
      take: 5,
    }),
  ]);

  const clientIds = topClientsRaw.map((c) => c.clientId);
  const routeIds = topRoutesRaw.map((r) => r.routeId);
  const [clients, routes] = await Promise.all([
    prisma.client.findMany({ where: { id: { in: clientIds } }, select: { id: true, name: true } }),
    prisma.route.findMany({
      where: { id: { in: routeIds } },
      select: { id: true, originCity: true, originState: true, destinationCity: true, destinationState: true },
    }),
  ]);
  const clientMap = new Map(clients.map((c) => [c.id, c.name]));
  const routeMap = new Map(
    routes.map((r) => [r.id, `${r.originCity}/${r.originState} → ${r.destinationCity}/${r.destinationState}`]),
  );

  const faturamentoMes = invoicesMonth.reduce((s, i) => s + i.total, 0);
  const inadimplencia = invoicesOverdue.reduce((s, i) => s + i.total, 0);
  const totalVeiculos = vehicles.length;
  const veiculosEmRota = vehicles.filter((v) => v.status === 'em_rota').length;
  const ocupacao = totalVeiculos > 0 ? (veiculosEmRota / totalVeiculos) * 100 : 0;

  const prazos = ordersDelivered
    .filter((o) => o.deliveredAt)
    .map((o) => (o.deliveredAt!.getTime() - o.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const prazoMedio = prazos.length > 0 ? prazos.reduce((a, b) => a + b, 0) / prazos.length : 0;
  const indiceOcorrencias = ordersMonth > 0 ? (occurrencesOpen / ordersMonth) * 100 : 0;

  const kpis = [
    { label: 'Faturamento do mês', value: brl(faturamentoMes), icon: TrendingUp, accent: 'text-brand' },
    { label: 'Ocupação de frota`, value: `${ocupacao.toFixed(1)}%`, sub: `${veiculosEmRota}/${totalVeiculos} veículos`, icon: Truck, accent: `text-brand' },
    { label: 'Prazo médio de entrega`, value: `${prazoMedio.toFixed(1)} dias`, icon: Clock, accent: `text-brand' },
    { label: 'Índice de ocorrências`, value: `${indiceOcorrencias.toFixed(1)}%`, sub: `${occurrencesOpen} abertas`, icon: AlertTriangle, accent: `text-accent' },
    { label: 'Inadimplência`, value: brl(inadimplencia), sub: `${invoicesOverdue.length} faturas vencidas`, icon: Wallet, accent: `text-accent' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-fg-muted">Painel do Dono</p>
          <h1 className="mt-1 text-3xl font-bold text-fg">Visão executiva</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Indicadores operacionais e financeiros do mês corrente.
          </p>
        </div>
        <Link href="/operacao/ot/nova">
          <Button variant="primary" size="md">
            Emitir OT <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">{k.label}</p>
                  <Icon className={`h-4 w-4 ${k.accent}`} />
                </div>
                <p className="mt-3 text-2xl font-bold text-fg">{k.value}</p>
                {k.sub && <p className="mt-1 text-xs text-fg-muted">{k.sub}</p>}
              </CardBody>
            </Card>
          );
        })}
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <CardTitle>Top clientes do mês</CardTitle>
            {topClientsRaw.length === 0 ? (
              <div className="mt-4 rounded-md border border-dashed border-border p-6 text-center">
                <p className="text-sm text-fg-muted">Nenhuma fatura emitida neste mês.</p>
                <Link href="/financeiro/faturamento" className="mt-3 inline-block text-sm text-brand hover:underline">
                  Ir para faturamento
                </Link>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {topClientsRaw.map((c, i) => (
                  <li key={c.clientId} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                        {i + 1}
                      </span>
                      <span className="text-sm text-fg">{clientMap.get(c.clientId) ?? '—'}</span>
                    </div>
                    <span className="text-sm font-semibold text-fg">{brl(c._sum.total ?? 0)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <CardTitle>Top rotas do mês</CardTitle>
            {topRoutesRaw.length === 0 ? (
              <div className="mt-4 rounded-md border border-dashed border-border p-6 text-center">
                <p className="text-sm text-fg-muted">Nenhuma OT emitida neste mês.</p>
                <Link href="/operacao/ot/nova" className="mt-3 inline-block text-sm text-brand hover:underline">
                  Emitir primeira OT
                </Link>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {topRoutesRaw.map((r, i) => (
                  <li key={r.routeId} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm text-fg">{routeMap.get(r.routeId) ?? '—'}</p>
                        <p className="text-xs text-fg-muted">{r._count._all} OTs</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-fg">{brl(r._sum.freightTotalValue ?? 0)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
