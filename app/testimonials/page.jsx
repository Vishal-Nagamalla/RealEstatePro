'use client';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import { useState } from 'react';
const mockTestimonials = [
  { name: 'A. Chen', text: 'Srikar guided us masterfully through a complex multiple-offer situation.', stars: 5 },
  { name: 'J. Patel', text: 'Professional, responsive, and deeply knowledgeable about SF neighborhoods.', stars: 5 },
  { name: 'M. Garcia', text: 'Sold our home above asking in one weekend.', stars: 5 },
];
export default function TestimonialsPage() {
  const [pending, setPending] = useState(false);
  return (
    <section className="section">
      <Container>
        <Row className="mb-4"><Col><h1>Client Testimonials</h1></Col></Row>
        <Row xs={1} md={3} className="g-4 mb-5">
          {mockTestimonials.map((t, idx) => (
            <Col key={idx}><div className="testimonial-quote">
              <div><Card.Title>{t.name}</Card.Title><Card.Text>“{t.text}”</Card.Text><div>{'★'.repeat(t.stars)}</div></div>
            </div></Col>
          ))}
        </Row>
        <Row className="mb-3"><Col><h3>Leave a testimonial</h3></Col></Row>
        <Row><Col md={8}>
          <Form onSubmit={(e)=>{e.preventDefault(); setPending(true); setTimeout(()=>setPending(false), 1200);}}>
            <Row className="g-3">
              <Col md={6}><Form.Control placeholder="Your name" required /></Col>
              <Col md={6}><Form.Select defaultValue="5"><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option></Form.Select></Col>
              <Col md={12}><Form.Control as="textarea" rows={4} placeholder="Your experience" required /></Col>
              <Col md={12}><Button type="submit" variant="dark" disabled={pending}>{pending ? 'Submitting…' : 'Submit for review'}</Button></Col>
            </Row>
          </Form>
        </Col></Row>
      </Container>
    </section>
  );
}
