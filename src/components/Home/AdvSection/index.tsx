import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AdvSection.css';

const AdvSection: React.FC = () => {
  const navigate = useNavigate();

  const handleShopNow = () => {
    navigate('/products'); // navigate to products page
  };

  return (
    <section className="hero">
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
