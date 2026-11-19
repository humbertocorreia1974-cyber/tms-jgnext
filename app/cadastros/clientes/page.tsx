import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClientForm } from './client-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Clientes / Embarcadores | TMS JGNEXT',
  description: 'Cadastro de embarcadores com tabela de frete por rota e faixa de peso.',
  openGraph: {
    title: 'Clientes / Embarcadores | TMS JGNEXT',
    description: 'Cadastro de embarcadores com tabela de frete por rota e faixa de peso.',
  },
};

export default async function ClientesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  if (!['admin', 'operador', 'dono'].includes(session.user.role ?? '')) redirect('/painel');

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { freightTables: true, transportOrders: true, collectionRequests: true } },
    },
    take: 100,
  });

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-fg-muted">Cadastros</p>
            <h1 className="text-3xl font-bold">Clientes / Embarcadores</h1>
            <p className="mt-1 text-sm text-fg-muted">
              {clients.length} cliente{clients.length === 1 ? '' : 's'} cadastrado{clients.length === 1 ? '' : 's'}
            </p>
          </div>
          <Link href="/cadastros/clientes/tabelas">
            <Button variant="secondary" size="md">Tabelas de frete</Button>
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardTitle>Lista de clientes</CardTitle>
            <CardBody>
              {clients.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <p className="text-sm text-fg-muted">Nenhum cliente cadastrado ainda.</p>
                  <p className="mt-1 text-xs text-fg-muted">Use o formulário ao lado para cadastrar o primeiro embarcador.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-fg-muted">
                        <th className="py-2 pr-3">Razão social</th>
                        <th className="py-2 pr-3">CNPJ</th>
                        <th className="py-2 pr-3">Cidade/UF</th>
                        <th className="py-2 pr-3 text-right">Tabelas</th>
                        <th className="py-2 pr-3 text-right">OTs</th>
                        <th className="py-2 pr-3 text-right">Score</th>
                        <th className="py-2 pr-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((c) => (
                        <tr key={c.id} className="border-b border-border/60 transition-colors duration-150 hover:bg-white/5">
                          <td className="py-3 pr-3">
                            <Link href={`/cadastros/clientes/${c.id}`} className="font-medium text-brand hover:underline">
                              {c.name}
                            </Link>
                            {c.tradeName && <p className="text-xs text-fg-muted">{c.tradeName}</p>}
                          </td>
                          <td className="py-3 pr-3 font-mono text-xs">{c.document}</td>
                          <td className="py-3 pr-3 text-fg-muted">
                            {c.city ?? '—`}{c.state ? `/${c.state}` : `'}
                          </td>
                          <td className="py-3 pr-3 text-right">{c._count.freightTables}</td>
                          <td className="py-3 pr-3 text-right">{c._count.transportOrders}</td>
                          <td className="py-3 pr-3 text-right font-mono">{c.score.toFixed(0)}</td>
                          <td className="py-3 pr-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs ${c.isActive ? 'bg-brand/10 text-brand' : 'bg-fg-muted/10 text-fg-muted'}`}>
                              {c.isActive ? 'ativo' : 'inativo'}
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

          <ClientForm />
        </div>
      </div>
    </div>
  );
}
