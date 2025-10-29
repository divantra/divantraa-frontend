import { useState } from 'react';

const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Subscribed email:', email);
    setSubmitted(true);
    setEmail('');
  };

  return (
    <section className="newsletter">
      <h2>Subscribe to Our Newsletter</h2>
      <p>Get the latest updates, offers, and wellness tips straight to your inbox.</p>

      <form onSubmit={handleSubmit} className="newsletter__form">
        <input
          type="email"
          placeholder="Enter your email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="btn-primary">
          Subscribe
        </button>
      </form>

      {submitted && <p className="form__success">✅ Thank you for subscribing!</p>}
    </section>
  );
};

export default NewsletterSection;
