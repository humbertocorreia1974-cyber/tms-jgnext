import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {};
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { ok: true };
  } catch (e: any) {
    checks.database = { ok: false, detail: e?.message ?? "erro" };
  }
  checks.whatsapp = {
    ok: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
    detail: process.env.WHATSAPP_ACCESS_TOKEN ? "credenciais presentes" : "credenciais ausentes",
  };
  checks.email = {
    ok: Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST),
    detail: process.env.RESEND_API_KEY ? "resend" : process.env.SMTP_HOST ? "smtp" : "não configurado",
  };
  const allOk = Object.values(checks).every((c) => c.ok);
  return NextResponse.json({ ok: allOk, checks, ts: new Date().toISOString() }, { status: allOk ? 200 : 503 });
}
