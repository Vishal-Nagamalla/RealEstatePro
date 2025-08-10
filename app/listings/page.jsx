// app/listings/[id]/page.jsx
import { Container, Row, Col, Badge } from 'react-bootstrap';
import { getAllListings, getListingById } from '@/lib/listings';

// Tell Next to statically generate one page per ID (required for output: 'export')
export function generateStaticParams() {
  const { active, sold } = getAllListings();
  return [...active, ...sold].map((l) => ({ id: l.id }));
}

// Optional: ensure no unknown IDs at runtime (nice for GH Pages)
export const dynamicParams = false;

export default function ListingDetail({ params }) {
  const listing = getListingById(params.id);
  if (!listing) {
    return (
      <Container className="py-5">
        <h2>Listing not found</h2>
      </Container>
    );
  }
  return (
    <section className="section">
      <Container>
        <Row className="align-items-center">
          <Col md={7}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={listing.image} alt={listing.title} className="img-fluid rounded shadow-sm" />
          </Col>
          <Col md={5}>
            <h1>{listing.title}</h1>
            <h3 className="mt-2">${listing.price.toLocaleString()}</h3>
            <div className="mb-3">{listing.beds} bd • {listing.baths} ba</div>
            <Badge bg={listing.status === 'Sold' ? 'dark' : 'warning'} text={listing.status === 'Sold' ? 'light' : 'dark'}>
              {listing.status}
            </Badge>
            <p className="mt-4">
              Beautifully presented home in a sought-after neighborhood. Close to transit, parks, and dining.
            </p>
          </Col>
        </Row>
      </Container>
    </section>
  );
}