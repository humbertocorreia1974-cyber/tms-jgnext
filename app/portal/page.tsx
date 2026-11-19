import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, FileText, Truck, MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Portal do Cliente | TMS JGNEXT',
  description: 'Abra solicitações de coleta, rastreie suas cargas e baixe canhotos e faturas.',
  openGraph: { title: 'Portal do Cliente | TMS JGNEXT', description: 'Rastreie cargas, abra coletas e baixe documentos.' },
};

export default async function PortalClientePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const links = await prisma.clientUser.findMany({
    where: { userId: session.user.id },
    include: { client: true },
  });

  if (links.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Card>
          <CardBody>
            <h1 className="text-xl font-semibold text-fg">Portal do Cliente</h1>
            <p className="mt-2 text-sm text-fg-muted">
              Sua conta ainda não está vinculada a um embarcador. Peça ao operador da transportadora para vincular seu usuário.
            </p>
            <div className="mt-4">
              <Link href="/painel"><Button variant="secondary" size="sm">Voltar ao painel</Button></Link>
            </div>
          </CardBody>
        </Card>
      </main>
    );
  }

  const clientIds = links.map((l) => l.clientId);

  const [ots, invoices, coletas] = await Promise.all([
    prisma.transportOrder.findMany({
      where: { clientId: { in: clientIds } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { route: true, deliveryReceipt: true },
    }),
    prisma.invoice.findMany({
      where: { clientId: { in: clientIds } },
      orderBy: { issueDate: 'desc' },
      take: 8,
    }),
    prisma.collectionRequest.findMany({
      where: { clientId: { in: clientIds } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ]);

  const totalFrete = ots.reduce((s, o) => s + o.freightTotalValue, 0);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-fg-muted">Portal do Cliente</p>
          <h1 className="text-2xl font-semibold text-fg">{links[0].client.name}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {ots.length} ordens recentes · R$ {totalFrete.toFixed(2)} em fretes
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/portal/coletas/nova"><Button size="sm">Abrir coleta</Button></Link>
          <Link href="/portal/rastreio"><Button variant="secondary" size="sm">Rastrear carga</Button></Link>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <div className="mb-4 flex items-center gap-2">
              <Truck className="h-4 w-4 text-brand" />
              <CardTitle>Ordens de Transporte recentes</CardTitle>
            </div>
            {ots.length === 0 ? (
              <p className="text-sm text-fg-muted">Nenhuma OT emitida ainda. Abra uma coleta para começar.</p>
            ) : (
              <ul className="divide-y divide-border">
                {ots.map((ot) => (
                  <li key={ot.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-fg">{ot.code}</p>
                      <p className="text-xs text-fg-muted">
                        {ot.route.originCity}/{ot.route.originState} → {ot.route.destinationCity}/{ot.route.destinationState}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">{ot.status}</span>
                      {ot.deliveryReceipt && (
                        <a
                          href={`/api/portal/delivery-receipts/${ot.deliveryReceipt.id}`}
                          className="text-xs text-brand underline-offset-2 hover:underline"
                        >
                          Canhoto
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand" />
              <CardTitle>Faturas</CardTitle>
            </div>
            {invoices.length === 0 ? (
              <p className="text-sm text-fg-muted">Nenhuma fatura emitida.</p>
            ) : (
              <ul className="divide-y divide-border">
                {invoices.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-fg">#{inv.number}</p>
                      <p className="text-xs text-fg-muted">
                        Vence {new Date(inv.dueDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-fg">R$ {inv.total.toFixed(2)}</span>
                      <a
                        href={`/api/invoices/${inv.id}/pdf`}
                        className="text-xs text-brand underline-offset-2 hover:underline"
                      >
                        PDF
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardBody>
            <div className="mb-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-brand" />
              <CardTitle>Solicitações de coleta</CardTitle>
            </div>
            {coletas.length === 0 ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-fg-muted">Você ainda não abriu nenhuma coleta.</p>
                <Link href="/portal/coletas/nova"><Button size="sm">Abrir primeira coleta</Button></Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-fg-muted">
                  <tr>
                    <th className="py-2">Origem</th>
                    <th className="py-2">Destino</th>
                    <th className="py-2">Peso</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Solicitada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {coletas.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2 text-fg">{c.originCity}/{c.originState}</td>
                      <td className="py-2 text-fg">{c.destinationCity}/{c.destinationState}</td>
                      <td className="py-2 text-fg-muted">{c.weightKg} kg</td>
                      <td className="py-2">
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">{c.status}</span>
                      </td>
                      <td className="py-2 text-fg-muted">{new Date(c.requestedAt).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-fg-muted">
        <MapPin className="h-3 w-3" />
        Rastreio em tempo real disponível em <Link href="/portal/rastreio" className="text-brand hover:underline">/portal/rastreio</Link>
      </div>
    </main>
  );
}
