'use client';

import { useEffect, useState } from 'react';
import HeroCinematic from '@/components/HeroCinematic';
import HeroMap from '@/components/HeroMap';
import FloatingSearch from '@/components/FloatingSearch';
import { Container, Row, Col } from 'react-bootstrap';
import ListingCard from '@/components/ListingCard';
import { fetchListings } from '@/lib/apiListings';

export default function HomePage() {
  const [filters, setFilters] = useState(null);
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const active = await fetchListings('Active');
        setFeatured(active.slice(0, 3));
      } catch (err) {
        console.error('Failed to load featured listings', err);
      }
    }

    loadFeatured();
  }, []);

  return (
    <>
      <HeroCinematic />

      <div style={{ position: 'relative' }} className="map-stack">
        <FloatingSearch onApply={setFilters} />
        <HeroMap />
      </div>

      <section className="section">
        <Container>
          <Row className="mb-4">
            <Col>
              <h2>By the Numbers</h2>
            </Col>
          </Row>
          <div className="badges">
            <div className="badge-tile">
              <h3>500+</h3>
              <p>Homes Sold</p>
            </div>
            <div className="badge-tile">
              <h3>$300M+</h3>
              <p>Total Sales Volume</p>
            </div>
            <div className="badge-tile">
              <h3>Top 1%</h3>
              <p>Bay Area Agents</p>
            </div>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <Row className="mb-4">
            <Col>
              <h2>Featured Listings</h2>
            </Col>
          </Row>
          <Row xs={1} md={3} className="g-4">
            {featured.map((item) => (
              <Col key={item.id}>
                <ListingCard item={item} />
              </Col>
            ))}
          </Row>
        </Container>
      </section>
    </>
  );
}