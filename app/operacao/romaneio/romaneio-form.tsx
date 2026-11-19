'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Vehicle = { id: string; plate: string; model: string; capacityKg: number; capacityM3: number };
type Driver = { id: string; name: string; type: string; vehicleId: string | null };
type OT = {
  id: string;
  code: string;
  clientName: string;
  destinationCity: string;
  destinationState: string;
  weightKg: number;
  volumeM3: number;
  cubageWeightKg: number;
};

export function RomaneioForm({ vehicles, drivers, ots }: { vehicles: Vehicle[]; drivers: Driver[]; ots: OT[] }) {
  const router = useRouter();
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const totals = useMemo(() => {
    const chosen = ots.filter((o) => selected.has(o.id));
    return {
      weight: chosen.reduce((s, o) => s + o.weightKg, 0),
      cubage: chosen.reduce((s, o) => s + o.cubageWeightKg, 0),
      volume: chosen.reduce((s, o) => s + o.volumeM3, 0),
      count: chosen.length,
    };
  }, [ots, selected]);

  const weightOk = !vehicle || totals.weight <= vehicle.capacityKg;
  const volumeOk = !vehicle || totals.volume <= vehicle.capacityM3;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!vehicleId || !driverId || selected.size === 0) {
      setError('Selecione veículo, motorista e ao menos uma OT.');
      return;
    }
    if (!weightOk || !volumeOk) {
      setError('Capacidade excedida. Ajuste a seleção antes de criar o romaneio.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/manifests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId, driverId, transportOrderIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Falha ao criar romaneio');
      router.refresh();
      setSelected(new Set());
      setVehicleId('');
      setDriverId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  if (vehicles.length === 0 || drivers.length === 0) {
    return (
      <p className="text-sm text-fg-muted">
        Cadastre ao menos um veículo disponível e um motorista ativo em <span className="text-brand">Cadastros → Frota</span> para montar romaneios.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-fg-muted">Veículo</span>
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          >
            <option value="">Selecione…</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate} — {v.model} ({v.capacityKg.toFixed(0)}kg / {v.capacityM3.toFixed(2)}m³)
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-fg-muted">Motorista</span>
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          >
            <option value="">Selecione…</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.type})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-md border border-border bg-surface/60 p-3 text-sm">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs uppercase text-fg-muted">Peso real</p>
            <p className={weightOk ? 'text-fg' : 'text-red-500'}>
              {totals.weight.toFixed(0)} kg {vehicle ? `/ ${vehicle.capacityKg.toFixed(0)} kg` : ''}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-fg-muted">Peso cubado</p>
            <p className="text-fg">{totals.cubage.toFixed(0)} kg</p>
          </div>
          <div>
            <p className="text-xs uppercase text-fg-muted">Volume</p>
            <p className={volumeOk ? 'text-fg' : 'text-red-500'}>
              {totals.volume.toFixed(2)} m³ {vehicle ? `/ ${vehicle.capacityM3.toFixed(2)} m³` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface/70 text-left text-xs uppercase text-fg-muted">
            <tr>
              <th className="px-3 py-2"> </th>
              <th className="px-3 py-2">OT</th>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Destino</th>
              <th className="px-3 py-2 text-right">Peso</th>
              <th className="px-3 py-2 text-right">Cubado</th>
              <th className="px-3 py-2 text-right">m³</th>
            </tr>
          </thead>
          <tbody>
            {ots.map((o) => (
              <tr key={o.id} className="border-t border-border hover:bg-white/5 transition-colors duration-150">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(o.id)}
                    onChange={() => toggle(o.id)}
                    className="h-4 w-4 accent-brand"
                  />
                </td>
                <td className="px-3 py-2 font-mono text-xs text-fg">{o.code}</td>
                <td className="px-3 py-2 text-fg">{o.clientName}</td>
                <td className="px-3 py-2 text-fg-muted">
                  {o.destinationCity}/{o.destinationState}
                </td>
                <td className="px-3 py-2 text-right text-fg">{o.weightKg.toFixed(0)}</td>
                <td className="px-3 py-2 text-right text-fg-muted">{o.cubageWeightKg.toFixed(0)}</td>
                <td className="px-3 py-2 text-right text-fg-muted">{o.volumeM3.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center justify-between">
        <p className="text-xs text-fg-muted">{totals.count} OT(s) selecionada(s)</p>
        <Button type="submit" disabled={loading}>
          {loading ? 'Criando…' : 'Criar romaneio'}
        </Button>
      </div>
    </form>
  );
}
