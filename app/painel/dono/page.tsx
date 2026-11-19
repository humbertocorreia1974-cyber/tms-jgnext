import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Truck, Clock, AlertTriangle, DollarSign, Route as RouteIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Painel do Dono — BI Operacional | TMS JGNEXT',
  description: 'Faturamento por cliente e rota, ocupação de frota, prazo médio de entrega, índice de ocorrências e inadimplência em tempo real.',
  openGraph: { title: 'Painel do Dono — TMS JGNEXT', description: 'BI operacional completo do seu TMS.' },
};

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default async function PainelDonoPage({ searchParams }: { searchParams: { dias?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  if (!['admin', 'dono', 'gestor', 'operador'].includes(session.user.role ?? '')) redirect('/painel');

  const dias = Number(searchParams.dias ?? 30);
  const desde = new Date(Date.now() - dias * 86400000);

  const [ots, ocorrencias, faturas, veiculos, clientes] = await Promise.all([
    prisma.transportOrder.findMany({
      where: { createdAt: { gte: desde } },
      include: { client: true, route: true },
    }),
    prisma.occurrence.findMany({ where: { createdAt: { gte: desde } } }),
    prisma.invoice.findMany({ where: { issueDate: { gte: desde } }, include: { client: true } }),
    prisma.vehicle.findMany({ where: { isActive: true } }),
    prisma.client.findMany({ where: { isActive: true } }),
  ]);

  const faturamento = ots.reduce((s, o) => s + o.freightTotalValue, 0);
  const entregues = ots.filter((o) => o.status === 'entregue' && o.deliveredAt);
  const prazoMedioDias = entregues.length
    ? entregues.reduce((s, o) => s + (o.deliveredAt!.getTime() - o.createdAt.getTime()) / 86400000, 0) / entregues.length
    : 0;
  const indiceOcorrencias = ots.length ? (ocorrencias.length / ots.length) * 100 : 0;
  const emRota = ots.filter((o) => ['em_rota', 'coletada'].includes(o.status)).length;
  const ocupacao = veiculos.length ? (emRota / veiculos.length) * 100 : 0;
  const inadimplentes = faturas.filter((f) => f.status !== 'paga' && f.dueDate < new Date());
  const inadimplencia = faturas.length ? (inadimplentes.length / faturas.length) * 100 : 0;

  const porCliente = new Map<string, { nome: string; total: number; qtd: number }>();
  for (const o of ots) {
    const cur = porCliente.get(o.clientId) ?? { nome: o.client.name, total: 0, qtd: 0 };
    cur.total += o.freightTotalValue;
    cur.qtd += 1;
    porCliente.set(o.clientId, cur);
  }
  const topClientes = [...porCliente.values()].sort((a, b) => b.total - a.total).slice(0, 5);

  const porRota = new Map<string, { nome: string; total: number; qtd: number }>();
  for (const o of ots) {
    const key = o.routeId;
    const nome = `${o.route.originCity}/${o.route.originState} → ${o.route.destinationCity}/${o.route.destinationState}`;
    const cur = porRota.get(key) ?? { nome, total: 0, qtd: 0 };
    cur.total += o.freightTotalValue;
    cur.qtd += 1;
    porRota.set(key, cur);
  }
  const topRotas = [...porRota.values()].sort((a, b) => b.total - a.total).slice(0, 5);

  const kpis = [
    { label: 'Faturamento', value: brl(faturamento), icon: DollarSign, hint: `${ots.length} OTs no período` },
    { label: 'Ocupação de frota', value: `${ocupacao.toFixed(1)}%`, icon: Truck, hint: `${emRota} de ${veiculos.length} veículos` },
    { label: 'Prazo médio entrega', value: `${prazoMedioDias.toFixed(1)} dias`, icon: Clock, hint: `${entregues.length} entregas` },
    { label: 'Índice de ocorrências', value: `${indiceOcorrencias.toFixed(1)}%`, icon: AlertTriangle, hint: `${ocorrencias.length} ocorrências` },
    { label: 'Inadimplência', value: `${inadimplencia.toFixed(1)}%`, icon: TrendingUp, hint: `${inadimplentes.length} faturas vencidas` },
  ];

  return (
    <div className="min-h-screen bg-bg p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-fg md:text-3xl">Painel do Dono</h1>
            <p className="text-sm text-fg-muted">BI operacional — últimos {dias} dias</p>
          </div>
          <form className="flex items-center gap-2">
            <select
              name="dias"
              defaultValue={String(dias)}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
            >
              <option value="7">7 dias</option>
              <option value="30">30 dias</option>
              <option value="90">90 dias</option>
              <option value="365">12 meses</option>
            </select>
            <Button type="submit" variant="secondary" size="sm">Aplicar</Button>
          </form>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <Card key={k.label}>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide text-fg-muted">{k.label}</span>
                    <Icon className="h-4 w-4 text-brand" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-fg">{k.value}</p>
                  <p className="mt-1 text-xs text-fg-muted">{k.hint}</p>
                </CardBody>
              </Card>
            );
          })}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardBody>
              <CardTitle>Top clientes por faturamento</CardTitle>
              {topClientes.length === 0 ? (
                <div className="mt-4 rounded-md border border-dashed border-border p-6 text-center">
                  <p className="text-sm text-fg-muted">Nenhuma OT emitida no período.</p>
                  <Link href="/operacao/ot/nova" className="mt-3 inline-block">
                    <Button size="sm">Emitir primeira OT</Button>
                  </Link>
                </div>
              ) : (
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase text-fg-muted">
                      <th className="pb-2">#</th>
                      <th className="pb-2">Cliente</th>
                      <th className="pb-2 text-right">OTs</th>
                      <th className="pb-2 text-right">Faturamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topClientes.map((c, i) => (
                      <tr key={c.nome} className="border-b border-border/50">
                        <td className="py-2 text-fg-muted">{i + 1}</td>
                        <td className="py-2 text-fg">{c.nome}</td>
                        <td className="py-2 text-right text-fg-muted">{c.qtd}</td>
                        <td className="py-2 text-right font-medium text-fg">{brl(c.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <CardTitle>Top rotas por faturamento</CardTitle>
              {topRotas.length === 0 ? (
                <p className="mt-4 text-sm text-fg-muted">Sem rotas movimentadas no período.</p>
              ) : (
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase text-fg-muted">
                      <th className="pb-2">#</th>
                      <th className="pb-2">Rota</th>
                      <th className="pb-2 text-right">OTs</th>
                      <th className="pb-2 text-right">Faturamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRotas.map((r, i) => (
                      <tr key={r.nome} className="border-b border-border/50">
                        <td className="py-2 text-fg-muted">{i + 1}</td>
                        <td className="py-2 text-fg">
                          <span className="inline-flex items-center gap-1">
                            <RouteIcon className="h-3.5 w-3.5 text-brand" />
                            {r.nome}
                          </span>
                        </td>
                        <td className="py-2 text-right text-fg-muted">{r.qtd}</td>
                        <td className="py-2 text-right font-medium text-fg">{brl(r.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link href="/operacao/rastreio"><Card><CardBody><p className="text-sm font-medium text-fg">Rastreio em tempo real</p><p className="mt-1 text-xs text-fg-muted">Kanban de OTs por status</p></CardBody></Card></Link>
          <Link href="/financeiro/margem-rota"><Card><CardBody><p className="text-sm font-medium text-fg">Margem por rota</p><p className="mt-1 text-xs text-fg-muted">Frete − custos diretos</p></CardBody></Card></Link>
          <Link href="/financeiro/faturamento"><Card><CardBody><p className="text-sm font-medium text-fg">Faturamento em lote</p><p className="mt-1 text-xs text-fg-muted">Gerar faturas por cliente/período</p></CardBody></Card></Link>
        </section>
      </div>
    </div>
  );
}
