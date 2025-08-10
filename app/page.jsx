'use client';
import HeroCinematic from '@/components/HeroCinematic';
import HeroMap from '@/components/HeroMap';
import FloatingSearch from '@/components/FloatingSearch';
import { Container, Row, Col } from 'react-bootstrap';
import ListingCard from '@/components/ListingCard';
import { getAllListings } from '@/lib/listings';
import { useState } from 'react';

export default function HomePage() {
  const { active } = getAllListings();
  const [filters, setFilters] = useState(null);

  return (
    <>
      <HeroCinematic />

      <div style={{ position: 'relative' }} className="map-stack">
        <FloatingSearch onApply={setFilters} />
        <HeroMap />
      </div>

      <section className="section">
        <Container>
          <Row className="mb-4"><Col><h2>By the Numbers</h2></Col></Row>
          <div className="badges">
            <div className="badge-tile"><h3>500+</h3><p>Homes Sold</p></div>
            <div className="badge-tile"><h3>$300M+</h3><p>Total Sales Volume</p></div>
            <div className="badge-tile"><h3>Top 1%</h3><p>Bay Area Agents</p></div>
          </div>
        </Container>
      </section>
      <section className="section">
        <Container>
          <Row className="mb-4"><Col><h2>Featured Listings</h2></Col></Row>
          <Row xs={1} md={3} className="g-4">
            {active.map(item => (<Col key={item.id}><ListingCard item={item} /></Col>))}
          </Row>
        </Container>
      </section>
    </>
  );
}
