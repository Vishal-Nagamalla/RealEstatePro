'use client';

import { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import dynamic from 'next/dynamic';
import { fetchListings } from '@/lib/apiListings';
import ListingCard from '@/components/ListingCard';

const MiniMap = dynamic(() => import('../listings/splitMap'), { ssr: false });

export default function SoldPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchListings('Sold');
        setListings(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main className="inventory-shell inventory-shell--sold">
      {/* MAP BAR */}
      <section className="inventory-map-section">
        <Container>
          <div className="inventory-map-card">
            <div className="inventory-map-main">
              <MiniMap items={listings} />
            </div>
            <div className="inventory-map-overlay">
              <div>
                <h1 className="inventory-title">Sold Portfolio</h1>
                <p className="inventory-subtitle">
                  Recently closed transactions that highlight Srikar&apos;s track
                  record in the Bay Area.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CARDS */}
      <section className="section inventory-list-section">
        <Container>
          {loading ? (
            <div className="py-5 text-center">
              <Spinner animation="border" role="status" />
            </div>
          ) : (
            <Row xs={1} md={2} lg={3} className="g-4">
              {listings.map((item) => (
                <Col key={item.id}>
                  <ListingCard item={item} />
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>
    </main>
  );
}