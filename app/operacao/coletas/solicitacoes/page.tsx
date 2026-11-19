import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { CollectionActions } from './collection-actions-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Fila de Solicitações de Coleta | TMS JGNEXT',
  description: 'Aprove ou rejeite solicitações de coleta abertas pelo portal do cliente.',
  openGraph: { title: 'Fila de Solicitações de Coleta | TMS JGNEXT', description: 'Aprovação operacional de coletas.' },
};

export default async function Page({ searchParams }: { searchParams: { status?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const role = (session.user as any).role as string;
  if (!['admin', 'operador', 'dono'].includes(role)) redirect('/painel');

  const status = searchParams.status ?? 'pendente';
  const requests = await prisma.collectionRequest.findMany({
    where: status === 'todas' ? {} : { status },
    include: { client: { select: { id: true, name: true, document: true } } },
    orderBy: { requestedAt: 'desc' },
    take: 100,
  });

  const counts = await prisma.collectionRequest.groupBy({ by: ['status'], _count: { _all: true } });
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));

  const tabs = [
    { key: 'pendente', label: 'Pendentes' },
    { key: 'aprovada', label: 'Aprovadas' },
    { key: 'rejeitada', label: 'Rejeitadas' },
    { key: 'todas', label: 'Todas' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Fila de Solicitações de Coleta</h1>
          <p className="text-sm text-fg-muted">Aprove para gerar OT automaticamente ou rejeite com motivo.</p>
        </div>
        <Link href="/operacao/coletas" className="text-sm text-brand hover:opacity-80 transition-all duration-150">
          ← Coletas
        </Link>
      </header>

      <nav className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = status === t.key;
          const n = t.key === 'todas' ? Object.values(countMap).reduce((a, b) => a + b, 0) : countMap[t.key] ?? 0;
          return (
            <Link
              key={t.key}
              href={`/operacao/coletas/solicitacoes?status=${t.key}`}
              className={`rounded-md border px-3 py-1.5 text-sm transition-all duration-150 ${
                active ? 'border-brand bg-brand/10 text-brand' : 'border-border text-fg-muted hover:bg-white/5'
              }`}
            >
              {t.label} <span className="ml-1 text-xs opacity-70">({n})</span>
            </Link>
          );
        })}
      </nav>

      {requests.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-sm text-fg-muted">Nenhuma solicitação {status !== 'todas` ? `com status "${status}"` : `'} no momento.</p>
            <Link href="/operacao/coletas/solicitacoes?status=todas" className="mt-3 inline-block text-sm text-brand hover:opacity-80">
              Ver todas as solicitações →
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id}>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{r.client.name}</CardTitle>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        r.status === 'pendente' ? 'bg-accent/10 text-accent' :
                        r.status === 'aprovada' ? 'bg-brand/10 text-brand' :
                        'bg-red-500/10 text-red-400'
                      }`}>{r.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-fg-muted">CNPJ {r.client.document} · solicitado em {new Date(r.requestedAt).toLocaleString('pt-BR')}</p>
                    <div className="mt-3 grid gap-2 text-sm text-fg sm:grid-cols-2">
                      <div>
                        <span className="text-fg-muted">Origem:</span> {r.originCity}/{r.originState}
                        <div className="text-xs text-fg-muted">{r.originAddress}</div>
                      </div>
                      <div>
                        <span className="text-fg-muted">Destino:</span> {r.destinationCity}/{r.destinationState}
                        <div className="text-xs text-fg-muted">{r.destinationAddress}</div>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-fg">
                      <span className="text-fg-muted">Carga:</span> {r.cargoDescription} · {r.weightKg} kg
                      {r.volumeM3 ? ` · ${r.volumeM3} m³` : '`}{r.packages ? ` · ${r.packages} vol.` : `'}
                    </p>
                    {r.rejectionReason && (
                      <p className="mt-2 text-xs text-red-400">Motivo da rejeição: {r.rejectionReason}</p>
                    )}
                  </div>
                  {r.status === 'pendente' && <CollectionActions id={r.id} />}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
