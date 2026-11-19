import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardBody, CardTitle } from '@/components/ui/card';
import RoleForm from './role-form';
import RoleRowActions from './role-row-actions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Permissões — Admin TMS JGNEXT',
  description: 'Papéis e permissões granulares do TMS JGNEXT.',
  openGraph: { title: 'Permissões — Admin TMS JGNEXT', description: 'Gestão de papéis.' },
};

export default async function AdminRolesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') redirect('/painel');

  const roles = await prisma.role.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { clientUsers: true } } },
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Permissões</h1>
          <p className="mt-1 text-sm text-fg-muted">{roles.length} papel(éis) cadastrado(s).</p>
        </div>
        <Link href="/admin" className="text-sm text-brand hover:underline">← Admin</Link>
      </div>

      <Card className="mb-6">
        <CardBody>
          <CardTitle className="mb-3">Novo papel</CardTitle>
          <RoleForm />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {roles.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-fg-muted">Nenhum papel cadastrado. Crie o primeiro acima.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs uppercase text-fg-muted">
                  <tr>
                    <th className="px-4 py-3">Papel</th>
                    <th className="px-4 py-3">Descrição</th>
                    <th className="px-4 py-3">Permissões</th>
                    <th className="px-4 py-3">Usuários</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((r) => {
                    const perms = Array.isArray(r.permissions) ? (r.permissions as string[]) : [];
                    return (
                      <tr key={r.id} className="border-b border-border/60 last:border-0">
                        <td className="px-4 py-3 text-fg">
                          {r.name}
                          {r.isSystem && <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] text-brand">system</span>}
                        </td>
                        <td className="px-4 py-3 text-fg-muted">{r.description ?? '—'}</td>
                        <td className="px-4 py-3 text-fg-muted">{perms.length} permissão(ões)</td>
                        <td className="px-4 py-3 text-fg-muted">{r._count.clientUsers}</td>
                        <td className="px-4 py-3 text-right">
                          <RoleRowActions id={r.id} name={r.name} isSystem={r.isSystem} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
