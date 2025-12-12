'use client';

import { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Form, Spinner } from 'react-bootstrap';
import dynamic from 'next/dynamic';
import { fetchListings } from '@/lib/apiListings';
import ListingCard from '@/components/ListingCard';

const MiniMap = dynamic(() => import('./splitMap'), { ssr: false });

export default function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [minPrice, setMinPrice] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchListings('Active');
        setListings(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(
    () => listings.filter((l) => l.price >= minPrice),
    [listings, minPrice],
  );

  return (
    <main className="inventory-shell inventory-shell--active">
      {/* MAP BAR */}
      <section className="inventory-map-section">
        <Container>
          <div className="inventory-map-card">
            <div className="inventory-map-main">
              <MiniMap items={filtered} />
            </div>
            <div className="inventory-map-overlay">
              <div>
                <h1 className="inventory-title">Active Listings</h1>
                <p className="inventory-subtitle">
                  Explore current homes on the market across the Bay Area.
                </p>
              </div>
              <Form.Select
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className="inventory-filter"
              >
                <option value="0">Any price</option>
                <option value="1000000">$1,000,000+</option>
                <option value="2000000">$2,000,000+</option>
                <option value="3000000">$3,000,000+</option>
              </Form.Select>
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
              {filtered.map((item) => (
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