'use client';

import Link from 'next/link';
import { Badge } from 'react-bootstrap';
import { Heart, HeartFill, BoxArrowUpRight } from 'react-bootstrap-icons';
import { useFavorites } from '@/components/FavoritesProvider';

function formatAddress(item) {
  const parts = [item?.address1, item?.city, item?.state, item?.zip].filter(Boolean);
  if (parts.length) return parts.join(', ');
  return item?.neighborhood ? item.neighborhood : '';
}

export default function ListingCard({ item }) {
  const { isAuthed, isFavorite, toggleFavorite } = useFavorites();

  const imageUrl =
    item?.photos?.[0] ??
    item?.image ??
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop';

  const fav = isFavorite(item.id);
  const addr = formatAddress(item);

  const onHeartClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const result = await toggleFavorite(item.id);
    if (!result?.ok && result?.reason !== 'not_authed') {
      alert('Could not update favorites, please try again.');
    }
  };

  return (
    <Link href={`/listings/${item.id}`} className="listing-card-link">
      <article className="listing-card shadow-sm">
        <div className="listing-card-image">
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

          <button
            type="button"
            className={'fav-btn' + (fav ? ' fav-btn--active' : '')}
            onClick={onHeartClick}
            aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
            title={isAuthed ? (fav ? 'Remove from favorites' : 'Add to favorites') : 'Sign in to save'}
          >
            {fav ? <HeartFill /> : <Heart />}
          </button>
        </div>

        <div className="listing-card-content">
          <h3 className="listing-card-title">{item.title}</h3>

          {addr ? (
            <p className="listing-card-meta" style={{ marginBottom: 6 }}>
              {addr}
            </p>
          ) : null}

          <p className="listing-card-price">${Number(item.price || 0).toLocaleString()}</p>

          <p className="listing-card-meta" style={{ marginBottom: 0 }}>
            {item.beds} bd • {item.baths} ba
            {item?.sqft ? ` • ${Number(item.sqft).toLocaleString()} sqft` : ''}
          </p>
        </div>
      </article>
    </Link>
  );
}