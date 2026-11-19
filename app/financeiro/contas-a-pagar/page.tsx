import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Plus } from 'lucide-react';
import NewPayableForm from './new-payable-form';
import PayableRow from './payable-row';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Contas a Pagar | TMS JGNEXT',
  description: 'Controle de contas a pagar incluindo frete de motorista agregado, manutenção e despesas administrativas.',
  openGraph: { title: 'Contas a Pagar | TMS JGNEXT', description: 'Contas a pagar do TMS.' },
};

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default async function Page({ searchParams }: { searchParams: { status?: string; category?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['admin', 'gestor'].includes(session.user.role ?? '')) redirect('/painel');

  const where: any = {};
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.category) where.category = searchParams.category;

  const [payables, drivers, clients, agg] = await Promise.all([
    prisma.accountPayable.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      take: 200,
      include: { driver: { select: { name: true } }, client: { select: { name: true } } },
    }),
    prisma.driver.findMany({ where: { isActive: true }, select: { id: true, name: true, type: true } }),
    prisma.client.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    prisma.accountPayable.aggregate({ where, _sum: { amount: true }, _count: { _all: true } }),
  ]);

  const hoje = new Date();
  const vencidas = payables.filter(p => p.status === 'pendente' && p.dueDate < hoje).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg">Contas a Pagar</h1>
          <p className="text-sm text-fg-muted">Frete de agregado, manutenção, combustível e despesas administrativas.</p>
        </div>
        <NewPayableForm drivers={drivers} clients={clients} />
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardBody>
          <p className="text-xs uppercase tracking-wide text-fg-muted">Total listado</p>
          <p className="mt-1 text-2xl font-bold text-fg">{brl(agg._sum.amount ?? 0)}</p>
        </CardBody></Card>
        <Card><CardBody>
          <p className="text-xs uppercase tracking-wide text-fg-muted">Lançamentos</p>
          <p className="mt-1 text-2xl font-bold text-fg">{agg._count._all}</p>
        </CardBody></Card>
        <Card><CardBody>
          <p className="text-xs uppercase tracking-wide text-fg-muted">Vencidas</p>
          <p className="mt-1 text-2xl font-bold text-red-500">{vencidas}</p>
        </CardBody></Card>
      </div>

      <Card><CardBody>
        <form className="flex flex-wrap items-end gap-3" action="/financeiro/contas-a-pagar">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-fg-muted">Status</label>
            <select name="status" defaultValue={searchParams.status ?? ''} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
              <option value="">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-fg-muted">Categoria</label>
            <select name="category" defaultValue={searchParams.category ?? ''} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
              <option value="">Todas</option>
              <option value="frete_agregado">Frete agregado</option>
              <option value="manutencao">Manutenção</option>
              <option value="combustivel">Combustível</option>
              <option value="pedagio">Pedágio</option>
              <option value="administrativo">Administrativo</option>
              <option value="outros">Outros</option>
            </select>
          </div>
          <Button type="submit" variant="secondary" size="sm">Filtrar</Button>
          <Link href="/financeiro/contas-a-pagar" className="text-xs text-fg-muted underline">Limpar</Link>
        </form>
      </CardBody></Card>

      {payables.length === 0 ? (
        <Card><CardBody>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Wallet className="h-8 w-8 text-fg-muted" />
            <p className="text-sm text-fg-muted">Nenhuma conta a pagar registrada. Lance a primeira para começar a controlar o caixa.</p>
          </div>
        </CardBody></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                <tr>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Fornecedor</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payables.map(p => (
                  <PayableRow
                    key={p.id}
                    id={p.id}
                    description={p.description}
                    category={p.category}
                    supplier={p.driver?.name ?? p.client?.name ?? '—'}
                    dueDate={p.dueDate.toISOString()}
                    amount={p.amount}
                    status={p.status}
                    overdue={p.status === 'pendente' && p.dueDate < hoje}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
