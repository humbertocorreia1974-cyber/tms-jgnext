import Link from "next/link";
import { Hero3D } from "@/components/hero-3d";

export const metadata = { title: "TMS JGNEXT", description: "Emissão de OT, romaneio inteligente, rastreio em tempo real, canhoto digital e margem por rota — tudo num só sistema, com portal do cliente e app do motorista offline-first.", openGraph: { title: "TMS JGNEXT", description: "Emissão de OT, romaneio inteligente, rastreio em tempo real, canhoto digital e margem por rota — tudo num só sistema, com portal do cliente e app do motorista offline-first." } };

const BULLETS = ["Frete calculado pela tabela negociada: rota, faixa de peso, cubagem e adicionais GRIS, TDE e pedágio — sem planilha paralela.","Romaneio inteligente que valida peso real, peso cubado e m³ contra a capacidade do veículo antes de liberar a carga.","Rastreio com timeline de eventos da OT e notificações por e-mail/WhatsApp nos marcos, mais canhoto digital com assinatura, foto e geolocalização na entrega.","Margem por rota: frete recebido menos combustível, pedágio, comissão e manutenção rateada — o dono enxerga o lucro real por viagem.","Portal do cliente multiempresa, app do motorista PWA offline-first com sincronização ao recuperar sinal e painel de ocupação de frota em tempo real.","Fatura em lote por cliente/período com PDF/DANFE simplificada, score de cliente embarcador e auditoria de ações com permissões granulares."];
const STEPS = [{"n":"01","t":"Crie sua conta","d":"Cadastro em segundos, sem cartão."},{"n":"02","t":"Configure o essencial","d":"Deixe tudo do seu jeito em poucos minutos."},{"n":"03","t":"Comece a usar","d":"Tudo num só lugar, pronto pra crescer com você."}];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px] bg-[radial-gradient(48rem_32rem_at_72%_-6rem,hsl(var(--brand)/0.18),transparent_70%),radial-gradient(38rem_26rem_at_8%_8%,hsl(var(--brand)/0.10),transparent_70%)]" />
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <span className="text-[0.98rem] font-semibold tracking-tight">TMS JGNEXT</span>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/login" className="rounded-md px-3 py-1.5 text-fg-muted transition-colors hover:text-fg">Entrar</Link>
          <Link href="/register" className="rounded-md bg-brand px-3.5 py-1.5 font-medium text-brand-fg transition-opacity hover:opacity-90">Criar minha conta</Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-fg-muted backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            TMS JGNEXT
          </span>
          <h1 className="mt-5 text-[2.6rem] font-semibold leading-[1.04] tracking-tight sm:text-5xl lg:text-[3.4rem]">TMS JGNEXT: o ERP logístico que fecha a conta de cada rota</h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-fg-muted">Emissão de OT, romaneio inteligente, rastreio em tempo real, canhoto digital e margem por rota — tudo num só sistema, com portal do cliente e app do motorista offline-first.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/register" className="rounded-lg bg-brand px-5 py-2.5 font-medium text-brand-fg transition-opacity hover:opacity-90">Criar minha conta</Link>
            <Link href="/login" className="rounded-lg border border-border px-5 py-2.5 font-medium text-fg transition-colors hover:bg-surface">Já tenho conta</Link>
          </div>
        </div>
        <div className="relative flex justify-center lg:justify-end">
          <Hero3D />
        </div>
      </section>

      {BULLETS.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-14">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BULLETS.map((b, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface/50 p-6 backdrop-blur transition-transform hover:-translate-y-0.5">
                <div className="mb-3 h-8 w-8 rounded-lg bg-brand/15 ring-1 ring-brand/25" />
                <p className="text-sm leading-relaxed text-fg">{b}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Como funciona</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n}>
              <div className="font-mono text-sm text-brand">{s.n}</div>
              <p className="mt-2 font-medium text-fg">{s.t}</p>
              <p className="mt-1 text-sm text-fg-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/60 px-8 py-14 text-center backdrop-blur">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(30rem_20rem_at_50%_0%,hsl(var(--brand)/0.18),transparent_70%)]" />
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Comece agora</h2>
          <p className="mx-auto mt-2 max-w-md text-fg-muted">Emissão de OT, romaneio inteligente, rastreio em tempo real, canhoto digital e margem por rota — tudo num só sistema, com portal do cliente e app do motorista offline-first.</p>
          <Link href="/register" className="mt-6 inline-flex rounded-lg bg-brand px-6 py-3 font-medium text-brand-fg transition-opacity hover:opacity-90">Criar minha conta</Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-fg-muted sm:flex-row">
          <span>TMS JGNEXT</span>
          <nav className="flex gap-4">
            <Link href="/termos" className="transition-colors hover:text-fg">Termos</Link>
            <Link href="/privacidade" className="transition-colors hover:text-fg">Privacidade</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
