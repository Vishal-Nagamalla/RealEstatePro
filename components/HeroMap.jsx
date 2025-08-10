'use client';
import dynamic from 'next/dynamic';
const HeroMapLeaflet = dynamic(() => import('./HeroMapLeaflet'), { ssr: false });
import { GoogleMap, Marker, MarkerClusterer, HeatmapLayer, useLoadScript } from '@react-google-maps/api';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Card } from 'react-bootstrap';
import Link from 'next/link';
import { getAllListings } from '@/lib/listings';

const containerStyle = { width: '100%', height: '100%' };
const darkStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#0b1b2e" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#e8e9eb" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#0b1b2e" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#0e243d" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#132845" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#243a5a" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0a1c30" }] }
];
const center = { lat: 37.7749, lng: -122.4194 };

function ClusteredMarkers({ items, onSelect, icon }) {
  return (
    <MarkerClusterer>{(clusterer) => items.map(item => (
      <Marker key={item.id} position={{ lat: item.lat, lng: item.lng }} clusterer={clusterer} icon={icon || undefined} onClick={() => onSelect(item)} />
    ))}</MarkerClusterer>
  );
}

export default function HeroMap() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
  if (!apiKey) return <HeroMapLeaflet />;

  const { active, sold } = getAllListings();
  const [filter, setFilter] = useState('all');
  const [heat, setHeat] = useState(false);
  const [selected, setSelected] = useState(null);
  const [activeMap, setActiveMap] = useState(false);

  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: apiKey, libraries: ['visualization'] });

  const activeIcon = useMemo(() => {
    if (typeof window === 'undefined' || !isLoaded || !window.google) return null;
    return { path: window.google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#D4AF37', fillOpacity: 1, strokeColor: '#8C6C1A', strokeWeight: 2 };
  }, [isLoaded]);

  const soldIcon = useMemo(() => {
    if (typeof window === 'undefined' || !isLoaded || !window.google) return null;
    return { path: window.google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#0A2540', fillOpacity: 0.9, strokeColor: '#D4AF37', strokeWeight: 1.5 };
  }, [isLoaded]);

  if (loadError) return <div className="map-container d-flex align-items-center justify-content-center"><div><h5>Map failed to load</h5><p>Add a valid Google Maps API key in <code>.env.local</code>.</p></div></div>;
  if (!isLoaded) return <div className="map-container d-flex align-items-center justify-content-center"><div className="text-center"><div className="spinner-border" role="status" /><div className="mt-2">Loading map…</div></div></div>;

  return (
    <div className="map-wrap"><div className="map-frame">
      <div className="map-container" onMouseEnter={() => setActiveMap(true)} onMouseLeave={() => setActiveMap(false)}>
        {!activeMap && (<div className="map-overlay-cta" onClick={() => setActiveMap(true)}><div className="chip">Click to enable map, scroll to zoom</div></div>)}
        
        <div className="map-filters">
          <div className={`chip-pill ${filter==='all'?'active':''}`} onClick={()=>setFilter('all')}>All</div>
          <div className={`chip-pill ${filter==='active'?'active':''}`} onClick={()=>setFilter('active')}>Active</div>
          <div className={`chip-pill ${filter==='sold'?'active':''}`} onClick={()=>setFilter('sold')}>Sold</div>
          <div className={`chip-pill ${heat?'active':''}`} onClick={()=>setHeat(!heat)}>Sales density</div>
        </div>
    
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10} onLoad={(map)=>{ setTimeout(()=>{ map.panTo({lat:37.77,lng:-122.41}); map.setZoom(11); }, 400); setTimeout(()=>{ map.panTo({lat:37.80,lng:-122.27}); }, 1400); setTimeout(()=>{ map.panTo({lat:37.34,lng:-121.89}); }, 2400); }}
          onClick={() => setActiveMap(true)}
          options={{ disableDefaultUI: true, gestureHandling: activeMap ? 'greedy' : 'none', zoomControl: true, styles: darkStyle }}>
          <ClusteredMarkers items={filter==='sold' ? [] : active} onSelect={setSelected} icon={activeIcon} />
          <ClusteredMarkers items={filter==='active' ? [] : sold} onSelect={setSelected} icon={soldIcon} />
        
          {heat && (
            <HeatmapLayer
              data={sold.map(s => new window.google.maps.LatLng(s.lat, s.lng))}
              options={{ radius: 30, opacity: 0.5 }}
            />
          )}
        </GoogleMap>

        <div className="hero-overlay"><h3 className="mb-1">RealEstatePro | <span style={{ color: '#D4AF37' }}>Srikar Palepu</span></h3><div>Bay Area Listings & Sold Portfolio</div></div>
        <div className="floating-cta"><Button as={Link} href="/contact" variant="warning" size="lg">Work with Srikar</Button></div>

        {selected && (
          <motion.div initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 16 }} style={{ position: 'absolute', top: 90, right: 16, width: 340, zIndex: 3 }}>
            <Card className="shadow"><Card.Img src={selected.image} alt={selected.title} />
              <Card.Body><Card.Title>{selected.title}</Card.Title>
                <Card.Text className="mb-2"><strong>${selected.price.toLocaleString()}</strong> • {selected.beds} bd • {selected.baths} ba</Card.Text>
                <span className={selected.status === 'Sold' ? 'badge badge-navy me-2' : 'badge badge-gold me-2'}>{selected.status}</span>
                <Button as={Link} href={`/listings/${selected.id}`} className="ms-2" variant="outline-dark">View Listing</Button>
              </Card.Body>
            </Card>
          </motion.div>
        )}
      </div>
    </div></div>
  );
}
