import { NextResponse } from 'next/server';
import { ensureStarted, getQrCodeDataUrl, getConnectionStatus } from '@/lib/whatsapp-baileys';

export const dynamic = 'force-dynamic';

export async function GET() {
  ensureStarted().catch(() => {});
  const qr = await getQrCodeDataUrl();
  return NextResponse.json({ status: getConnectionStatus(), qr });
}
