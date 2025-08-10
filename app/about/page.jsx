import { Container, Row, Col } from 'react-bootstrap';
export const metadata = { title: 'About | RealEstatePro | Srikar Palepu' };
export default function AboutPage() {
  return (
    <section className="section">
      <Container>
        <Row className="align-items-center g-4">
          <Col md={5}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/srikar-headshot.png" alt="Srikar Palepu" className="img-fluid rounded shadow-sm" />
          </Col>
          <Col md={7}>
            <h1>About Srikar Palepu</h1>
            <p>Are you selling, buying or renting a property? With my intimate knowledge of specific neighborhoods and keen insights of market conditions, I can help guide you through this complicated process with your best interests in mind. I’d be happy to provide assistance with determining current property value, crafting a competitive offer, writing and negotiating a contract, and much more. Contact me today.</p>
            <div className="mt-3">
              <a className="btn btn-warning me-2" href="tel:4088029498">Call 408-802-9498</a>
              <a className="btn btn-outline-dark" href="mailto:wealthequityrealtor@gmail.com">Email Me</a>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
