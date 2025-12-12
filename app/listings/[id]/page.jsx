// app/listings/[id]/page.jsx
import ListingDetailClient from './ListingDetailClient';

export default function ListingDetailPage({ params }) {
  return <ListingDetailClient id={params.id} />;
}