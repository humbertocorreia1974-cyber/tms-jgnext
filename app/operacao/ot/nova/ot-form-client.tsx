'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Client = { id: string; name: string; document: string };
type Route = { id: string; originCity: string; originState: string; destinationCity: string; destinationState: string; distanceKm: number | null };

type Quote = {
  freightBaseValue: number; grisValue: number; tdeValue: number; tollValue: number;
  freightTotalValue: number; cubageWeightKg: number; taxableWeightKg: number;
  matchedRateId: string | null; freightTableId: string | null; message?: string;
};

export function OTForm({ clients, routes }: { clients: Client[]; routes: Route[] }) {
  const router = useRouter();
  const [clientId, setClientId] = useState(clients[0]?.id ?? '');
  const [routeId, setRouteId] = useState(routes[0]?.id ?? '');
  const [form, setForm] = useState({
    originAddress: '', originCity: '', originState: '', originZip: '',
    destinationAddress: '', destinationCity: '', destinationState: '', destinationZip: '',
    cargoDescription: '', weightKg: '', volumeM3: '', packages: '',
    scheduledPickupAt: '', scheduledDeliveryAt: '',
  });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const route = routes.find((r) => r.id === routeId);

  function set<K extends keyof typeof form>(k: K, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  function fillFromRoute() {
    if (!route) return;
    setForm((f) => ({
      ...f,
      originCity: route.originCity, originState: route.originState,
      destinationCity: route.destinationCity, destinationState: route.destinationState,
    }));
  }

  async function calculate() {
    setError(null); setBusy(true); setQuote(null);
    const res = await fetch('/api/freight/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId, routeId,
        weightKg: Number(form.weightKg) || 0,
        volumeM3: Number(form.volumeM3) || 0,
      }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? 'Falha ao calcular frete'); return; }
    setQuote(data);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setBusy(true);
    const res = await fetch('/api/transport-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId, routeId,
        ...form,
        weightKg: Number(form.weightKg) || 0,
        volumeM3: Number(form.volumeM3) || 0,
        packages: form.packages ? Number(form.packages) : null,
        scheduledPickupAt: form.scheduledPickupAt || null,
        scheduledDeliveryAt: form.scheduledDeliveryAt || null,
      }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? 'Falha ao emitir OT'); return; }
    router.push(`/operacao/ot/${data.id}`);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Card>
        <CardBody>
          <CardTitle>Cliente e rota</CardTitle>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="text-fg-muted">Cliente</span>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-fg">
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.document}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-fg-muted">Rota</span>
              <select value={routeId} onChange={(e) => setRouteId(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-fg">
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.originCity}/{r.originState} → {r.destinationCity}/{r.destinationState}{r.distanceKm ? ` (${r.distanceKm} km)` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-3">
            <Button type="button" variant="ghost" size="sm" onClick={fillFromRoute}>Preencher endereços da rota</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <CardTitle>Endereços</CardTitle>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input placeholder="Endereço de origem" value={form.originAddress} onChange={(e) => set('originAddress', e.target.value)} required />
            <Input placeholder="Endereço de destino" value={form.destinationAddress} onChange={(e) => set('destinationAddress', e.target.value)} required />
            <Input placeholder="Cidade origem" value={form.originCity} onChange={(e) => set('originCity', e.target.value)} required />
            <Input placeholder="Cidade destino" value={form.destinationCity} onChange={(e) => set('destinationCity', e.target.value)} required />
            <Input placeholder="UF origem" maxLength={2} value={form.originState} onChange={(e) => set('originState', e.target.value.toUpperCase())} required />
            <Input placeholder="UF destino" maxLength={2} value={form.destinationState} onChange={(e) => set('destinationState', e.target.value.toUpperCase())} required />
            <Input placeholder="CEP origem" value={form.originZip} onChange={(e) => set('originZip', e.target.value)} />
            <Input placeholder="CEP destino" value={form.destinationZip} onChange={(e) => set('destinationZip', e.target.value)} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <CardTitle>Carga</CardTitle>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input placeholder="Descrição da carga" value={form.cargoDescription} onChange={(e) => set('cargoDescription', e.target.value)} required />
            <Input type="number" step="0.01" placeholder="Peso (kg)" value={form.weightKg} onChange={(e) => set('weightKg', e.target.value)} required />
            <Input type="number" step="0.001" placeholder="Volume (m³)" value={form.volumeM3} onChange={(e) => set('volumeM3', e.target.value)} />
            <Input type="number" placeholder="Volumes (qtd)" value={form.packages} onChange={(e) => set('packages', e.target.value)} />
            <label className="text-sm">
              <span className="text-fg-muted">Coleta prevista</span>
              <Input type="datetime-local" value={form.scheduledPickupAt} onChange={(e) => set('scheduledPickupAt', e.target.value)} className="mt-1" />
            </label>
            <label className="text-sm">
              <span className="text-fg-muted">Entrega prevista</span>
              <Input type="datetime-local" value={form.scheduledDeliveryAt} onChange={(e) => set('scheduledDeliveryAt', e.target.value)} className="mt-1" />
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={calculate} disabled={busy || !form.weightKg}>
              {busy ? 'Calculando…' : 'Calcular frete'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {quote && (
        <Card>
          <CardBody>
            <CardTitle>Prévia do frete</CardTitle>
            {quote.message && <p className="mt-2 text-sm text-accent">{quote.message}</p>}
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between border-b border-border py-1"><dt className="text-fg-muted">Peso taxável</dt><dd className="text-fg">{quote.taxableWeightKg.toFixed(2)} kg</dd></div>
              <div className="flex justify-between border-b border-border py-1"><dt className="text-fg-muted">Peso cubado</dt><dd className="text-fg">{quote.cubageWeightKg.toFixed(2)} kg</dd></div>
              <div className="flex justify-between border-b border-border py-1"><dt className="text-fg-muted">Frete base</dt><dd className="text-fg">R$ {quote.freightBaseValue.toFixed(2)}</dd></div>
              <div className="flex justify-between border-b border-border py-1"><dt className="text-fg-muted">GRIS</dt><dd className="text-fg">R$ {quote.grisValue.toFixed(2)}</dd></div>
              <div className="flex justify-between border-b border-border py-1"><dt className="text-fg-muted">TDE</dt><dd className="text-fg">R$ {quote.tdeValue.toFixed(2)}</dd></div>
              <div className="flex justify-between border-b border-border py-1"><dt className="text-fg-muted">Pedágio</dt><dd className="text-fg">R$ {quote.tollValue.toFixed(2)}</dd></div>
              <div className="flex justify-between py-1 sm:col-span-2"><dt className="font-semibold text-fg">Total</dt><dd className="font-semibold text-brand">R$ {quote.freightTotalValue.toFixed(2)}</dd></div>
            </dl>
          </CardBody>
        </Card>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Emitindo…' : 'Emitir OT'}</Button>
      </div>
    </form>
  );
}
