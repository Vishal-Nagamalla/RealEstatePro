'use client';
import Link from 'next/link';
import { Navbar, Nav, NavDropdown, Container, Button } from 'react-bootstrap';
import { HouseFill, TrophyFill } from 'react-bootstrap-icons';

export default function BrandNavbar() {
  return (
    <Navbar expand="lg" fixed="top" className="navbar-dark">
      <Container>
        <Navbar.Brand as={Link} href="/">
          <strong>RealEstatePro</strong> | Srikar Palepu
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="ms-auto align-items-lg-center">
            <NavDropdown title="Properties" id="nav-properties" menuVariant="dark" align="end">
              <div className="dropdown-caret" />
              <NavDropdown.Item as={Link} href="/listings">
                <HouseFill /> Active Listings
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} href="/sold">
                <TrophyFill /> Sold Portfolio
              </NavDropdown.Item>
            </NavDropdown>
            <Nav.Link as={Link} href="/about-reviews">About & Reviews</Nav.Link>
          </Nav>
          <div className="ms-3 d-none d-lg-block">
            <Button as={Link} href="/contact" variant="warning">Contact</Button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
