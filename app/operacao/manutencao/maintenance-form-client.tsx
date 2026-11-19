'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Vehicle = { id: string; plate: string; model: string; currentOdometerKm: number };

export default function MaintenanceForm({ vehicles }: { vehicles: Vehicle[] }) {
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
    const payload = {
      vehicleId: String(fd.get('vehicleId') ?? ''),
      type: String(fd.get('type') ?? 'preventiva'),
      description: String(fd.get('description') ?? ''),
      cost: Number(fd.get('cost') ?? 0),
      odometerKm: fd.get('odometerKm') ? Number(fd.get('odometerKm')) : null,
      performedAt: String(fd.get('performedAt') ?? new Date().toISOString()),
      provider: String(fd.get('provider') ?? ''),
    };
    try {
      const res = await fetch('/api/maintenances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Falha ao salvar manutenção');
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
          <label className="mb-1 block text-xs text-fg-muted">Tipo</label>
          <select
            name="type"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
            defaultValue="preventiva"
          >
            <option value="preventiva">Preventiva</option>
            <option value="corretiva">Corretiva</option>
            <option value="pneus">Pneus</option>
            <option value="revisao">Revisão</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-fg-muted">Custo (R$)</label>
          <Input name="cost" type="number" step="0.01" min="0" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-fg-muted">Data</label>
          <Input name="performedAt" type="date" required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-fg-muted">Odômetro (km)</label>
          <Input name="odometerKm" type="number" step="0.1" min="0" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted">Prestador</label>
        <Input name="provider" placeholder="Oficina / fornecedor" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted">Descrição</label>
        <Input name="description" placeholder="Ex: troca de óleo e filtros" />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {ok && <p className="text-xs text-brand">Manutenção registrada.</p>}
      <Button type="submit" disabled={loading} size="sm">
        {loading ? 'Salvando…' : 'Registrar manutenção'}
      </Button>
    </form>
  );
}
