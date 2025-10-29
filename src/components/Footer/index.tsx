import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__container">
        {/* --- Brand / About Section --- */}
        <div className="footer__section">
          <h3 className="footer__brand">Divantra Naturals</h3>
          <p className="footer__text">
            Bringing you nature’s best skincare — sustainably crafted, ethically sourced.
          </p>
        </div>

        {/* --- Quick Links --- */}
        <div className="footer__section">
          <h4 className="footer__title">Quick Links</h4>
          <ul className="footer__links">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/products">Products</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
          </ul>
        </div>

        {/* --- Contact Info --- */}
        <div className="footer__section">
          <h4 className="footer__title">Contact</h4>
          <ul className="footer__contact">
            <li>Email: support@divantra.com</li>
            <li>Phone: +91 98765 43210</li>
            <li>Location: Bengaluru, India</li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <p>© {new Date().getFullYear()} Divantra Naturals. All rights reserved.</p>
        <p className="footer__credits">Crafted with ❤️ by the Divantra Dev Team.</p>
      </div>
    </footer>
  );
};

export default Footer;
