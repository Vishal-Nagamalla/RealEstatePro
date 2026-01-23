"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container, Row, Col, Spinner, Alert, Button } from "react-bootstrap";
import { Heartbreak } from "react-bootstrap-icons";
import ListingCard from "@/components/ListingCard";

async function safeJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function FavoritesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  async function load() {
    setLoading(true);
    setErrMsg("");

    try {
      const res = await fetch("/api/favorites/listings", { cache: "no-store" });
      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load favorites.");
      }

      setItems(Array.isArray(data?.listings) ? data.listings : []);
    } catch (e) {
      console.error(e);
      setErrMsg(e.message || "Something went wrong.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="favorites-page">
      <section className="favorites-hero">
        <Container>
          <div className="favorites-hero-inner">
            <div>
              <h1 className="favorites-title">Favorites</h1>
              <p className="favorites-subtitle">
                Properties you saved for quick access.
              </p>
            </div>
            <div className="favorites-actions">
              <Button
                variant="outline-light"
                className="rounded-pill"
                onClick={load}
              >
                Refresh
              </Button>
              <Button
                as={Link}
                href="/listings"
                variant="warning"
                className="rounded-pill ms-2"
              >
                Browse Listings
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="section favorites-body">
        <Container>
          {loading ? (
            <div className="py-5 text-center">
              <Spinner animation="border" role="status" />
            </div>
          ) : errMsg ? (
            <Alert variant="danger" className="mt-3">
              {errMsg}
            </Alert>
          ) : items.length === 0 ? (
            <div className="favorites-empty">
              <div className="favorites-empty-icon">
                <Heartbreak size={26} />
              </div>
              <h3 className="mt-3 mb-2">No favorites yet</h3>
              <p className="text-light mb-4">
                Tap the heart on any listing to save it here.
              </p>
              <Button as={Link} href="/listings" variant="warning" className="rounded-pill">
                Explore Active Listings
              </Button>
            </div>
          ) : (
            <Row xs={1} md={2} lg={3} className="g-4">
              {items.map((item) => (
                <Col key={item.id}>
                  <ListingCard item={item} />
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>
    </main>
  );
}