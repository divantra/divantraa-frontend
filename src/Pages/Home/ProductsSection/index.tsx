const ProductsSection = () => {
  const products = [
    { id: 1, name: 'Herbal Face Cream', price: '₹499', image: '/images/cream.jpg' },
    { id: 2, name: 'Aloe Vera Gel', price: '₹299', image: '/images/gel.jpg' },
    { id: 3, name: 'Coconut Hair Oil', price: '₹399', image: '/images/oil.jpg' },
  ];

  return (
    <section className="products">
      <h2>Our Products</h2>
      <div className="products__grid">
        {products.map((p) => (
          <div key={p.id} className="product__card">
            <img src={p.image} alt={p.name} />
            <h3>{p.name}</h3>
            <p>{p.price}</p>
            <button className="btn-secondary">View Details</button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductsSection;
