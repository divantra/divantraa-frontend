import React from 'react';
import './About.css';

const AboutUs: React.FC = () => {
  return (
    <div className="about-container">
      {/* Hero Section */}
      <section className="about-hero">
        <h1>About Divantraa</h1>
        <p>Pure. Sustainable. Handcrafted wellness rooted in nature.</p>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="about-text">
          <h2>Who We Are</h2>
          <p>
            Divantraa is committed to bringing you pure, natural, and handcrafted oils made with
            traditional methods. Our mission is to provide wellness products that nourish your skin,
            hair, and body with the richness of nature — without chemicals, additives, or harmful
            preservatives.
          </p>
          <p>
            We believe in sustainable sourcing, ethical production, and respecting ancient Indian
            wellness traditions. Every product is crafted with attention to quality, purity, and
            authenticity.
          </p>
        </div>

        <div className="about-image">
          <img src="/public/images/logo-icon.png" alt="About Divantraa" />
        </div>
      </section>

      {/* Vision Section */}
      <section className="vision-section">
        <div className="vision-card">
          <h3>Our Vision</h3>
          <p>
            To create pure, toxin-free wellness essentials that empower people to live healthier,
            more natural lifestyles.
          </p>
        </div>

        <div className="vision-card">
          <h3>Our Mission</h3>
          <p>
            To promote traditional Indian wellness practices and bring handcrafted, eco-friendly
            products to every household.
          </p>
        </div>

        <div className="vision-card">
          <h3>Why Choose Us?</h3>
          <p>
            100% natural ingredients, handcrafted techniques, cruelty-free, sustainable packaging,
            and unmatched quality.
          </p>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
