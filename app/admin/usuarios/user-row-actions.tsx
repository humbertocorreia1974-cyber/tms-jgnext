'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UserRowActions({ id, role, name }: { id: string; role: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function changeRole(newRole: string) {
    setBusy(true);
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Remover ${name}?`)) return;
    setBusy(true);
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <select
        value={role}
        disabled={busy}
        onChange={(e) => changeRole(e.target.value)}
        className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg"
      >
        <option value="admin">admin</option>
        <option value="operador">operador</option>
        <option value="motorista">motorista</option>
        <option value="cliente">cliente</option>
        <option value="dono">dono</option>
        <option value="user">user</option>
      </select>
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="rounded-md border border-border px-2 py-1 text-xs text-fg-muted transition-colors duration-150 hover:bg-white/5 hover:text-fg"
      >
        Remover
      </button>
    </div>
  );
}
