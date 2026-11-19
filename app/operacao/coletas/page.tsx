import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardBody, CardTitle } from '@/components/ui/card';
import { CollectionActions } from './collection-actions-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Fila de Solicitações de Coleta | TMS JGNEXT',
  description:
    'Aprove ou rejeite solicitações de coleta abertas pelo portal do cliente antes de emitir a OT.',
  openGraph: {
    title: 'Fila de Solicitações de Coleta | TMS JGNEXT',
    description: 'Fila operacional de aprovação de coletas solicitadas pelos embarcadores.',
  },
};

export default async function ColetasPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  if (!['admin', 'gestor', 'operador'].includes(session.user.role)) redirect('/');

  const requests = await prisma.collectionRequest.findMany({
    where: { status: 'pendente' },
    orderBy: { requestedAt: 'asc' },
    include: { client: { select: { name: true, document: true } } },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-fg-muted">Operação</p>
          <h1 className="mt-1 text-3xl font-bold text-fg">Fila de solicitações de coleta</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {requests.length} solicitação(ões) pendente(s) aguardando aprovação.
          </p>
        </div>
        <Link href="/operacao/ot/nova" className="text-sm text-brand hover:underline">
          Emitir OT manual →
        </Link>
      </header>

      {requests.length === 0 ? (
        <Card>
          <CardBody>
            <div className="rounded-md border border-dashed border-border p-10 text-center">
              <p className="text-sm text-fg-muted">Nenhuma solicitação pendente no momento.</p>
              <p className="mt-1 text-xs text-fg-muted">
                Novas solicitações abertas pelo portal do cliente aparecem aqui automaticamente.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <Card key={r.id}>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{r.client.name}</CardTitle>
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                        pendente
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-fg-muted">CNPJ {r.client.document}</p>
                    <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-fg-muted">Origem</dt>
                        <dd className="text-fg">
                          {r.originAddress} — {r.originCity}/{r.originState}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-fg-muted">Destino</dt>
                        <dd className="text-fg">
                          {r.destinationAddress} — {r.destinationCity}/{r.destinationState}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-fg-muted">Carga</dt>
                        <dd className="text-fg">{r.cargoDescription}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-fg-muted">Peso / Volume</dt>
                        <dd className="text-fg">
                          {r.weightKg} kg{r.volumeM3 ? ` · ${r.volumeM3} m³` : ''}
                          {r.packages ? ` · ${r.packages} volumes` : ''}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <CollectionActions id={r.id} />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
