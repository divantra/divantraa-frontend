import React from 'react';
import './ProductCard.css';

export interface ProductCardProps {
  image: string;
  title: string;
  description: string;
  price: string;
  offerPrice?: string;
  tag?: string;
  discount?: number;
  isBestSeller?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  image,
  title,
  description,
  price,
  offerPrice,
  tag,
  discount,
  isBestSeller,
}) => {
  return (
    <div className="product-card wow-card">
      {/* Badges */}
      <div className="product-badges">
        {isBestSeller && <span className="badge best-seller">⭐ Best Seller</span>}
        {tag && <span className="badge new-launch">{tag}</span>}
        {discount && <span className="badge discount">{discount}% Off</span>}
      </div>

      {/* Product Image */}
      <div className="product-image-wrapper">
        <img src={image} alt={title} className="product-image" />
      </div>

      {/* Product Content */}
      <div className="product-content">
        <h3 className="product-title">{title}</h3>
        <p className="product-desc">{description}</p>

        <div className="product-pricing">
          <p className="product-price">₹{price}</p>
          {offerPrice && <p className="product-offer">Best Price ₹{offerPrice}</p>}
        </div>

        <div className="product-actions">
          <button className="btn btn-outline">🛒 Add to cart</button>
          <button className="btn btn-primary">⚡ Buy Now</button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
