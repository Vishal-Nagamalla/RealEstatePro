'use client';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useState } from 'react';
export default function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <section className="section">
      <Container>
        <Row className="mb-4"><Col><h1>Contact</h1></Col></Row>
        <Row className="g-4">
          <Col md={7}>
            <Form onSubmit={(e)=>{e.preventDefault(); setSent(true); setTimeout(()=>setSent(false), 2000)}}>
              <div className="mb-3">
                <label className="contact-label">Your name</label>
                <Form.Control placeholder="Jane Doe" required />
              </div>
              <div className="mb-3">
                <label className="contact-label">Your email</label>
                <Form.Control type="email" placeholder="jane@domain.com" required />
              </div>
              <div className="mb-3">
                <label className="contact-label">Tell me about your goals</label>
                <Form.Control as="textarea" placeholder="Buying, selling, timeline, neighborhoods…" required />
              </div>
              <Button type="submit" variant="warning">Send</Button>
            </Form>
            {sent && <Alert className="mt-3" variant="success">Message sent! We’ll be in touch shortly.</Alert>}
          </Col>
          <Col md={5}>
            <div className="p-4 contact-card">
              <h5 className="mb-2">Get in touch</h5>
              <p className="mb-1"><strong>Phone:</strong> <a className="text-white" href="tel:4088029498">408-802-9498</a></p>
              <p className="mb-1"><strong>Email:</strong> <a className="text-white" href="mailto:wealthequityrealtor@gmail.com">wealthequityrealtor@gmail.com</a></p>
              <p className="mb-0"><strong>Service Area:</strong> San Francisco Bay Area</p>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
