'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

type Client = { id: string; name: string };

export default function GenerateBatchForm({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/invoices/generate-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: fd.get('clientId'),
        periodStart: fd.get('periodStart'),
        periodEnd: fd.get('periodEnd'),
        dueDate: fd.get('dueDate'),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setMsg(data.error ?? 'Falha ao gerar fatura.'); return; }
    setMsg(`Fatura ${data.number} gerada com ${data.items} OT(s).`);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <div className="flex items-center gap-3">
        {msg && <span className="text-xs text-fg-muted">{msg}</span>}
        <Button onClick={() => setOpen(true)} size="sm"><Plus className="mr-1 h-4 w-4" /> Gerar em lote</Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-fg-muted">Cliente</label>
        <select name="clientId" required className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
          <option value="">Selecione…</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-fg-muted">Início</label>
        <Input type="date" name="periodStart" required />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-fg-muted">Fim</label>
        <Input type="date" name="periodEnd" required />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-fg-muted">Vencimento</label>
        <Input type="date" name="dueDate" required />
      </div>
      <Button type="submit" size="sm" disabled={loading}>{loading ? 'Gerando…' : 'Gerar'}</Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
      {msg && <span className="text-xs text-red-500">{msg}</span>}
    </form>
  );
}
