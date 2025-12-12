'use client';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MiniMap({ items }) {
  const center = [37.7749, -122.4194];
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <MapContainer center={center} zoom={11} style={{ width: '100%', height: '100%' }} attributionControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {items.map(it => (
        <CircleMarker key={it.id} center={[it.lat, it.lng]} radius={7}
          pathOptions={{ color: '#8C6C1A', weight: 2, fillColor: it.status==='Sold' ? '#0A2540' : '#D4AF37', fillOpacity: 1 }}>
          <Tooltip><div style={{fontSize:12}}><strong>{it.title}</strong></div></Tooltip>
          <Popup>
            <div style={{ minWidth: '200px', textAlign: 'center' }}>
              <img 
                src={it.image} 
                alt={it.title}
                style={{ 
                  width: '100%', 
                  height: '120px', 
                  objectFit: 'cover', 
                  borderRadius: '8px',
                  marginBottom: '8px'
                }} 
              />
              <h6 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                {it.title}
              </h6>
              <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700', color: '#D4AF37' }}>
                {formatPrice(it.price)}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '12px', color: '#666' }}>
                <span>{it.beds} bed{it.beds !== 1 ? 's' : ''}</span>
                <span>{it.baths} bath{it.baths !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ 
                marginTop: '8px', 
                padding: '4px 8px', 
                borderRadius: '4px', 
                fontSize: '11px', 
                fontWeight: '500',
                backgroundColor: it.status === 'Sold' ? '#0A2540' : '#D4AF37',
                color: it.status === 'Sold' ? '#fff' : '#000'
              }}>
                {it.status}
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
