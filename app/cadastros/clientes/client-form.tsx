'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ClientForm() {
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
    const body = Object.fromEntries(fd.entries());
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Falha ao cadastrar cliente');
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
    <Card>
      <CardTitle>Novo cliente</CardTitle>
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input name="name" placeholder="Razão social *" required />
          <Input name="tradeName" placeholder="Nome fantasia" />
          <Input name="document" placeholder="CNPJ/CPF *" required />
          <Input name="email" type="email" placeholder="E-mail" />
          <Input name="phone" placeholder="Telefone" />
          <Input name="address" placeholder="Endereço" />
          <div className="grid grid-cols-3 gap-2">
            <Input name="city" placeholder="Cidade" />
            <Input name="state" placeholder="UF" maxLength={2} />
            <Input name="zipCode" placeholder="CEP" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          {ok && <p className="text-xs text-brand">Cliente cadastrado com sucesso.</p>}
          <Button type="submit" variant="primary" size="md" disabled={loading} className="w-full">
            {loading ? 'Salvando…' : 'Cadastrar cliente'}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
