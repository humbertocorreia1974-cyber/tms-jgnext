import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "./sign-out-button";
import { UpgradeButton } from "./upgrade-button";
import { Card, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Dashboard · TMS JGNEXT", description: "ERP logístico completo com TMS embutido: emissão de OT, romaneio inteligente, rastreio em tempo real, canhoto digital, portal do cliente, app do motorista ", openGraph: { title: "Dashboard · TMS JGNEXT", description: "ERP logístico completo com TMS embutido: emissão de OT, romaneio inteligente, rastreio em tempo real, canhoto digital, portal do cliente, app do motorista " } };



export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { projects: true },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Olá, {user?.name ?? user?.email}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            Plano atual: <span className="text-fg">{user?.plan}</span>
          </p>
        </div>
        <SignOutButton />
      </div>

      <Card className="mt-10">
        <CardTitle className="text-base">Seus projetos</CardTitle>
        {user && user.projects.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {user.projects.map((p) => (
              <li key={p.id} className="text-sm text-fg">
                {p.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-fg-muted">Nenhum projeto ainda.</p>
        )}
      </Card>

      <Card className="mt-6">
        <CardTitle className="text-base">Plano Pro</CardTitle>
        <p className="mt-1 text-sm text-fg-muted">
          Projetos ilimitados e suporte prioritário.
        </p>
        <div className="mt-4">
          <UpgradeButton />
        </div>
      </Card>
    </main>
  );
}
