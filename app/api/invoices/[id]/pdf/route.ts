import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response('Não autorizado', { status: 401 });

  const inv = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { client: true, items: { include: { transportOrder: { select: { code: true } } } } },
  });
  if (!inv) return new Response('Fatura não encontrada', { status: 404 });

  const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const rows = inv.items.map(i =>
    `<tr><td>${i.transportOrder.code}</td><td>${i.description}</td><td style="text-align:right">${brl(i.value)}</td></tr>`
  ).join('');

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${inv.number}</title>
<style>body{font-family:system-ui,sans-serif;padding:32px;color:#111}h1{margin:0 0 4px;font-size:20px}
table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}
.tot{margin-top:16px;text-align:right;font-size:14px}.tot strong{font-size:16px}
.meta{color:#555;font-size:12px}</style></head><body>
<h1>DANFE Simplificada — ${inv.number}</h1>
<p class="meta">Emitente: TMS JGNEXT · Cliente: ${inv.client.name} · CNPJ: ${inv.client.document}</p>
<p class="meta">Período: ${inv.periodStart.toLocaleDateString('pt-BR')} a ${inv.periodEnd.toLocaleDateString('pt-BR')} · Vencimento: ${inv.dueDate.toLocaleDateString('pt-BR')}</p>
<table><thead><tr><th>OT</th><th>Descrição</th><th style="text-align:right">Valor</th></tr></thead><tbody>${rows}</tbody></table>
<div class="tot"><p>Subtotal: ${brl(inv.subtotal)}</p><p>Impostos: ${brl(inv.taxes)}</p><p><strong>Total: ${brl(inv.total)}</strong></p></div>
</body></html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${inv.number}.html"`,
    },
  });
}
