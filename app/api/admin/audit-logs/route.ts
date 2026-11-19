import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const url = new URL(request.url);
  const entity = url.searchParams.get("entity") || undefined;
  const userId = url.searchParams.get("userId") || undefined;
  const take = Math.min(Number(url.searchParams.get("take") || 100), 500);

  const logs = await prisma.auditLog.findMany({
    where: { ...(entity ? { entity } : {}), ...(userId ? { userId } : {}) },
    orderBy: { createdAt: "desc" },
    take,
    include: { user: { select: { name: true, email: true } } },
  });
  return NextResponse.json({ logs });
}
