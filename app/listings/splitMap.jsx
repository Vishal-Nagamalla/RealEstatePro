'use client';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MiniMap({ items }) {
  const center = [37.7749, -122.4194];
  return (
    <MapContainer center={center} zoom={11} style={{ width: '100%', height: '100%' }} attributionControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {items.map(it => (
        <CircleMarker key={it.id} center={[it.lat, it.lng]} radius={7}
          pathOptions={{ color: '#8C6C1A', weight: 2, fillColor: it.status==='Sold' ? '#0A2540' : '#D4AF37', fillOpacity: 1 }}>
          <Tooltip><div style={{fontSize:12}}><strong>{it.title}</strong></div></Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
