import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardBody, CardTitle } from '@/components/ui/card';
import { OTForm } from './ot-form-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Emitir Ordem de Transporte | TMS JGNEXT',
  description: 'Emissão de OT com cálculo automático de frete: rota, faixa de peso, cubagem, GRIS, TDE e pedágio.',
  openGraph: { title: 'Emitir OT | TMS JGNEXT', description: 'Cálculo automático de frete por rota e faixa de peso.' },
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const role = (session.user as any).role as string;
  if (!['admin', 'operador', 'dono'].includes(role)) redirect('/painel');

  const [clients, routes] = await Promise.all([
    prisma.client.findMany({ where: { isActive: true }, select: { id: true, name: true, document: true }, orderBy: { name: 'asc' } }),
    prisma.route.findMany({
      where: { isActive: true },
      select: { id: true, originCity: true, originState: true, destinationCity: true, destinationState: true, distanceKm: true },
      orderBy: [{ originState: 'asc' }, { originCity: 'asc' }],
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Emitir Ordem de Transporte</h1>
          <p className="text-sm text-fg-muted">O frete é calculado automaticamente pela tabela do cliente (rota + faixa de peso + cubagem + GRIS/TDE/pedágio).</p>
        </div>
        <Link href="/operacao/ot" className="text-sm text-brand hover:opacity-80 transition-all duration-150">← OTs</Link>
      </header>

      {clients.length === 0 || routes.length === 0 ? (
        <Card>
          <CardBody>
            <CardTitle>Cadastros incompletos</CardTitle>
            <p className="mt-2 text-sm text-fg-muted">
              {clients.length === 0 && 'Nenhum cliente cadastrado. '}
              {routes.length === 0 && 'Nenhuma rota cadastrada. '}
              Cadastre antes de emitir uma OT.
            </p>
            <div className="mt-3 flex gap-3 text-sm">
              <Link href="/cadastros/clientes" className="text-brand hover:opacity-80">Clientes →</Link>
              <Link href="/cadastros/rotas" className="text-brand hover:opacity-80">Rotas →</Link>
            </div>
          </CardBody>
        </Card>
      ) : (
        <OTForm clients={clients} routes={routes} />
      )}
    </div>
  );
}
