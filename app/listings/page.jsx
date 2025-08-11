// app/listings/page.jsx
import { Container, Row, Col } from 'react-bootstrap';
import { getAllListings } from '@/lib/listings';
import ListingCard from '@/components/ListingCard';

export const metadata = { title: 'Listings | RealEstatePro' };

export default function ListingsPage() {
  const { active } = getAllListings();

  return (
    <section className="section">
      <Container>
        <Row className="mb-4">
          <Col><h1>Listings</h1></Col>
        </Row>

        <Row xs={1} md={3} className="g-4">
          {active.map(item => (
            <Col key={item.id}>
              <ListingCard item={item} />
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}