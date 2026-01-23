// app/listings/splitMap.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import { Card, Button } from 'react-bootstrap';
import Link from 'next/link';
import L from 'leaflet';

const DEFAULT_CENTER = [37.7749, -122.4194];
// Nice “see the whole Bay” fallback zoom if there are 0 pins
const DEFAULT_ZOOM = 9;

// Prevent “super zoom-in” when only 1 marker exists
const SINGLE_PIN_ZOOM = 11;

// Keeps the view comfortably showing Bay Area even if pins are tight
const MAX_FIT_ZOOM = 12;

function toCoords(item) {
  const lat = item?.latitude;
  const lng = item?.longitude;

  const latNum = typeof lat === 'string' ? Number(lat) : lat;
  const lngNum = typeof lng === 'string' ? Number(lng) : lng;

  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;
  return [latNum, lngNum];
}

// Fits map to markers whenever items change
function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (!points || points.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: false });
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], SINGLE_PIN_ZOOM, { animate: false });
      return;
    }

    const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, {
      padding: [40, 40],
      animate: false,
      maxZoom: MAX_FIT_ZOOM,
    });
  }, [map, points]);

  return null;
}

export default function MiniMap({ items = [] }) {
  const [selected, setSelected] = useState(null);

  const mappable = useMemo(() => {
    return (Array.isArray(items) ? items : [])
      .map((it) => {
        const coords = toCoords(it);
        return coords ? { ...it, _coords: coords } : null;
      })
      .filter(Boolean);
  }, [items]);

  const points = useMemo(() => mappable.map((x) => x._coords), [mappable]);

  // Still used for initial render (FitBounds will correct immediately)
  const center = useMemo(() => {
    if (mappable.length === 0) return DEFAULT_CENTER;
    const avgLat = mappable.reduce((sum, x) => sum + x._coords[0], 0) / mappable.length;
    const avgLng = mappable.reduce((sum, x) => sum + x._coords[1], 0) / mappable.length;
    return [avgLat, avgLng];
  }, [mappable]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <FitBounds points={points} />

        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {mappable.map((item) => {
          const isSold = item.status === 'Sold';

          const stroke = isSold ? '#D4AF37' : '#8C6C1A';
          const fill = isSold ? '#0A2540' : '#D4AF37';
          const radius = isSold ? 7 : 8;
          const weight = isSold ? 1.5 : 2;
          const fillOpacity = isSold ? 0.9 : 1;

          return (
            <CircleMarker
              key={item.id}
              center={item._coords}
              radius={radius}
              pathOptions={{ color: stroke, weight, fillColor: fill, fillOpacity }}
              eventHandlers={{ click: () => setSelected(item) }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                <div style={{ fontSize: 12 }}>
                  <strong>{item.title}</strong>
                  <br />
                  ${Number(item.price || 0).toLocaleString()}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {selected && (
        <motion.div
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 16 }}
          style={{ position: 'absolute', top: 16, right: 16, width: 360, zIndex: 5 }}
        >
          <Card className="shadow">
            <Card.Img
              src={
                selected?.photos?.[0] ||
                'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop'
              }
              alt={selected.title}
            />
            <Card.Body>
              <Card.Title className="mb-1">{selected.title}</Card.Title>
              <Card.Text className="mb-2">
                <strong>${Number(selected.price || 0).toLocaleString()}</strong> • {selected.beds} bd •{' '}
                {selected.baths} ba
              </Card.Text>

              <span className={selected.status === 'Sold' ? 'badge badge-navy me-2' : 'badge badge-gold me-2'}>
                {selected.status}
              </span>

              <Button as={Link} href={`/listings/${selected.id}`} className="ms-2" variant="outline-dark">
                View Listing
              </Button>

              <Button className="ms-2" variant="outline-secondary" onClick={() => setSelected(null)}>
                Close
              </Button>
            </Card.Body>
          </Card>
        </motion.div>
      )}
    </div>
  );
}