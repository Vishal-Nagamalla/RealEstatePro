'use client';

import { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { Heart, HeartFill, BoxArrowUpRight } from 'react-bootstrap-icons';
import { fetchListingById } from '@/lib/apiListings';
import { useFavorites } from '@/components/FavoritesProvider';

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function formatInt(n) {
  const x = toNum(n);
  if (x == null) return null;
  return x.toLocaleString();
}

function formatAddress(listing) {
  const a1 = (listing?.address1 || '').trim();
  const city = (listing?.city || '').trim();
  const state = (listing?.state || '').trim();
  const zip = (listing?.zip || '').trim();

  const line1 = a1 || null;
  const line2 = [city, state, zip].filter(Boolean).join(', ') || null;

  return { line1, line2 };
}

function safeUrl(url) {
  if (!url) return '';
  const u = String(url).trim();
  if (!u) return '';
  // allow https/http only
  if (!/^https?:\/\//i.test(u)) return '';
  return u;
}

export default function ListingDetailClient({ id }) {
  const [listing, setListing] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isAuthed, isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(id);

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

  const address = useMemo(() => formatAddress(listing), [listing]);
  const zillowUrl = useMemo(() => safeUrl(listing?.zillow_url), [listing]);

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

  const onSave = async () => {
    const result = await toggleFavorite(listing.id);
    if (!result?.ok && result?.reason !== 'not_authed') {
      alert('Could not update favorites, please try again.');
    }
  };

  const beds = toNum(listing?.beds);
  const baths = toNum(listing?.baths);
  const sqft = toNum(listing?.sqft);
  const lotSqft = toNum(listing?.lot_sqft);
  const yearBuilt = toNum(listing?.year_built);
  const lat = toNum(listing?.latitude);
  const lng = toNum(listing?.longitude);

  const desc =
    (listing?.description || '').trim() ||
    'Beautifully presented home in a sought-after neighborhood. Close to transit, parks, and dining.';

  return (
    <section className="section listing-detail-section">
      <Container>
        <Row className="align-items-start g-4">
          <Col md={7}>
            <div className="listing-gallery">
              <div className="gallery-main">
                <img src={heroImage} alt={listing.title} className="img-fluid rounded shadow-sm" />

                {hasMultiple && (
                  <>
                    <button
                      type="button"
                      className="gallery-nav gallery-nav--prev"
                      onClick={handlePrev}
                      aria-label="Previous photo"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="gallery-nav gallery-nav--next"
                      onClick={handleNext}
                      aria-label="Next photo"
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
                        'gallery-thumb-btn' + (idx === photoIndex ? ' gallery-thumb-btn--active' : '')
                      }
                      aria-label={`View photo ${idx + 1}`}
                    >
                      <img src={url} alt="" className="gallery-thumb-img" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Col>

          <Col md={5}>
            <div className="d-flex align-items-start justify-content-between gap-3">
              <div>
                <h1 className="mb-2">{listing.title}</h1>

                {(address.line1 || address.line2 || listing?.neighborhood) && (
                  <div className="text-light opacity-75" style={{ marginBottom: 8 }}>
                    {address.line1 ? <div>{address.line1}</div> : null}
                    {address.line2 ? <div>{address.line2}</div> : null}
                    {listing?.neighborhood ? (
                      <div style={{ marginTop: 4 }}>
                        <span className="opacity-75">Neighborhood:</span>{' '}
                        <span className="opacity-100">{listing.neighborhood}</span>
                      </div>
                    ) : null}
                  </div>
                )}

                <h3 className="mt-0">${Number(listing.price || 0).toLocaleString()}</h3>

                <div className="mb-3 text-light">
                  {(beds ?? listing.beds) != null ? (
                    <>
                      {listing.beds} bd • {listing.baths} ba
                      {sqft != null ? ` • ${formatInt(sqft)} sqft` : ''}
                    </>
                  ) : (
                    <>
                      {listing.beds} bd • {listing.baths} ba
                    </>
                  )}
                </div>
              </div>

              <div className="d-flex flex-column gap-2 align-items-end">
                <Button
                  type="button"
                  variant={fav ? 'warning' : 'outline-warning'}
                  className="rounded-pill d-inline-flex align-items-center"
                  onClick={onSave}
                >
                  {fav ? <HeartFill className="me-2" /> : <Heart className="me-2" />}
                  {fav ? 'Saved' : isAuthed ? 'Save' : 'Sign in to save'}
                </Button>

                {zillowUrl ? (
                  <Button
                    as="a"
                    href={zillowUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outline-light"
                    className="rounded-pill d-inline-flex align-items-center"
                    title="Open Zillow in a new tab"
                  >
                    View on Zillow <BoxArrowUpRight className="ms-2" />
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 mt-2">
              <Badge
                bg={listing.status === 'Sold' ? 'dark' : 'warning'}
                text={listing.status === 'Sold' ? 'light' : 'dark'}
              >
                {listing.status}
              </Badge>

              {listing?.property_type ? (
                <Badge bg="secondary" text="light">
                  {listing.property_type}
                </Badge>
              ) : null}
            </div>

            {/* Facts */}
            <div
              className="mt-4"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: 14,
              }}
            >
              <div className="text-light opacity-75" style={{ fontSize: 12, marginBottom: 10 }}>
                Property facts
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  fontSize: 14,
                }}
              >
                <div className="text-light">
                  <span className="opacity-75">Sqft:</span>{' '}
                  <span className="opacity-100">{sqft != null ? formatInt(sqft) : '—'}</span>
                </div>
                <div className="text-light">
                  <span className="opacity-75">Lot sqft:</span>{' '}
                  <span className="opacity-100">{lotSqft != null ? formatInt(lotSqft) : '—'}</span>
                </div>
                <div className="text-light">
                  <span className="opacity-75">Year built:</span>{' '}
                  <span className="opacity-100">{yearBuilt != null ? yearBuilt : '—'}</span>
                </div>
                <div className="text-light">
                  <span className="opacity-75">Beds/Baths:</span>{' '}
                  <span className="opacity-100">
                    {listing.beds} / {listing.baths}
                  </span>
                </div>

                {/* Helpful for debugging map pins */}
                <div className="text-light" style={{ gridColumn: '1 / -1' }}>
                  <span className="opacity-75">Coordinates:</span>{' '}
                  <span className="opacity-100">
                    {lat != null && lng != null ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-4">
              <div className="text-light opacity-75" style={{ fontSize: 12, marginBottom: 10 }}>
                Description
              </div>
              <p className="text-light" style={{ whiteSpace: 'pre-line' }}>
                {desc}
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}