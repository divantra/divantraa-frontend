import React from 'react';
import ProductCard, { type ProductCardProps } from '../../ProductCard';
import './ProductsSection.css';
const ProductsSection: React.FC = () => {
  const products: ProductCardProps[] = [
    {
      image: '/images/Oils/groundnut-oil.png',
      title: 'Wood-Pressed Groundnut Oil (1L)',
      description:
        'Cold-pressed from premium groundnuts. Rich in natural antioxidants and nutrients.',
      price: '450',
      offerPrice: '399',
      isBestSeller: true,
      discount: 10,
    },
    {
      image: '/images/Oils/coconut-oil.png',
      title: 'Wood-Pressed Coconut Oil (1L)',
      description: 'Pure, natural coconut oil — great for cooking, hair, and skincare.',
      price: '500',
      offerPrice: '420',
      tag: 'New Launch',
      discount: 15,
    },
    {
      image: '/images/Oils/sesame-oil.png',
      title: 'Cold-Pressed Sesame Oil (1L)',
      description: 'Extracted from high-quality sesame seeds for a rich, nutty aroma.',
      price: '480',
      offerPrice: '430',
      discount: 10,
    },
    {
      image: '/images/Oils/mustard-oil.png',
      title: 'Wood-Pressed Mustard Oil (1L)',
      description: 'Strong aroma, rich in omega-3. Ideal for Indian cooking and pickles.',
      price: '520',
      offerPrice: '460',
      isBestSeller: true,
    },
    {
      image: '/images/Oils/safflower-oil.png',
      title: 'Cold-Pressed Safflower Oil (1L)',
      description: 'Light, heart-friendly oil perfect for everyday cooking and frying.',
      price: '550',
      offerPrice: '499',
    },
    {
      image: '/images/Oils/flaxseed-oil.png',
      title: 'Cold-Pressed Flaxseed Oil (500ml)',
      description: 'High in omega-3 fatty acids. Great for salads and nutritional use.',
      price: '600',
      offerPrice: '520',
      tag: 'Limited Edition',
    },
    {
      image: '/images/Oils/sunflower-oil.png',
      title: 'Wood-Pressed Sunflower Oil (1L)',
      description: 'Naturally extracted and chemical-free — ideal for light cooking.',
      price: '480',
      offerPrice: '420',
      discount: 12,
    },
    {
      image: '/images/Oils/castor-oil.png',
      title: 'Cold-Pressed Castor Oil (500ml)',
      description: 'Multipurpose oil used for hair care, skin therapy, and wellness.',
      price: '350',
      offerPrice: '299',
    },
    {
      image: '/images/Oils/almond-oil.png',
      title: 'Pure Sweet Almond Oil (250ml)',
      description: 'Rich in vitamin E — perfect for baby massage, skin, and hair.',
      price: '750',
      offerPrice: '650',
      isBestSeller: true,
    },
    {
      image: '/images/Oils/blackseed-oil.png',
      title: 'Cold-Pressed Black Seed (Kalonji) Oil (250ml)',
      description: 'Boosts immunity, improves skin, and supports overall wellness.',
      price: '700',
      offerPrice: '620',
      discount: 8,
    },
  ];
  return (
    <section className="products">
      <h2>Our Products</h2>
      <div className="products__grid">
        <div className="home-products">
          {products.map((p, i) => (
            <ProductCard key={i} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
