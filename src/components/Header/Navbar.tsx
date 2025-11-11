import React, { useState } from 'react';
import './Header.css';

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="logo">Divantra Shop</div>

      {/* Hamburger icon for mobile */}
      <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle Menu">
        {menuOpen ? '✖️' : '☰'}
      </div>

      {/* Nav Links */}
      <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
        <li>
          <a href="#">All Products</a>
        </li>
        <li>
          <a href="#">Newly Launched</a>
        </li>
        <li>
          <a href="#">A2 Ghee</a>
        </li>
        <li>
          <a href="#">Wood-Pressed Oils</a>
        </li>
        <li>
          <a href="#">Healthy Combo</a>
        </li>
        <li>
          <a href="#">Blogs</a>
        </li>
      </ul>

      {/* Icons */}
      <div className="nav-icons">
        <span role="img" aria-label="search">
          🔍
        </span>
        <span role="img" aria-label="user">
          👤
        </span>
        <span role="img" aria-label="cart">
          🛒
        </span>
      </div>
    </nav>
  );
};

export default Navbar;
