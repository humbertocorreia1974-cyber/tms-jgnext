import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { VehicleForm } from './vehicle-form';
import { DriverForm } from './driver-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Frota e Motoristas | TMS JGNEXT',
  description: 'Cadastro de veículos (capacidade kg/m³) e motoristas próprios e agregados.',
  openGraph: {
    title: 'Frota e Motoristas | TMS JGNEXT',
    description: 'Cadastro de veículos (capacidade kg/m³) e motoristas próprios e agregados.',
  },
};

export default async function FrotaPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  if (!['admin', 'operador', 'dono'].includes(session.user.role ?? '')) redirect('/painel');

  const [vehicles, drivers] = await Promise.all([
    prisma.vehicle.findMany({ orderBy: { plate: 'asc' } }),
    prisma.driver.findMany({
      orderBy: { name: 'asc' },
      include: { vehicle: { select: { plate: true } } },
    }),
  ]);

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-fg-muted">Cadastros</p>
          <h1 className="text-3xl font-bold">Frota e Motoristas</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {vehicles.length} veículo{vehicles.length === 1 ? '' : 's'} · {drivers.length} motorista{drivers.length === 1 ? '' : 's'}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardTitle>Veículos</CardTitle>
            <CardBody>
              {vehicles.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <p className="text-sm text-fg-muted">Nenhum veículo cadastrado.</p>
                  <p className="mt-1 text-xs text-fg-muted">Cadastre o primeiro veículo no formulário ao lado.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-fg-muted">
                        <th className="py-2 pr-3">Placa</th>
                        <th className="py-2 pr-3">Modelo</th>
                        <th className="py-2 pr-3">Tipo</th>
                        <th className="py-2 pr-3 text-right">Cap. kg</th>
                        <th className="py-2 pr-3 text-right">Cap. m³</th>
                        <th className="py-2 pr-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicles.map((v) => (
                        <tr key={v.id} className="border-b border-border/60 transition-colors duration-150 hover:bg-white/5">
                          <td className="py-3 pr-3 font-mono font-medium">{v.plate}</td>
                          <td className="py-3 pr-3">{v.brand ? `${v.brand} ` : ''}{v.model}</td>
                          <td className="py-3 pr-3 text-fg-muted">{v.type}</td>
                          <td className="py-3 pr-3 text-right font-mono">{v.capacityKg.toFixed(0)}</td>
                          <td className="py-3 pr-3 text-right font-mono">{v.capacityM3.toFixed(1)}</td>
                          <td className="py-3 pr-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs ${v.status === 'disponivel' ? 'bg-brand/10 text-brand' : 'bg-fg-muted/10 text-fg-muted'}`}>
                              {v.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          <VehicleForm />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardTitle>Motoristas</CardTitle>
            <CardBody>
              {drivers.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <p className="text-sm text-fg-muted">Nenhum motorista cadastrado.</p>
                  <p className="mt-1 text-xs text-fg-muted">Cadastre o primeiro motorista no formulário ao lado.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-fg-muted">
                        <th className="py-2 pr-3">Nome</th>
                        <th className="py-2 pr-3">CNH</th>
                        <th className="py-2 pr-3">Tipo</th>
                        <th className="py-2 pr-3">Veículo</th>
                        <th className="py-2 pr-3 text-right">Comissão</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drivers.map((d) => (
                        <tr key={d.id} className="border-b border-border/60 transition-colors duration-150 hover:bg-white/5">
                          <td className="py-3 pr-3 font-medium">{d.name}</td>
                          <td className="py-3 pr-3 font-mono text-xs">{d.cnhNumber} ({d.cnhCategory})</td>
                          <td className="py-3 pr-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs ${d.type === 'agregado' ? 'bg-accent/10 text-accent' : 'bg-brand/10 text-brand'}`}>
                              {d.type}
                            </span>
                          </td>
                          <td className="py-3 pr-3 font-mono text-xs">{d.vehicle?.plate ?? '—'}</td>
                          <td className="py-3 pr-3 text-right font-mono text-xs">
                            {d.commissionPercent != null ? `${d.commissionPercent}%` : d.commissionPerRoute != null ? `R$ ${d.commissionPerRoute.toFixed(2)}/rota` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          <DriverForm />
        </div>
      </div>
    </div>
  );
}
