'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function NovaColetaForm({ clientId, clientName }: { clientId: string; clientName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      clientId,
      originAddress: String(fd.get('originAddress') || ''),
      originCity: String(fd.get('originCity') || ''),
      originState: String(fd.get('originState') || ''),
      originZip: String(fd.get('originZip') || ''),
      destinationAddress: String(fd.get('destinationAddress') || ''),
      destinationCity: String(fd.get('destinationCity') || ''),
      destinationState: String(fd.get('destinationState') || ''),
      destinationZip: String(fd.get('destinationZip') || ''),
      cargoDescription: String(fd.get('cargoDescription') || ''),
      weightKg: Number(fd.get('weightKg') || 0),
      volumeM3: Number(fd.get('volumeM3') || 0),
      packages: Number(fd.get('packages') || 0),
      scheduledFor: fd.get('scheduledFor') ? new Date(String(fd.get('scheduledFor'))).toISOString() : null,
    };

    const res = await fetch('/api/portal/collection-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Falha ao abrir coleta.');
      return;
    }
    router.push('/portal');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2 text-xs text-fg-muted">Embarcador: <span className="text-fg">{clientName}</span></div>

      <div className="md:col-span-2">
        <label className="mb-1 block text-xs text-fg-muted">Endereço de coleta</label>
        <Input name="originAddress" required placeholder="Rua, número, complemento" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted">Cidade origem</label>
        <Input name="originCity" required />
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted">UF origem</label>
        <Input name="originState" required maxLength={2} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted">CEP origem</label>
        <Input name="originZip" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted">Agendar para</label>
        <Input name="scheduledFor" type="datetime-local" />
      </div>

      <div className="md:col-span-2">
        <label className="mb-1 block text-xs text-fg-muted">Endereço de entrega</label>
        <Input name="destinationAddress" required />
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted">Cidade destino</label>
        <Input name="destinationCity" required />
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted">UF destino</label>
        <Input name="destinationState" required maxLength={2} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted">CEP destino</label>
        <Input name="destinationZip" />
      </div>

      <div className="md:col-span-2">
        <label className="mb-1 block text-xs text-fg-muted">Descrição da carga</label>
        <Input name="cargoDescription" required placeholder="Ex: 20 caixas de eletrônicos" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted">Peso (kg)</label>
        <Input name="weightKg" type="number" step="0.01" required />
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted">Volume (m³)</label>
        <Input name="volumeM3" type="number" step="0.01" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted">Volumes</label>
        <Input name="packages" type="number" />
      </div>

      {error && <p className="md:col-span-2 text-sm text-red-500">{error}</p>}

      <div className="md:col-span-2 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar solicitação'}</Button>
      </div>
    </form>
  );
}
