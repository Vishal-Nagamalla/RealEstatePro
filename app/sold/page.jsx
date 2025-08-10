'use client';
import { Container, Row, Col, Form } from 'react-bootstrap';
import { useMemo, useState } from 'react';
import { getAllListings } from '@/lib/listings';
import ListingCard from '@/components/ListingCard';
import dynamic from 'next/dynamic';

const MiniMap = dynamic(() => import('../listings/splitMap'), { ssr: false });

export default function SoldPage() {
  const { sold } = getAllListings();
  const [minPrice, setMinPrice] = useState(0);
  const items = useMemo(() => sold.filter(s => s.price >= minPrice), [sold, minPrice]);

  return (
    <section className="section">
      <Container>
        <Row className="mb-4 align-items-end">
          <Col><h1>Sold Portfolio</h1></Col>
          <Col md="auto">
            <Form className="d-flex gap-2">
              <Form.Select value={minPrice} onChange={(e)=>setMinPrice(Number(e.target.value))}>
                <option value="0">Any Price</option>
                <option value="1000000">$1,000,000+</option>
                <option value="2000000">$2,000,000+</option>
                <option value="3000000">$3,000,000+</option>
              </Form.Select>
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
