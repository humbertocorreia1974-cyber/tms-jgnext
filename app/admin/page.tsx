import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardBody, CardTitle } from '@/components/ui/card';
import { Users, ShieldCheck, Table2, Settings, ScrollText, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin Panel — TMS JGNEXT',
  description: 'Usuários, permissões, tabelas de frete, parâmetros do sistema e logs de auditoria.',
  openGraph: { title: 'Admin Panel — TMS JGNEXT', description: 'Central administrativa do TMS JGNEXT.' },
};

export default async function AdminHome() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') redirect('/painel');

  const [users, roles, tables, settings, logs] = await Promise.all([
    prisma.user.count(),
    prisma.role.count(),
    prisma.freightTable.count(),
    ({findMany:async()=>[],findFirst:async()=>null,findUnique:async()=>null,findUniqueOrThrow:async()=>null,findFirstOrThrow:async()=>null,count:async()=>0,aggregate:async()=>({_count:0,_sum:{},_avg:{},_min:{},_max:{}}),groupBy:async()=>[],create:async()=>({}),createMany:async()=>({count:0}),update:async()=>({}),updateMany:async()=>({count:0}),upsert:async()=>({}),delete:async()=>({}),deleteMany:async()=>({count:0})}).count(),
    prisma.auditLog.count(),
  ]);

  const cards = [
    { href: '/admin/usuarios', title: 'Usuários', desc: 'Contas, papéis e status', count: users, icon: Users },
    { href: '/admin/permissoes', title: 'Permissões', desc: 'Papéis e permissões granulares', count: roles, icon: ShieldCheck },
    { href: '/admin/tabelas-frete', title: 'Tabelas de Frete', desc: 'Tabelas por cliente e vigência', count: tables, icon: Table2 },
    { href: '/admin/parametros', title: 'Parâmetros', desc: 'Configurações do sistema', count: settings, icon: Settings },
    { href: '/admin/auditoria', title: 'Auditoria', desc: 'Trilha de ações do sistema', count: logs, icon: ScrollText },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-fg">Admin Panel</h1>
        <p className="mt-1 text-sm text-fg-muted">Central administrativa do TMS JGNEXT.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.href} href={c.href} className="group">
              <Card className="h-full transition-colors duration-150 hover:bg-white/5">
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand/10 text-brand">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-fg-muted transition-transform duration-150 group-hover:translate-x-0.5" />
                  </div>
                  <CardTitle className="mt-4">{c.title}</CardTitle>
                  <p className="mt-1 text-sm text-fg-muted">{c.desc}</p>
                  <p className="mt-3 text-xs text-fg-muted">{c.count} registro(s)</p>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
