'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Navbar, Nav, NavDropdown, Container, Button } from 'react-bootstrap';
import {
  HouseFill,
  TrophyFill,
  StarFill,
  ShieldLockFill,
} from 'react-bootstrap-icons';
import { useSession } from 'next-auth/react';
import AuthButton from '@/components/AuthButton';

export default function BrandNavbar() {
  const { status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);

  // Desktop detection
  const [isDesktop, setIsDesktop] = useState(false);

  // Properties dropdown hover control
  const [showProps, setShowProps] = useState(false);
  const propsCloseTimer = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 992px)');
    const handler = () => setIsDesktop(mq.matches);
    handler();
    mq.addEventListener?.('change', handler);

    return () => {
      mq.removeEventListener?.('change', handler);
      if (propsCloseTimer.current) clearTimeout(propsCloseTimer.current);
    };
  }, []);

  const openProps = () => {
    if (!isDesktop) return;
    if (propsCloseTimer.current) clearTimeout(propsCloseTimer.current);
    setShowProps(true);
  };

  const closePropsSoon = () => {
    if (!isDesktop) return;
    if (propsCloseTimer.current) clearTimeout(propsCloseTimer.current);
    propsCloseTimer.current = setTimeout(() => setShowProps(false), 150);
  };

  // Admin check
  useEffect(() => {
    let alive = true;

    async function checkAdmin() {
      if (status !== 'authenticated') {
        if (alive) setIsAdmin(false);
        return;
      }
      try {
        const res = await fetch('/api/admin/me', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (alive) setIsAdmin(Boolean(data?.isAdmin));
      } catch {
        if (alive) setIsAdmin(false);
      }
    }

    checkAdmin();
    return () => {
      alive = false;
    };
  }, [status]);

  return (
    <Navbar expand="lg" fixed="top" className="navbar-dark brand-navbar">
      <Container>
        <Navbar.Brand as={Link} href="/">
          <strong>RealEstatePro</strong> | Srikar Palepu
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="ms-auto align-items-lg-center">
            <NavDropdown
              title="Properties"
              id="nav-properties"
              menuVariant="dark"
              align="end"
              show={showProps}
              onMouseEnter={openProps}
              onMouseLeave={closePropsSoon}
              onToggle={(nextShow) => {
                // Mobile: normal click toggle
                if (!isDesktop) {
                  setShowProps(nextShow);
                  return;
                }
                // Desktop: allow closing (outside click / ESC) to work
                if (!nextShow) setShowProps(false);
              }}
            >
              <NavDropdown.Item as={Link} href="/listings">
                <HouseFill className="me-2" />
                Active Listings
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} href="/sold">
                <TrophyFill className="me-2" />
                Sold Portfolio
              </NavDropdown.Item>
            </NavDropdown>

            <Nav.Link as={Link} href="/about-reviews">
              About & Reviews
            </Nav.Link>

            {status === 'authenticated' && (
              <Nav.Link
                as={Link}
                href="/favorites"
                className="d-flex align-items-center gap-2"
              >
                <StarFill /> Favorites
              </Nav.Link>
            )}

            {isAdmin && (
              <Nav.Link
                as={Link}
                href="/admin"
                className="d-flex align-items-center gap-2"
              >
                <ShieldLockFill /> Admin
              </Nav.Link>
            )}

            {/* Right side actions */}
            <div className="nav-actions ms-lg-3 mt-3 mt-lg-0 d-flex align-items-center">
              <Button
                as={Link}
                href="/contact"
                variant="warning"
                className="btn-contact magnetic"
              >
                Contact
              </Button>

              {/* Only spacing between contact + account */}
              <div className="account-slot">
                <AuthButton />
              </div>
            </div>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}