'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from 'react-bootstrap';

export default function HeroCinematic(){
  return (
    <section className="hero-cine">
      <motion.div
        className="hero-blur"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      <div className="hero-inner">
        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        >
          Your San Francisco Home Journey—Perfected
        </motion.h1>
        <motion.p
          className="hero-sub"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.25 }}
        >
          Luxury listings, neighborhood expertise, and white‑glove guidance from Srikar Palepu.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.35 }}
        >
          <Button as={Link} href="/listings" size="lg" variant="warning" className="magnetic" data-magnet="true">Explore Properties</Button>
        </motion.div>
      </div>
    </section>
  );
}
