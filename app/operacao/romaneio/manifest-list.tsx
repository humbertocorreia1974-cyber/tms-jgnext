'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

type Manifest = {
  id: string;
  code: string;
  status: string;
  plate: string;
  driverName: string;
  totalWeightKg: number;
  totalVolumeM3: number;
  capacityKg: number;
  capacityM3: number;
  itemsCount: number;
  departureAt: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  aberto: 'Aberto',
  em_rota: 'Em rota',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export function ManifestList({ manifests }: { manifests: Manifest[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function depart(id: string) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/manifests/${id}/depart`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Falha ao partir');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface/70 text-left text-xs uppercase text-fg-muted">
            <tr>
              <th className="px-3 py-2">Código</th>
              <th className="px-3 py-2">Veículo</th>
              <th className="px-3 py-2">Motorista</th>
              <th className="px-3 py-2 text-right">OTs</th>
              <th className="px-3 py-2 text-right">Peso</th>
              <th className="px-3 py-2 text-right">Volume</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {manifests.map((m) => (
              <tr key={m.id} className="border-t border-border hover:bg-white/5 transition-colors duration-150">
                <td className="px-3 py-2 font-mono text-xs text-fg">{m.code}</td>
                <td className="px-3 py-2 text-fg">{m.plate}</td>
                <td className="px-3 py-2 text-fg-muted">{m.driverName}</td>
                <td className="px-3 py-2 text-right text-fg">{m.itemsCount}</td>
                <td className="px-3 py-2 text-right text-fg">
                  {m.totalWeightKg.toFixed(0)} / {m.capacityKg.toFixed(0)} kg
                </td>
                <td className="px-3 py-2 text-right text-fg-muted">
                  {m.totalVolumeM3.toFixed(2)} / {m.capacityM3.toFixed(2)} m³
                </td>
                <td className="px-3 py-2">
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                    {STATUS_LABEL[m.status] ?? m.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  {m.status === 'aberto' ? (
                    <Button size="sm" variant="secondary" disabled={busy === m.id} onClick={() => depart(m.id)}>
                      {busy === m.id ? 'Partindo…' : 'Partir'}
                    </Button>
                  ) : (
                    <span className="text-xs text-fg-muted">
                      {m.departureAt ? new Date(m.departureAt).toLocaleString('pt-BR') : '—'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
