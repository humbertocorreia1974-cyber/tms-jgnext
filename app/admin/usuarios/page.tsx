import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardBody, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import UserCreateForm from './user-create-form';
import UserRowActions from './user-row-actions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Usuários — Admin TMS JGNEXT',
  description: 'Gerencie contas, papéis e status dos usuários do TMS JGNEXT.',
  openGraph: { title: 'Usuários — Admin TMS JGNEXT', description: 'Gestão de usuários.' },
};

type SP = { q?: string; role?: string };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') redirect('/painel');

  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const role = (sp.role ?? '').trim();

  const users = await prisma.user.findMany({
    where: {
      ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] } : {}),
      ...(role ? { role } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: { id: true, name: true, email: true, role: true, plan: true, createdAt: true, termsAcceptedAt: true },
  });

  const roles = ['admin', 'operador', 'motorista', 'cliente', 'dono', 'user'];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Usuários</h1>
          <p className="mt-1 text-sm text-fg-muted">{users.length} conta(s) listada(s).</p>
        </div>
        <Link href="/admin" className="text-sm text-brand hover:underline">← Admin</Link>
      </div>

      <Card className="mb-6">
        <CardBody>
          <form className="grid gap-3 sm:grid-cols-[1fr_200px_auto]">
            <Input name="q" placeholder="Buscar por nome ou e-mail" defaultValue={q} />
            <select
              name="role"
              defaultValue={role}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
            >
              <option value="">Todos os papéis</option>
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <Button type="submit" variant="primary">Filtrar</Button>
          </form>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardBody>
          <CardTitle className="mb-3">Novo usuário</CardTitle>
          <UserCreateForm />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {users.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-fg-muted">Nenhum usuário encontrado com esses filtros.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs uppercase text-fg-muted">
                  <tr>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">E-mail</th>
                    <th className="px-4 py-3">Papel</th>
                    <th className="px-4 py-3">Plano</th>
                    <th className="px-4 py-3">Criado</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3 text-fg">{u.name}</td>
                      <td className="px-4 py-3 text-fg-muted">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-fg-muted">{u.plan}</td>
                      <td className="px-4 py-3 text-fg-muted">{u.createdAt.toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right">
                        <UserRowActions id={u.id} role={u.role} name={u.name} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
