import React, { useState, useEffect } from 'react';
import TopHeader from './TopHeader';
import Navbar from './Navbar';
import './Header.css';

const Header = () => {
  const [showTopHeader, setShowTopHeader] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const controlHeader = () => {
      const currentScrollY = window.scrollY;

      // Only hide when scrolling down a noticeable amount
      if (currentScrollY - lastScrollY > 25) {
        setShowTopHeader(false);
      }
      // Show again when scrolling up
      else if (lastScrollY - currentScrollY > 25) {
        setShowTopHeader(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', controlHeader);
    return () => window.removeEventListener('scroll', controlHeader);
  }, []);

  return (
    <header className="header">
      {showTopHeader && <TopHeader />}
      <Navbar />
    </header>
  );
};

export default Header;
