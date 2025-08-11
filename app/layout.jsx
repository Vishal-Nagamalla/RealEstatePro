import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/globals.css';
import 'leaflet/dist/leaflet.css';
import BrandNavbar from '@/components/BrandNavbar';
import Link from 'next/link';

export const metadata = {
  title: 'RealEstatePro | Srikar Palepu',
  description: 'Bay Area Realtor portfolio with listings, sales, and testimonials.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="site-geo">
        <BrandNavbar />
        <div style={{ paddingTop: '72px' }}>{children}</div>
        
        <div className="lead-strip">
          <div className="container d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
            <div><strong>Curious what your home is worth?</strong> Get a free, no-pressure valuation.</div>
            <Link href="/contact" className="btn btn-warning rounded-pill magnetic">Get My Valuation</Link>          </div>
        </div>
        <footer className="mt-5 py-4"  style={{ background: '#0A2540', color: 'white' }}>
          <div className="container d-flex justify-content-between align-items-center">
            <div>© {new Date().getFullYear()} RealEstatePro | Srikar Palepu</div>
            <div>
              <a className="text-white me-3" href="tel:4088029498">408-802-9498</a>
              <a className="text-white" href="mailto:wealthequityrealtor@gmail.com">wealthequityrealtor@gmail.com</a>
            </div>
          </div>
        </footer>
        <div className="float-schedule">
        <Link href="/contact" className="btn btn-warning btn-lg rounded-pill magnetic">Schedule a Call</Link>        </div>
      </body>
    </html>
  );
}
