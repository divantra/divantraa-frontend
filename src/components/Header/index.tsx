import React, { useState, useEffect } from 'react';
import TopHeader from './TopHeader';
import Navbar from './Navbar';
import './Header.css';

const Header: React.FC = () => {
  const [showTopHeader, setShowTopHeader] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const controlHeader = () => {
      const currentScrollY = window.scrollY;

      // Only trigger after a small threshold
      if (Math.abs(currentScrollY - lastScrollY) < 50) {
        ticking = false;
        return;
      }

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // scrolling down
        setShowTopHeader(false);
      } else {
        // scrolling up
        setShowTopHeader(true);
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(controlHeader);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="header">
      {showTopHeader && <TopHeader />}
      <Navbar />
    </header>
  );
};

export default Header;
