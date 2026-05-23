import React, { useState } from 'react';
import './Header.css';
import { CiSearch } from 'react-icons/ci';
import { RiContactsFill } from 'react-icons/ri';
import { FaShoppingCart } from 'react-icons/fa';
import { Link, NavLink } from 'react-router-dom';
import { Dropdown, type MenuProps, Drawer, Grid } from 'antd';
import { MenuOutlined } from '@ant-design/icons';

const { useBreakpoint } = Grid;

interface NavbarProps {
  isLoggedIn: boolean;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isLoggedIn, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const screens = useBreakpoint();

  // Close menu when changing pages
  const handleNavClick = () => {
    setMenuOpen(false);
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-action',
      label: isLoggedIn ? (
        <div onClick={() => { onLogout(); handleNavClick(); }}>Logout</div>
      ) : (
        <Link to="/login" onClick={handleNavClick}>Login / Register</Link>
      ),
    },
  ];

  const navItems = [
    { label: 'All Products', path: '/products' },
    { label: 'Newly Launched', path: '/newly-launched' },
    { label: 'Oils', path: '/oils' },
    { label: 'Wood Pressed Oils', path: '/wood-pressed-section' },
    { label: 'About Us', path: '/about' },
    { label: 'Contact Us', path: '/contact' },
  ];

  const NavLinks = () => (
    <>
      {navItems.map((item) => (
        <li key={item.path}>
          <NavLink 
            to={item.path} 
            className={({ isActive }) => (isActive ? 'active' : '')}
            onClick={handleNavClick}
          >
            {item.label}
          </NavLink>
        </li>
      ))}
    </>
  );

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="logo" onClick={handleNavClick}>
        <img src="/images/logo2.png" alt="Divantraa Logo" />
      </Link>

      {/* Hamburger / Close icon */}
      {!screens.md && (
        <div className="menu-icon" onClick={() => setMenuOpen(true)}>
          <MenuOutlined />
        </div>
      )}

      {/* Navigation Links */}
      {screens.md && (
        <ul className="nav-links">
          <NavLinks />
        </ul>
      )}

      <Drawer
        title={<img src="/images/logo2.png" alt="Logo" height={30} />}
        placement="right"
        onClose={() => setMenuOpen(false)}
        open={menuOpen}
        width={280}
      >
        <ul className="nav-links active" style={{ position: 'static', border: 'none' }}>
          <NavLinks />
        </ul>
      </Drawer>

      {/* Icons */}
      <div className="nav-icons">
        <CiSearch />
        <Dropdown 
          menu={{ items: userMenuItems }} 
          placement="bottomRight" 
          arrow={{ pointAtCenter: true }}
        >
          <RiContactsFill className="nav-icon-user-trigger" style={{ cursor: 'pointer' }} />
        </Dropdown>
        <FaShoppingCart />
      </div>
    </nav>
  );
};

export default Navbar;
