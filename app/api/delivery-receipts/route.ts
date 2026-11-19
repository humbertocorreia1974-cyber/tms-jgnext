import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!["admin","master","owner","superadmin"].includes((session?.user as any)?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const {
    transportOrderId,
    receiverName,
    receiverDocument,
    signatureDataUrl,
    photoDataUrl,
    latitude,
    longitude,
    notes,
  } = body ?? {};

  if (!transportOrderId || !receiverName || !signatureDataUrl) {
    return NextResponse.json(
      { error: "OT, nome do recebedor e assinatura são obrigatórios" },
      { status: 400 }
    );
  }

  const ot = await prisma.transportOrder.findUnique({
    where: { id: transportOrderId },
    include: { deliveryReceipt: true },
  });
  if (!ot) {
    return NextResponse.json({ error: "OT não encontrada" }, { status: 404 });
  }
  if (ot.deliveryReceipt) {
    return NextResponse.json(
      { error: "Esta OT já possui canhoto registrado" },
      { status: 409 }
    );
  }

  const receipt = await prisma.deliveryReceipt.create({
    data: {
      transportOrderId,
      receiverName,
      receiverDocument: receiverDocument || null,
      signatureUrl: signatureDataUrl,
      photoUrl: photoDataUrl || null,
      latitude: typeof latitude === "number" ? latitude : null,
      longitude: typeof longitude === "number" ? longitude : null,
      notes: notes || null,
      deliveredAt: new Date(),
    },
  });

  await prisma.transportOrder.update({
    where: { id: transportOrderId },
    data: { status: "entregue", deliveredAt: new Date() },
  });

  await prisma.oTEvent.create({
    data: {
      transportOrderId,
      type: "entrega",
      description: `Canhoto registrado por ${receiverName}`,
      latitude: typeof latitude === "number" ? latitude : null,
      longitude: typeof longitude === "number" ? longitude : null,
      registeredById: session.user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "create",
      entity: "DeliveryReceipt",
      entityId: receipt.id,
      after: { transportOrderId, receiverName },
    },
  });

  return NextResponse.json({ ok: true, receipt });
}
