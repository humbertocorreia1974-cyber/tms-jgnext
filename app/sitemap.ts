import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://exemplo.com';
  const routes = ["/","/painel","/operacao/coletas","/operacao/coletas/solicitacoes","/operacao/ot/nova","/cadastros/clientes","/cadastros/frota","/operacao/rastreio","/operacao/ocorrencias","/painel/dono","/operacao/romaneio","/operacao/manutencao","/portal","/portal/coletas/nova","/financeiro/faturamento","/financeiro/contas-a-pagar"];
  return routes.map((r) => ({ url: base + (r === '/' ? '' : r), lastModified: new Date(), changeFrequency: 'weekly' as const, priority: r === '/' ? 1 : 0.6 }));
}
