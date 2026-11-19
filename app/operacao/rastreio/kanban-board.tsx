'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export type KanbanCard = {
  id: string;
  code: string;
  client: string;
  route: string;
  weightKg: number;
  status: string;
  hasOccurrence: boolean;
};

export type KanbanColumn = {
  key: string;
  label: string;
  cards: KanbanCard[];
};

const NEXT_STATUS: Record<string, { to: string; label: string } | undefined> = {
  coletada: { to: 'em_rota', label: 'Iniciar rota' },
  em_rota: { to: 'entregue', label: 'Marcar entregue' },
  em_transito: { to: 'entregue', label: 'Marcar entregue' },
};

export function KanbanBoard({ columns }: { columns: KanbanColumn[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function advance(id: string, to: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/transport-orders/${id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: to, description: `Status alterado para ${to}` }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Falha ao atualizar status');
      }
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro inesperado');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((col) => (
          <section key={col.key} className="rounded-lg border border-border bg-surface/70 p-3">
            <header className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">{col.label}</h2>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                {col.cards.length}
              </span>
            </header>
            <div className="space-y-2">
              {col.cards.length === 0 && (
                <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-fg-muted">
                  Sem OTs nesta etapa
                </p>
              )}
              {col.cards.map((card) => {
                const next = NEXT_STATUS[card.status];
                return (
                  <Card key={card.id} className="border-border">
                    <CardBody className="space-y-1.5 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-brand">{card.code}</span>
                        {card.hasOccurrence && (
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                            ocorrência
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-fg">{card.client}</p>
                      <p className="text-xs text-fg-muted">{card.route}</p>
                      <p className="text-xs text-fg-muted">{card.weightKg.toFixed(1)} kg</p>
                      {next && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={busyId === card.id || pending}
                          onClick={() => advance(card.id, next.to)}
                          className="mt-1 w-full"
                        >
                          {busyId === card.id ? 'Salvando…' : next.label}
                        </Button>
                      )}
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
