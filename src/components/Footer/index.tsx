import React from 'react';
import './Footer.css';
import { FaFacebookF, FaInstagram, FaTwitter, FaWhatsapp } from 'react-icons/fa';

const Footer: React.FC = () => {
  const certs = [
    { src: '/images/certs/iso.png', alt: 'ISO 9001' },
    { src: '/images/certs/fssai.png', alt: 'FSSAI' },
    { src: '/images/certs/fda.png', alt: 'FDA' },
    { src: '/images/certs/gmp.png', alt: 'GMP Certified' },
    { src: '/images/certs/iaf.png', alt: 'IAF' },
  ];

  // Inline fallback if any image fails
  const svgFallbackDataUri =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='60' viewBox='0 0 200 60'>
         <rect width='100%' height='100%' fill='%230a3d2e'/>
         <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23d4af37' font-family='Poppins, sans-serif' font-size='12'>Divantraa</text>
       </svg>`
    );

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const el = e.currentTarget;
    if (!el.dataset.fallbackApplied) {
      el.dataset.fallbackApplied = 'true';
      el.src = '/images/certs/placeholder.png'; // optional
      setTimeout(() => {
        if (el.naturalWidth === 0) {
          el.src = svgFallbackDataUri;
        }
      }, 50);
    }
  };

  return (
    <footer className="divantra-footer">
      {/* Certifications */}
      <div className="footer-certifications">
        {certs.map((c) => (
          <img key={c.alt} src={c.src} alt={c.alt} onError={handleImgError} loading="lazy" />
        ))}
      </div>

      {/* Main Content */}
      <div className="footer-container">
        <div className="footer-brand">
          <h2>Divantraa</h2>
          <p className="footer-subtitle">Wood-Pressed Oils & Natural Wellness</p>

          <div className="footer-address">
            <p>
              <strong>Corporate Office:</strong> Sector 44, Gurugram
            </p>
            <p>
              <strong>Registered Office:</strong> IMT Manesar, Gurugram
            </p>
          </div>

          <div className="newsletters">
            <h4>Subscribe to Our Newsletter</h4>
            <div className="newsletters-input">
              <input type="email" placeholder="Enter your email" />
              <button>Subscribe</button>
            </div>
          </div>
        </div>

        <div className="footer-links">
          <div>
            <h4>Services</h4>
            <ul>
              <li>Shop</li>
              <li>Track Your Order</li>
              <li>Our Story</li>
              <li>Blog</li>
              <li>Contact Us</li>
            </ul>
          </div>

          <div>
            <h4>Policies</h4>
            <ul>
              <li>Privacy Policy</li>
              <li>Shipping Policy</li>
              <li>Refund Policy</li>
              <li>Terms of Service</li>
            </ul>
          </div>

          <div>
            <h4>Need Help?</h4>
            <button className="contact-btn">Contact Us</button>

            <div className="social-icons">
              <FaFacebookF />
              <FaInstagram />
              <FaTwitter />
              <FaWhatsapp />
            </div>

            <div className="app-links">
              <a href="https://play.google.com" target="_blank" rel="noreferrer">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                  alt="Google Play"
                />
              </a>
              <a href="https://www.apple.com/in/app-store/" target="_blank" rel="noreferrer">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/9/96/Download_on_the_App_Store_Badge.svg"
                  alt="App Store"
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Divantraa Wellness Pvt. Ltd. | All Rights Reserved</p>
      </div>
    </footer>
  );
};

export default Footer;
