import React from 'react';
import './Footer.css';
import { FaFacebookF, FaInstagram, FaTwitter, FaWhatsapp } from 'react-icons/fa';

const Footer: React.FC = () => {
  return (
    <footer className="divantra-footer">
      {/* Certifications */}
      <div className="footer-certifications"></div>

      {/* Main Content */}
      <div className="footer-container">
        <div className="footer-brand">
          <h2>Divantraa</h2>
          <p className="footer-subtitle">Wood-Pressed Oils & Natural Wellness</p>

          <div className="footer-address">
            <p>
              <strong>Corporate Office:</strong> Bangalore
            </p>
            <p>
              <strong>Registered Office:</strong> Bangalore
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
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Divantraa Wellness Pvt. Ltd. | All Rights Reserved</p>
      </div>
      <span className="developer-credit">
        Developed & Designed by <strong>Sumeet Golasangi</strong>
      </span>
    </footer>
  );
};

export default Footer;
