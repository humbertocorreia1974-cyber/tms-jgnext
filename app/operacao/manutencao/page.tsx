import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Wrench, Fuel, Plus } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MaintenanceForm from './maintenance-form-client';
import FuelingForm from './fueling-form-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Manutenção & Abastecimento | TMS JGNEXT',
  description: 'Controle de manutenções preventivas/corretivas e abastecimentos da frota.',
  openGraph: {
    title: 'Manutenção & Abastecimento | TMS JGNEXT',
    description: 'Controle de manutenções e abastecimentos da frota.',
  },
};

const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const role = (session.user as { role?: string }).role;
  if (role !== 'admin' && role !== 'operador' && role !== 'gestor') {
    redirect('/painel');
  }

  const [vehicles, maintenances, fuelings] = await Promise.all([
    prisma.vehicle.findMany({
      where: { isActive: true },
      orderBy: { plate: 'asc' },
      select: { id: true, plate: true, model: true, currentOdometerKm: true },
    }),
    prisma.maintenance.findMany({
      orderBy: { performedAt: 'desc' },
      take: 30,
      include: { vehicle: { select: { plate: true, model: true } } },
    }),
    prisma.fueling.findMany({
      orderBy: { fueledAt: 'desc' },
      take: 30,
      include: { vehicle: { select: { plate: true } } },
    }),
  ]);

  const totalManut = maintenances.reduce((s, m) => s + m.cost, 0);
  const totalFuel = fuelings.reduce((s, f) => s + f.totalValue, 0);
  const litros = fuelings.reduce((s, f) => s + f.liters, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Manutenção & Abastecimento</h1>
          <p className="text-sm text-fg-muted">
            Registre preventivas, corretivas e abastecimentos por veículo.
          </p>
        </div>
        <Link href="/cadastros/frota">
          <Button variant="secondary" size="sm">Ver frota</Button>
        </Link>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">Manutenções (30 últ.)</p>
            <p className="mt-1 text-xl font-semibold text-fg">{brl(totalManut)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">Abastecimentos (30 últ.)</p>
            <p className="mt-1 text-xl font-semibold text-fg">{brl(totalFuel)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-fg-muted">Litros abastecidos</p>
            <p className="mt-1 text-xl font-semibold text-fg">{litros.toFixed(1)} L</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <div className="mb-3 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-brand" aria-hidden />
              <CardTitle>Nova manutenção</CardTitle>
            </div>
            {vehicles.length === 0 ? (
              <p className="text-sm text-fg-muted">
                Cadastre um veículo em <Link className="text-brand underline" href="/cadastros/frota">Frota</Link> antes.
              </p>
            ) : (
              <MaintenanceForm vehicles={vehicles} />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="mb-3 flex items-center gap-2">
              <Fuel className="h-4 w-4 text-brand" aria-hidden />
              <CardTitle>Novo abastecimento</CardTitle>
            </div>
            {vehicles.length === 0 ? (
              <p className="text-sm text-fg-muted">Sem veículos cadastrados.</p>
            ) : (
              <FuelingForm vehicles={vehicles} />
            )}
          </CardBody>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-fg">Histórico de manutenções</h2>
        {maintenances.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-sm text-fg-muted">
                Nenhuma manutenção registrada ainda. Use o formulário acima para lançar a primeira.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-sm">
              <thead className="bg-surface/70 text-left text-xs uppercase text-fg-muted">
                <tr>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Veículo</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Descrição</th>
                  <th className="px-3 py-2 text-right">Custo</th>
                </tr>
              </thead>
              <tbody>
                {maintenances.map((m) => (
                  <tr key={m.id} className="border-t border-border">
                    <td className="px-3 py-2 text-fg-muted">
                      {new Date(m.performedAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-3 py-2 text-fg">
                      {m.vehicle.plate} <span className="text-fg-muted">· {m.vehicle.model}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                        {m.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-fg-muted">{m.description ?? '—'}</td>
                    <td className="px-3 py-2 text-right text-fg">{brl(m.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-fg">Histórico de abastecimentos</h2>
        {fuelings.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-sm text-fg-muted">Nenhum abastecimento registrado.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-sm">
              <thead className="bg-surface/70 text-left text-xs uppercase text-fg-muted">
                <tr>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Veículo</th>
                  <th className="px-3 py-2">Posto</th>
                  <th className="px-3 py-2 text-right">Litros</th>
                  <th className="px-3 py-2 text-right">R$/L</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {fuelings.map((f) => (
                  <tr key={f.id} className="border-t border-border">
                    <td className="px-3 py-2 text-fg-muted">
                      {new Date(f.fueledAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-3 py-2 text-fg">{f.vehicle.plate}</td>
                    <td className="px-3 py-2 text-fg-muted">{f.station ?? '—'}</td>
                    <td className="px-3 py-2 text-right text-fg">{f.liters.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right text-fg-muted">
                      {brl(f.pricePerLiter)}
                    </td>
                    <td className="px-3 py-2 text-right text-fg">{brl(f.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-6 flex items-center gap-2 text-xs text-fg-muted">
        <Plus className="h-3 w-3" aria-hidden /> Cada lançamento é auditado automaticamente.
      </p>
    </div>
  );
}
