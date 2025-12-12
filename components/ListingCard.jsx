// components/ListingCard.jsx
'use client';

import Link from 'next/link';
import { Badge } from 'react-bootstrap';

export default function ListingCard({ item }) {
  const imageUrl =
    item?.photos?.[0] ??
    item?.image ??
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop';

  return (
    <Link href={`/listings/${item.id}`} className="listing-card-link">
      <article className="listing-card shadow-sm">
        <div className="listing-card-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={item.title} />

          {item.status && (
            <Badge
              bg={item.status === 'Sold' ? 'dark' : 'warning'}
              text={item.status === 'Sold' ? 'light' : 'dark'}
              className="listing-card-status"
            >
              {item.status}
            </Badge>
          )}
        </div>

        <div className="listing-card-content">
          <h3 className="listing-card-title">{item.title}</h3>
          <p className="listing-card-price">
            ${item.price.toLocaleString()}
          </p>
          <p className="listing-card-meta">
            {item.beds} bd • {item.baths} ba
          </p>
        </div>
      </article>
    </Link>
  );
}