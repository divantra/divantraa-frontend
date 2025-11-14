import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdvSection.css';

const AdvSection: React.FC = () => {
  const navigate = useNavigate();

  const images = [
    '/images/Home-Slides/slide1.png',
    '/images/Home-Slides/slide2.png',
    '/images/Home-Slides/slide3.png',
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // Change image every 1.5 sec
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const handleShopNow = () => {
    navigate('/products');
  };

  return (
    <section className="hero" style={{ backgroundImage: `url(${images[currentIndex]})` }}>
      <div className="hero-content">
        <h1>Welcome to Divantraa</h1>
        <p>Pure. Sustainable. Handcrafted oil from nature’s essence.</p>
        <button className="btn-primary" onClick={handleShopNow}>
          Shop Now
        </button>
      </div>
    </section>
  );
};

export default AdvSection;
