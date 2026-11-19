import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RomaneioForm } from './romaneio-form';
import { ManifestList } from './manifest-list';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Romaneio de Carga | TMS JGNEXT',
  description: 'Agrupe OTs por veículo e motorista com validação automática de peso e cubagem.',
  openGraph: {
    title: 'Romaneio de Carga | TMS JGNEXT',
    description: 'Agrupamento por veículo + motorista com validação de peso e cubagem.',
  },
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const role = (session.user as { role?: string }).role;
  if (role !== 'admin' && role !== 'operador') redirect('/painel');

  const [vehicles, drivers, availableOTs, manifests] = await Promise.all([
    prisma.vehicle.findMany({
      where: { isActive: true, status: 'disponivel' },
      orderBy: { plate: 'asc' },
      select: { id: true, plate: true, model: true, capacityKg: true, capacityM3: true },
    }),
    prisma.driver.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, type: true, vehicleId: true },
    }),
    prisma.transportOrder.findMany({
      where: { manifestId: null, status: { in: ['emitida', 'coletada'] } },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { client: { select: { name: true } } },
    }),
    prisma.manifest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        vehicle: { select: { plate: true } },
        driver: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  const otsData = availableOTs.map((o) => ({
    id: o.id,
    code: o.code,
    clientName: o.client.name,
    destinationCity: o.destinationCity,
    destinationState: o.destinationState,
    weightKg: o.weightKg,
    volumeM3: o.volumeM3,
    cubageWeightKg: o.cubageWeightKg,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-fg-muted">Operação</p>
          <h1 className="text-2xl font-semibold text-fg">Romaneio de Carga</h1>
          <p className="text-sm text-fg-muted">
            Agrupe OTs por veículo e motorista. O sistema valida peso real, peso cubado e volume contra a capacidade.
          </p>
        </div>
        <Link href="/operacao/ot/nova">
          <Button variant="secondary" size="sm">Emitir nova OT</Button>
        </Link>
      </header>

      <Card>
        <CardBody>
          <CardTitle>Novo romaneio</CardTitle>
          <p className="mt-1 text-sm text-fg-muted">
            {otsData.length === 0
              ? 'Nenhuma OT disponível para romaneio no momento.'
              : `${otsData.length} OT(s) disponível(is) para agrupar.`}
          </p>
          <div className="mt-4">
            <RomaneioForm vehicles={vehicles} drivers={drivers} ots={otsData} />
          </div>
        </CardBody>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-fg">Romaneios recentes</h2>
        {manifests.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-sm text-fg-muted">
                Nenhum romaneio criado ainda. Selecione um veículo, um motorista e as OTs acima para começar.
              </p>
            </CardBody>
          </Card>
        ) : (
          <ManifestList
            manifests={manifests.map((m) => ({
              id: m.id,
              code: m.code,
              status: m.status,
              plate: m.vehicle.plate,
              driverName: m.driver.name,
              totalWeightKg: m.totalWeightKg,
              totalVolumeM3: m.totalVolumeM3,
              capacityKg: m.capacityKg,
              capacityM3: m.capacityM3,
              itemsCount: m._count.items,
              departureAt: m.departureAt ? m.departureAt.toISOString() : null,
            }))}
          />
        )}
      </section>
    </div>
  );
}
