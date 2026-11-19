import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OccurrenceList, type OccurrenceRow } from './occurrence-list';
import { NewOccurrenceForm } from './new-occurrence-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Ocorrências | TMS JGNEXT',
  description: 'Registro, upload de foto e fluxo de reagendamento de ocorrências logísticas.',
  openGraph: { title: 'Ocorrências', description: 'Gestão de ocorrências com foto e reagendamento.' },
};

export default async function OcorrenciasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const role = (session.user as { role?: string }).role ?? 'user';
  if (!['admin', 'operador', 'gestor', 'dono'].includes(role)) redirect('/painel');

  const sp = await searchParams;
  const statusFilter = sp.status && ['aberta', 'reagendada', 'resolvida'].includes(sp.status) ? sp.status : undefined;

  const [occurrences, openOrders] = await Promise.all([
    prisma.occurrence.findMany({
      where: statusFilter ? { status: statusFilter } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        transportOrder: { select: { code: true, client: { select: { name: true } } } },
        registeredBy: { select: { name: true } },
      },
    }),
    prisma.transportOrder.findMany({
      where: { status: { in: ['coletada', 'em_rota', 'em_transito', 'emitida'] } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, code: true, client: { select: { name: true } } },
    }),
  ]);

  const rows: OccurrenceRow[] = occurrences.map((o) => ({
    id: o.id,
    type: o.type,
    description: o.description,
    photoUrl: o.photoUrl,
    status: o.status,
    rescheduledFor: o.rescheduledFor ? o.rescheduledFor.toISOString() : null,
    createdAt: o.createdAt.toISOString(),
    orderCode: o.transportOrder.code,
    clientName: o.transportOrder.client.name,
    registeredBy: o.registeredBy?.name ?? null,
  }));

  const filters = [
    { key: '', label: 'Todas' },
    { key: 'aberta', label: 'Abertas' },
    { key: 'reagendada', label: 'Reagendadas' },
    { key: 'resolvida', label: 'Resolvidas' },
  ];

  return (
    <div className="min-h-screen bg-bg px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-fg">Ocorrências</h1>
            <p className="text-sm text-fg-muted">Registre, anexe foto e reagende entregas com problema.</p>
          </div>
          <Link href="/operacao/rastreio">
            <Button variant="secondary" size="md">Ver rastreio</Button>
          </Link>
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          {filters.map((f) => {
            const active = (statusFilter ?? '') === f.key;
            return (
              <Link
                key={f.key || 'all'}
                href={f.key ? `/operacao/ocorrencias?status=${f.key}` : '/operacao/ocorrencias'}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors duration-150 ${
                  active
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-border text-fg-muted hover:bg-white/5 hover:text-fg'
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            {rows.length === 0 ? (
              <Card>
                <CardBody>
                  <CardTitle>Nenhuma ocorrência {statusFilter ? `com status "${statusFilter}"` : ''}</CardTitle>
                  <p className="mt-2 text-sm text-fg-muted">
                    Use o formulário ao lado para registrar a primeira ocorrência de uma OT em operação.
                  </p>
                </CardBody>
              </Card>
            ) : (
              <OccurrenceList rows={rows} />
            )}
          </div>

          <aside>
            <NewOccurrenceForm orders={openOrders.map((o) => ({ id: o.id, label: `${o.code} — ${o.client.name}` }))} />
          </aside>
        </div>
      </div>
    </div>
  );
}
