'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CollectionActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<'idle' | 'reject'>('idle');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setError(null);
    const res = await fetch(`/api/collection-requests/${id}/approve`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Falha ao aprovar.');
      return;
    }
    startTransition(() => router.refresh());
  }

  async function reject() {
    setError(null);
    if (reason.trim().length < 3) {
      setError('Informe o motivo da rejeição.');
      return;
    }
    const res = await fetch(`/api/collection-requests/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Falha ao rejeitar.');
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="w-full max-w-xs space-y-2 sm:w-auto">
      {mode === 'idle' ? (
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={approve} disabled={pending}>
            Aprovar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMode('reject')} disabled={pending}>
            Rejeitar
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            placeholder="Motivo da rejeição"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={reject} disabled={pending}>
              Confirmar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setMode('idle')} disabled={pending}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-accent">{error}</p>}
    </div>
  );
}
