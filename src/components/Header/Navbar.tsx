import React, { useState } from 'react';
import './Header.css';
import { CiSearch } from 'react-icons/ci';
import { RiContactsFill } from 'react-icons/ri';
import { FaShoppingCart } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="logo">
        <img src="/images/logo2.png" alt="Divantraa Logo" />
      </Link>

      {/* Hamburger icon for mobile */}
      <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle Menu">
        {menuOpen ? '✖️' : '☰'}
      </div>

      {/* Nav Links */}
      <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
        <li>
          <Link
            to="/products"
            className={location.pathname.startsWith('/products') ? 'active' : ''}
          >
            All Products
          </Link>
        </li>
        <li>
          <Link
            to="/newly-launched"
            className={location.pathname === '/newly-launched' ? 'active' : ''}
          >
            Newly Launched
          </Link>
        </li>
        <li>
          <Link to="/oils" className={location.pathname === '/oils' ? 'active' : ''}>
            Oils
          </Link>
        </li>
        <li>
          <Link
            to="/wood-pressed-section"
            className={location.pathname === '/wood-pressed-section' ? 'active' : ''}
          >
            Wood Pressed Oils
          </Link>
        </li>
        <li>
          <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>
            About Us
          </Link>
        </li>
        <li>
          <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>
            Contact Us
          </Link>
        </li>
      </ul>

      {/* Icons */}
      <div className="nav-icons">
        <CiSearch />
        <RiContactsFill />
        <FaShoppingCart />
      </div>
    </nav>
  );
};

export default Navbar;
