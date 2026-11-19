import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/lib/whatsapp-baileys';

export const dynamic = 'force-dynamic';

function hasValidInternalToken(request: Request): boolean {
  const expected = process.env.INTERNAL_API_TOKEN;
  if (!expected) return false;
  const provided = request.headers.get('x-internal-token') || '';
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// Rota INTERNA - a lógica do app (ex: pedido ficou pronto) chama isso pra
// notificar o cliente final via WhatsApp.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'admin';
  if (!isAdmin && !hasValidInternalToken(request)) {
    return NextResponse.json({ error: 'nao autorizado' }, { status: 401 });
  }
  const { to, message } = await request.json();
  if (!to || !message) {
    return NextResponse.json({ error: 'to e message são obrigatórios.' }, { status: 400 });
  }
  try {
    await sendWhatsAppMessage(to, message);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 502 });
  }
}
