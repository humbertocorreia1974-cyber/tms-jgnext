import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardBody, CardTitle } from '@/components/ui/card';
import NovaColetaForm from './nova-coleta-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Abrir coleta | Portal do Cliente',
  description: 'Solicite uma nova coleta informando origem, destino e dados da carga.',
};

export default async function NovaColetaPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const links = await prisma.clientUser.findMany({
    where: { userId: session.user.id },
    include: { client: true },
  });

  if (links.length === 0) redirect('/portal');

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Card>
        <CardBody>
          <CardTitle>Abrir solicitação de coleta</CardTitle>
          <p className="mt-1 mb-6 text-sm text-fg-muted">
            Preencha os dados da carga. O operador da transportadora irá aprovar e emitir a OT.
          </p>
          <NovaColetaForm
            clientId={links[0].clientId}
            clientName={links[0].client.name}
          />
        </CardBody>
      </Card>
    </main>
  );
}
