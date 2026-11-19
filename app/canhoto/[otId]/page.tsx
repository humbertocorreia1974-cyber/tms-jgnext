import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardTitle, CardBody } from "@/components/ui/card";
import { CanhotoForm } from "./canhoto-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Canhoto Digital — TMS JGNEXT",
  description:
    "Registre a entrega com assinatura em tela, foto do comprovante e geolocalização. Canhoto digital válido e auditável.",
  openGraph: {
    title: "Canhoto Digital — TMS JGNEXT",
    description:
      "Assinatura em tela, foto e geolocalização para comprovar a entrega sem papel.",
  },
};

export default async function Page({
  params,
}: {
  params: Promise<{ otId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { otId } = await params;
  const ot = await prisma.transportOrder.findUnique({
    where: { id: otId },
    include: {
      client: { select: { name: true } },
      route: { select: { originCity: true, destinationCity: true, originState: true, destinationState: true } },
      deliveryReceipt: true,
    },
  });
  if (!ot) notFound();

  const jaEntregue = Boolean(ot.deliveryReceipt);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-fg-muted">Canhoto Digital</p>
          <h1 className="text-2xl font-semibold text-fg">OT {ot.code}</h1>
        </div>
        <Link
          href="/operacao/rastreio"
          className="rounded-md border border-border px-3 py-1.5 text-sm text-fg-muted transition-all duration-150 hover:bg-white/5 hover:text-fg"
        >
          Voltar ao rastreio
        </Link>
      </div>

      <Card className="mb-6">
        <CardTitle>Dados da entrega</CardTitle>
        <CardBody>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-fg-muted">Cliente</dt>
              <dd className="text-fg">{ot.client.name}</dd>
            </div>
            <div>
              <dt className="text-fg-muted">Rota</dt>
              <dd className="text-fg">
                {ot.route.originCity}/{ot.route.originState} → {ot.route.destinationCity}/{ot.route.destinationState}
              </dd>
            </div>
            <div>
              <dt className="text-fg-muted">Destino</dt>
              <dd className="text-fg">
                {ot.destinationAddress}, {ot.destinationCity}/{ot.destinationState}
              </dd>
            </div>
            <div>
              <dt className="text-fg-muted">Carga</dt>
              <dd className="text-fg">
                {ot.cargoDescription} · {ot.weightKg.toFixed(1)} kg
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      {jaEntregue ? (
        <Card>
          <CardTitle>Canhoto já registrado</CardTitle>
          <CardBody>
            <p className="text-sm text-fg-muted">
              Recebedor: <span className="text-fg">{ot.deliveryReceipt?.receiverName}</span>
            </p>
            <p className="mt-1 text-sm text-fg-muted">
              Entregue em{" "}
              <span className="text-fg">
                {ot.deliveryReceipt?.deliveredAt.toLocaleString("pt-BR")}
              </span>
            </p>
            {ot.deliveryReceipt?.signatureUrl?.startsWith("data:image") && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ot.deliveryReceipt.signatureUrl}
                alt="Assinatura do recebedor"
                className="mt-4 h-32 w-full rounded-md border border-border bg-white object-contain"
              />
            )}
          </CardBody>
        </Card>
      ) : (
        <CanhotoForm
          transportOrderId={ot.id}
          otCode={ot.code}
          defaultReceiver={ot.client.name}
        />
      )}
    </main>
  );
}
