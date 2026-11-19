'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 🩹 ícone padrão do Leaflet quebra com bundlers (Next/webpack) — reaponta pros PNGs do CDN.
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  subtitle?: string;
}

export default function LeafletMap({
  points = [],
  center = [-23.5505, -46.6333],
  zoom = 11,
  height = 480,
}: {
  points?: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: number;
}) {
  const first = points.find((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  const mapCenter: [number, number] = first ? [first.lat, first.lng] : center;
  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-xl border border-border">
      <MapContainer center={mapCenter} zoom={zoom} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)).map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={icon}>
            {(p.title || p.subtitle) && (
              <Popup>
                {p.title && <strong>{p.title}</strong>}
                {p.subtitle && <><br />{p.subtitle}</>}
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
