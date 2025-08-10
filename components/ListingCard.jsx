'use client';
import { Card } from 'react-bootstrap';
import { motion } from 'framer-motion';
import Link from 'next/link';
export default function ListingCard({ item }) {
  return (
    <motion.div whileHover={{ y: -6 }}>
      <Card className="h-100 shadow-sm">
        <Card.Img variant="top" src={item.image} alt={item.title} />
        <Card.Body>
          <Card.Title>{item.title}</Card.Title>
          <Card.Text><strong>${item.price.toLocaleString()}</strong> • {item.beds} bd • {item.baths} ba</Card.Text>
          <div><span className={item.status === 'Sold' ? 'badge badge-navy' : 'badge badge-gold'}>{item.status}</span></div>
        </Card.Body>
        <Card.Footer className="bg-white"><Link href={`/listings/${item.id}`}>View details →</Link></Card.Footer>
      </Card>
    </motion.div>
  );
}
