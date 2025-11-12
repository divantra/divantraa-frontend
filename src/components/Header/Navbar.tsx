import React, { useState } from 'react';
import './Header.css';
import { CiSearch } from 'react-icons/ci';
import { RiContactsFill } from 'react-icons/ri';
import { FaShoppingCart } from 'react-icons/fa';

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <a href="/" className="logo">
        Divantraa Shop
      </a>

      {/* Hamburger icon for mobile */}
      <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle Menu">
        {menuOpen ? '✖️' : '☰'}
      </div>

      {/* Nav Links */}
      <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
        <li>
          <a href="products">All Products</a>
        </li>
        <li>
          <a href="#">Newly Launched</a>
        </li>
        <li>
          <a href="#">Oils</a>
        </li>
        <li>
          <a href="#">Healthy Combo</a>
        </li>
        <li>
          <a href="contact">Contact Us</a>
        </li>
      </ul>

      {/* Icons */}
      <div className="nav-icons">
        <span role="img" aria-label="search">
          <CiSearch />
        </span>
        <span role="img" aria-label="user">
          <RiContactsFill />
        </span>
        <span role="img" aria-label="cart">
          <FaShoppingCart />
        </span>
      </div>
    </nav>
  );
};

export default Navbar;
