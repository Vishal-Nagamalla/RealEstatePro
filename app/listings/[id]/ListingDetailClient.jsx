// app/listings/[id]/ListingDetailClient.jsx
'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Badge,
  Spinner,
  Alert,
} from 'react-bootstrap';
import { fetchListingById } from '@/lib/apiListings';

export default function ListingDetailClient({ id }) {
  const [listing, setListing] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchListingById(id);
        setListing(data || null);
        setPhotoIndex(0);
      } catch (err) {
        console.error(err);
        setError('Failed to load listing from backend.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  if (error || !listing) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error || 'Listing not found.'}</Alert>
      </Container>
    );
  }

  // photos array from backend
  const photos = listing.photos ?? [];
  const heroImage =
    photos[photoIndex] ??
    photos[0] ??
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&auto=format&fit=crop';

  const hasMultiple = photos.length > 1;

  const handlePrev = () => {
    if (!hasMultiple) return;
    setPhotoIndex((i) => (i - 1 + photos.length) % photos.length);
  };

  const handleNext = () => {
    if (!hasMultiple) return;
    setPhotoIndex((i) => (i + 1) % photos.length);
  };

  return (
    <section className="section listing-detail-section">
      <Container>
        <Row className="align-items-start g-4">
          <Col md={7}>
            <div className="listing-gallery">
              <div className="gallery-main">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroImage}
                  alt={listing.title}
                  className="img-fluid rounded shadow-sm"
                />
                {hasMultiple && (
                  <>
                    <button
                      type="button"
                      className="gallery-nav gallery-nav--prev"
                      onClick={handlePrev}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="gallery-nav gallery-nav--next"
                      onClick={handleNext}
                    >
                      ›
                    </button>
                  </>
                )}
              </div>

              {hasMultiple && (
                <div className="gallery-thumbs mt-3 d-flex gap-2">
                  {photos.map((url, idx) => (
                    <button
                      key={`${url}-${idx}`}
                      type="button"
                      onClick={() => setPhotoIndex(idx)}
                      className={
                        'gallery-thumb-btn' +
                        (idx === photoIndex ? ' gallery-thumb-btn--active' : '')
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="gallery-thumb-img" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Col>

          <Col md={5}>
            <h1>{listing.title}</h1>
            <h3 className="mt-2">
              ${listing.price.toLocaleString()}
            </h3>
            <div className="mb-3 text-light">
              {listing.beds} bd • {listing.baths} ba
            </div>
            <Badge
              bg={listing.status === 'Sold' ? 'dark' : 'warning'}
              text={listing.status === 'Sold' ? 'light' : 'dark'}
            >
              {listing.status}
            </Badge>
            <p className="mt-4 text-light">
              Beautifully presented home in a sought-after neighborhood.
              Close to transit, parks, and dining.
            </p>
          </Col>
        </Row>
      </Container>
    </section>
  );
}