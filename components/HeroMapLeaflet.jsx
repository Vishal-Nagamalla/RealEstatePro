'use client';

import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Card } from 'react-bootstrap';
import Link from 'next/link';

const center = [37.7749, -122.4194];

function getLatLng(item) {
  const lat = item?.latitude ?? item?.lat ?? null;
  const lng = item?.longitude ?? item?.lng ?? null;
  const latitude = lat === null || lat === '' ? null : Number(lat);
  const longitude = lng === null || lng === '' ? null : Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { lat: latitude, lng: longitude };
}

async function fetchAllListings() {
  const res = await fetch('/api/listings', { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data?.listings) ? data.listings : [];
}

export default function HeroMapLeaflet() {
  const [all, setAll] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all'); // all | active | sold
  const [heat, setHeat] = useState(false);

  useEffect(() => {
    (async () => {
      const rows = await fetchAllListings();
      setAll(rows);
    })();
  }, []);

  const active = useMemo(() => all.filter((x) => x.status !== 'Sold'), [all]);
  const sold = useMemo(() => all.filter((x) => x.status === 'Sold'), [all]);

  const selectedImage =
    selected?.photos?.[0] ||
    selected?.image ||
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop';

  return (
    <div className="map-wrap leaflet-mood">
      <div className="map-frame">
        <div className="map-filters">
          <div className={`chip-pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            All
          </div>
          <div className={`chip-pill ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>
            Active
          </div>
          <div className={`chip-pill ${filter === 'sold' ? 'active' : ''}`} onClick={() => setFilter('sold')}>
            Sold
          </div>
          <div className={`chip-pill ${heat ? 'active' : ''}`} onClick={() => setHeat(!heat)}>
            Sales density
          </div>
        </div>

        <div className="map-container">
          <MapContainer
            center={center}
            zoom={10}
            style={{ width: '100%', height: '100%' }}
            scrollWheelZoom={true}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {(filter === 'sold' ? [] : active).map((item) => {
              const pos = getLatLng(item);
              if (!pos) return null;
              return (
                <CircleMarker
                  key={item.id}
                  center={[pos.lat, pos.lng]}
                  radius={8}
                  pathOptions={{ color: '#8C6C1A', weight: 2, fillColor: '#D4AF37', fillOpacity: 1 }}
                  eventHandlers={{ click: () => setSelected(item) }}
                >
                  <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                    <div style={{ fontSize: 12 }}>
                      <strong>{item.title}</strong>
                      <br />${Number(item.price || 0).toLocaleString()}
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}

            {(filter === 'active' ? [] : sold).map((item) => {
              const pos = getLatLng(item);
              if (!pos) return null;
              return (
                <CircleMarker
                  key={item.id}
                  center={[pos.lat, pos.lng]}
                  radius={7}
                  pathOptions={{ color: '#D4AF37', weight: 1.5, fillColor: '#0A2540', fillOpacity: 0.9 }}
                  eventHandlers={{ click: () => setSelected(item) }}
                >
                  <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                    <div style={{ fontSize: 12 }}>
                      <strong>{item.title}</strong>
                      <br />Sold • ${Number(item.price || 0).toLocaleString()}
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>

          <div className="hero-overlay">
            <h3 className="mb-1">
              RealEstatePro | <span style={{ color: '#D4AF37' }}>Srikar Palepu</span>
            </h3>
            <div>Bay Area Listings & Sold Portfolio</div>
          </div>

          <div className="floating-cta">
            <Button as={Link} href="/contact" variant="warning" size="lg">
              Work with Srikar
            </Button>
          </div>

          {selected ? (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 16 }}
              style={{ position: 'absolute', top: 90, right: 16, width: 340, zIndex: 3 }}
            >
              <Card className="shadow">
                <Card.Img src={selectedImage} alt={selected.title} />
                <Card.Body>
                  <Card.Title>{selected.title}</Card.Title>
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
                </Card.Body>
              </Card>
            </motion.div>
          ) : null}
        </div>
      </div>
    </div>
  );
}