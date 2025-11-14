import React, { useState, useMemo } from 'react';
import './ProductsSection.css';
import ProductCard from '../ProductCard';
import { products } from '../../utils/productData';

const WoodPressed: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // 🔍 Filter products by title + category 'wood'
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.title.toLowerCase().includes('wood')) // only wood pressed oils
      .filter((p) => p.title.toLowerCase().includes(searchTerm.toLowerCase())); // search
  }, [searchTerm]);

  return (
    <section className="products-section">
      <div className="products-header">
        <h2>Our Wood Pressed Oils</h2>

        <input
          type="text"
          className="search-bar"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="products-grid">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((p, i) => <ProductCard key={i} {...p} />)
        ) : (
          <p className="no-results">No products found.</p>
        )}
      </div>
    </section>
  );
};

export default WoodPressed;
