'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Send, CheckCircle2 } from 'lucide-react';

export default function InvoiceActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(action: 'send' | 'pay') {
    setBusy(action);
    const res = await fetch(`/api/invoices/${id}/${action}`, { method: 'POST' });
    setBusy(null);
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <a
        href={`/api/invoices/${id}/pdf`}
        target="_blank"
        rel="noreferrer"
        className="rounded-md border border-border p-1.5 text-fg-muted transition-colors duration-150 hover:bg-white/5 hover:text-fg"
        title="Baixar PDF/DANFE"
      >
        <Download className="h-4 w-4" />
      </a>
      {status !== 'paga' && (
        <>
          <button
            onClick={() => act('send')}
            disabled={busy === 'send'}
            className="rounded-md border border-border p-1.5 text-fg-muted transition-colors duration-150 hover:bg-white/5 hover:text-fg disabled:opacity-50"
            title="Enviar por e-mail"
          >
            <Send className="h-4 w-4" />
          </button>
          <button
            onClick={() => act('pay')}
            disabled={busy === 'pay'}
            className="rounded-md border border-border p-1.5 text-emerald-500 transition-colors duration-150 hover:bg-emerald-500/10 disabled:opacity-50"
            title="Marcar como paga"
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
