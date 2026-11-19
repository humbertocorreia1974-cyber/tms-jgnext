'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CollectionActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setBusy(true); setError(null);
    const res = await fetch(`/api/collection-requests/${id}/approve`, { method: 'POST' });
    setBusy(false);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? 'Falha ao aprovar'); return; }
    router.refresh();
  }

  async function reject() {
    if (!reason.trim()) { setError('Informe o motivo da rejeição'); return; }
    setBusy(true); setError(null);
    const res = await fetch(`/api/collection-requests/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    setBusy(false);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? 'Falha ao rejeitar'); return; }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {!rejecting ? (
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={approve} disabled={busy}>
            {busy ? 'Aprovando…' : 'Aprovar e emitir OT'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setRejecting(true)} disabled={busy}>
            Rejeitar
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-end gap-2">
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo da rejeição"
            className="w-64"
          />
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={reject} disabled={busy}>
              {busy ? 'Enviando…' : 'Confirmar'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setRejecting(false); setReason(''); setError(null); }} disabled={busy}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
