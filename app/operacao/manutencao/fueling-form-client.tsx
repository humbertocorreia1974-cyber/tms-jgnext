'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Vehicle = { id: string; plate: string; model: string; currentOdometerKm: number };

export default function FuelingForm({ vehicles }: { vehicles: Vehicle[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOk(false);
    const fd = new FormData(e.currentTarget);
    const liters = Number(fd.get('liters') ?? 0);
    const pricePerLiter = Number(fd.get('pricePerLiter') ?? 0);
    const payload = {
      vehicleId: String(fd.get('vehicleId') ?? ''),
      liters,
      pricePerLiter,
      totalValue: Number((liters * pricePerLiter).toFixed(2)),
      odometerKm: fd.get('odometerKm') ? Number(fd.get('odometerKm')) : null,
      station: String(fd.get('station') ?? ''),
      fueledAt: String(fd.get('fueledAt') ?? new Date().toISOString()),
    };
    try {
      const res = await fetch('/api/fuelings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Falha ao salvar abastecimento');
      }
      setOk(true);
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-fg-muted">Veículo</label>
        <select
          name="vehicleId"
          required
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
        >
          <option value="">Selecione…</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.plate} — {v.model}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-fg-muted">Litros</label>
          <Input name="liters" type="number" step="0.01" min="0" required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-fg-muted">R$ / litro</label>
          <Input name="pricePerLiter" type="number" step="0.001" min="0" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-fg-muted">Data</label>
          <Input name="fueledAt" type="date" required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-fg-muted">Odômetro (km)</label>
          <Input name="odometerKm" type="number" step="0.1" min="0" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted">Posto</label>
        <Input name="station" placeholder="Nome do posto" />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {ok && <p className="text-xs text-brand">Abastecimento registrado.</p>}
      <Button type="submit" disabled={loading} size="sm">
        {loading ? 'Salvando…' : 'Registrar abastecimento'}
      </Button>
    </form>
  );
}
