'use client';

// Wrapper: o Leaflet toca em `window` no import — TEM que carregar só no
// cliente. Importe ESTE arquivo (`@/components/map-view`), nunca o
// `leaflet-map` nem `react-leaflet` direto.
import dynamic from 'next/dynamic';

export type { MapPoint } from './leaflet-map';

const MapView = dynamic(() => import('./leaflet-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] w-full items-center justify-center rounded-xl border border-border bg-surface text-fg-muted">
      Carregando mapa…
    </div>
  ),
});

export default MapView;
