'use client';
import { Container, Row, Col, Form } from 'react-bootstrap';
import { useMemo, useState } from 'react';
import { getAllListings } from '@/lib/listings';
import ListingCard from '@/components/ListingCard';
import dynamic from 'next/dynamic';

const MiniMap = dynamic(() => import('./splitMap'), { ssr: false });

export default function ListingsPage() {
  const { active, sold } = getAllListings();
  const [status, setStatus] = useState('active');
  const items = useMemo(() => status==='sold'? sold : active, [status, active, sold]);

  return (
    <section className="section">
      <Container>
        <Row className="mb-4 align-items-end">
          <Col><h1>Browse Properties</h1></Col>
          <Col md="auto">
            <Form className="d-flex gap-2">
              <Form.Select value={status} onChange={e=>setStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="sold">Sold</option>
              </Form.Select>
              <Form.Control type="text" placeholder="Search neighborhood…" />
              <Form.Select><option>Min Price</option><option>$1,000,000</option><option>$1,500,000</option></Form.Select>
              <Form.Select><option>Beds</option><option>2+</option><option>3+</option></Form.Select>
            </Form>
          </Col>
        </Row>

        <div className="split-wrap">
          <div>
            <Row xs={1} md={2} className="g-4">
              {items.map(item => (<Col key={item.id}><ListingCard item={item} /></Col>))}
            </Row>
          </div>
          <div className="split-map">
            <MiniMap items={items} />
          </div>
        </div>
      </Container>
    </section>
  );
}
