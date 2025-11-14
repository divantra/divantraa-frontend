import React, { useState } from 'react';
import './Header.css';
import { CiSearch } from 'react-icons/ci';
import { RiContactsFill } from 'react-icons/ri';
import { FaShoppingCart } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu when changing pages
  const handleNavClick = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="logo" onClick={handleNavClick}>
        <img src="/images/logo2.png" alt="Divantraa Logo" />
      </Link>

      {/* Hamburger / Close icon */}
      <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle Menu">
        {menuOpen ? '✖' : '☰'}
      </div>

      {/* Navigation Links */}
      <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
        <li>
          <Link
            to="/products"
            className={location.pathname.startsWith('/products') ? 'active' : ''}
            onClick={handleNavClick}
          >
            All Products
          </Link>
        </li>
        <li>
          <Link
            to="/newly-launched"
            className={location.pathname === '/newly-launched' ? 'active' : ''}
            onClick={handleNavClick}
          >
            Newly Launched
          </Link>
        </li>
        <li>
          <Link
            to="/oils"
            className={location.pathname === '/oils' ? 'active' : ''}
            onClick={handleNavClick}
          >
            Oils
          </Link>
        </li>
        <li>
          <Link
            to="/wood-pressed-section"
            className={location.pathname === '/wood-pressed-section' ? 'active' : ''}
            onClick={handleNavClick}
          >
            Wood Pressed Oils
          </Link>
        </li>
        <li>
          <Link
            to="/about"
            className={location.pathname === '/about' ? 'active' : ''}
            onClick={handleNavClick}
          >
            About Us
          </Link>
        </li>
        <li>
          <Link
            to="/contact"
            className={location.pathname === '/contact' ? 'active' : ''}
            onClick={handleNavClick}
          >
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
