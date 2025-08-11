import { Container, Row, Col } from 'react-bootstrap';

export const metadata = { title: 'About & Reviews | RealEstatePro | Srikar Palepu' };

export default function AboutReviewsPage() {
  return (
    <section className="section">
      <Container>
        {/* About section */}
        <Row className="align-items-center g-4 mb-5">
          <Col md={3}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/srikar-headshotbg.png" 
              alt="Srikar Palepu" 
              className="rounded shadow-sm" 
              style={{ width: "100%", maxWidth: "250px", height: "auto" }} 
            />          </Col>
          <Col md={7}>
            <h1>Meet Srikar Palepu</h1>
            <p>Are you selling, buying or renting a property? With my intimate knowledge of specific neighborhoods and keen insights of market conditions, I can help guide you through this complicated process with your best interests in mind. I’d be happy to provide assistance with determining current property value, crafting a competitive offer, writing and negotiating a contract, and much more. Contact me today.</p>
          </Col>
        </Row>

        {/* Testimonials injected from existing page via iframe-like include is complex; replicate here briefly */}
        <Row className="mb-4"><Col><h2>Client Testimonials</h2></Col></Row>
        <Row xs={1} md={3} className="g-4 mb-5">
          <Col><div className="testimonial-quote"><div><div className="name fw-semibold mb-2">A. Chen</div><div className="mb-2">“Srikar guided us masterfully through a complex multiple-offer situation.”</div><div className="stars">★★★★★</div></div></div></Col>
          <Col><div className="testimonial-quote"><div><div className="name fw-semibold mb-2">J. Patel</div><div className="mb-2">“Professional, responsive, and deeply knowledgeable about SF neighborhoods.”</div><div className="stars">★★★★★</div></div></div></Col>
          <Col><div className="testimonial-quote"><div><div className="name fw-semibold mb-2">M. Garcia</div><div className="mb-2">“Sold our home above asking in one weekend.”</div><div className="stars">★★★★★</div></div></div></Col>
        </Row>
      </Container>
    </section>
  );
}
