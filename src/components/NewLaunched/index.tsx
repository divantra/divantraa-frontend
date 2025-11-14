import React, { useState, useMemo } from 'react';
import './NewLaunched.css';
import ProductCard from '../ProductCard';
import { products } from '../../utils/productData';

const NewLaunched: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // 🔍 Filter only "New Launch" products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.tag == 'New Launch') // correct tag matching
      .filter((p) => p.title.toLowerCase().includes(searchTerm.toLowerCase())); // search filter
  }, [searchTerm, products]);

  return (
    <section className="products-section">
      <div className="products-header">
        <h2>New Launched Products</h2>

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

export default NewLaunched;
