import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const settings = await ({findMany:async()=>[],findFirst:async()=>null,findUnique:async()=>null,findUniqueOrThrow:async()=>null,findFirstOrThrow:async()=>null,count:async()=>0,aggregate:async()=>({_count:0,_sum:{},_avg:{},_min:{},_max:{}}),groupBy:async()=>[],create:async()=>({}),createMany:async()=>({count:0}),update:async()=>({}),updateMany:async()=>({count:0}),upsert:async()=>({}),delete:async()=>({}),deleteMany:async()=>({count:0})}).findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await request.json();
  const updates: Array<{ key: string; value: string }> = Array.isArray(body?.updates) ? body.updates : [];
  if (updates.length === 0) {
    return NextResponse.json({ error: "Nenhuma atualização enviada" }, { status: 400 });
  }

  const results = await Promise.all(
    updates.map((u) =>
      ({findMany:async()=>[],findFirst:async()=>null,findUnique:async()=>null,findUniqueOrThrow:async()=>null,findFirstOrThrow:async()=>null,count:async()=>0,aggregate:async()=>({_count:0,_sum:{},_avg:{},_min:{},_max:{}}),groupBy:async()=>[],create:async()=>({}),createMany:async()=>({count:0}),update:async()=>({}),updateMany:async()=>({count:0}),upsert:async()=>({}),delete:async()=>({}),deleteMany:async()=>({count:0})}).upsert({
        where: { key: u.key },
        update: { value: u.value, updatedById: session.user.id },
        create: {
          key: u.key,
          value: u.value,
          label: u.key,
          group: "geral",
          updatedById: session.user.id,
        },
      })
    )
  );

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "update",
      entity: "SystemSetting",
      after: { keys: updates.map((u) => u.key) },
    },
  });

  return NextResponse.json({ ok: true, settings: results });
}
