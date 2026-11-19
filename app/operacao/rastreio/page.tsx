import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KanbanBoard, type KanbanColumn } from './kanban-board';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Rastreio de OTs em tempo real | TMS JGNEXT',
  description: 'Kanban operacional: coletada → em rota → entregue → ocorrência.',
  openGraph: { title: 'Rastreio de OTs em tempo real', description: 'Kanban operacional do TMS JGNEXT.' },
};

const COLUMNS: { key: string; label: string; statuses: string[] }[] = [
  { key: 'coletada', label: 'Coletada', statuses: ['coletada'] },
  { key: 'em_rota', label: 'Em rota', statuses: ['em_rota', 'em_transito'] },
  { key: 'entregue', label: 'Entregue', statuses: ['entregue'] },
  { key: 'ocorrencia', label: 'Ocorrência', statuses: ['ocorrencia'] },
];

export default async function RastreioPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const role = (session.user as { role?: string }).role ?? 'user';
  if (!['admin', 'operador', 'gestor', 'dono'].includes(role)) redirect('/painel');

  const orders = await prisma.transportOrder.findMany({
    where: { status: { in: COLUMNS.flatMap((c) => c.statuses) } },
    orderBy: { updatedAt: 'desc' },
    take: 200,
    include: {
      client: { select: { name: true } },
      route: { select: { originCity: true, destinationCity: true } },
      occurrences: { where: { status: 'aberta' }, select: { id: true, type: true } },
    },
  });

  const columns: KanbanColumn[] = COLUMNS.map((c) => ({
    key: c.key,
    label: c.label,
    cards: orders
      .filter((o) => c.statuses.includes(o.status))
      .map((o) => ({
        id: o.id,
        code: o.code,
        client: o.client.name,
        route: `${o.route.originCity} → ${o.route.destinationCity}`,
        weightKg: o.weightKg,
        status: o.status,
        hasOccurrence: o.occurrences.length > 0,
      })),
  }));

  const total = orders.length;

  return (
    <div className="min-h-screen bg-bg px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-fg">Rastreio de OTs</h1>
            <p className="text-sm text-fg-muted">
              {total} ordem{total === 1 ? '' : 's'} em operação agora
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/operacao/ot/nova">
              <Button variant="primary" size="md">Nova OT</Button>
            </Link>
            <Link href="/operacao/coletas/solicitacoes">
              <Button variant="secondary" size="md">Solicitações</Button>
            </Link>
          </div>
        </header>

        {total === 0 ? (
          <Card>
            <CardBody>
              <CardTitle>Nenhuma OT em operação</CardTitle>
              <p className="mt-2 text-sm text-fg-muted">
                Assim que uma OT for coletada ou entrar em rota, ela aparece aqui automaticamente.
              </p>
              <div className="mt-4">
                <Link href="/operacao/ot/nova">
                  <Button variant="primary" size="sm">Emitir primeira OT</Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        ) : (
          <KanbanBoard columns={columns} />
        )}
      </div>
    </div>
  );
}
