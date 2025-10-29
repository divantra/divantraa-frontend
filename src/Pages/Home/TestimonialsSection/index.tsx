const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'Aditi Sharma',
      text: 'Absolutely love the herbal face cream! It feels so natural and refreshing.',
    },
    {
      name: 'Rahul Mehta',
      text: 'Divantra products are pure magic — my skin feels healthier than ever.',
    },
  ];

  return (
    <section className="testimonials">
      <h2>What Our Customers Say</h2>
      <div className="testimonials__grid">
        {testimonials.map((t, idx) => (
          <div key={idx} className="testimonial__card">
            <p>“{t.text}”</p>
            <h4>- {t.name}</h4>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection;
