'use client';

import dynamic from 'next/dynamic';

// Leaflet version is free and requires no Google package or API key
const HeroMapLeaflet = dynamic(() => import('./HeroMapLeaflet'), { ssr: false });

export default function HeroMap() {
  return <HeroMapLeaflet />;
}