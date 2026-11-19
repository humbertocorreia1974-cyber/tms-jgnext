'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function UserCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      password: String(fd.get('password') ?? ''),
      role: String(fd.get('role') ?? 'user'),
    };
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setMsg(j.error ?? 'Falha ao criar usuário.');
      return;
    }
    setMsg('Usuário criado com sucesso.');
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <Input name="name" placeholder="Nome completo" required />
      <Input name="email" type="email" placeholder="email@empresa.com" required />
      <Input name="password" type="password" placeholder="Senha inicial" required minLength={6} />
      <select name="role" defaultValue="operador" className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
        <option value="admin">admin</option>
        <option value="operador">operador</option>
        <option value="motorista">motorista</option>
        <option value="cliente">cliente</option>
        <option value="dono">dono</option>
        <option value="user">user</option>
      </select>
      <div className="sm:col-span-2 flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Criando…' : 'Criar usuário'}
        </Button>
        {msg && <span className="text-xs text-fg-muted">{msg}</span>}
      </div>
    </form>
  );
}
