import { useState } from 'react';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production: send this data via API (e.g., /api/contact)
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <section className="contact">
      <div className="contact__container">
        <h1 className="contact__title">Get in Touch</h1>
        <p className="contact__subtitle">
          We’d love to hear from you. Fill out the form or reach us through the details below.
        </p>

        <div className="contact__grid">
          {/* --- Contact Form --- */}
          <form className="contact__form" onSubmit={handleSubmit}>
            <div className="form__group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form__group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form__group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                rows={5}
                placeholder="Your message here..."
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            <button type="submit" className="contact__btn">
              Send Message
            </button>

            {submitted && (
              <p className="form__success">✅ Thank you! Your message has been sent.</p>
            )}
          </form>

          {/* --- Contact Info --- */}
          <div className="contact__info">
            <h2>Contact Information</h2>
            <p>
              <strong>Email:</strong> support@divantra.com
            </p>
            <p>
              <strong>Phone:</strong> +91 98765 43210
            </p>
            <p>
              <strong>Address:</strong> Divantra Naturals Pvt Ltd, Bengaluru, India
            </p>

            <div className="contact__map">
              <iframe
                title="Google Maps"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.972877233429!2d77.59456231534266!3d12.9715988908579!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670e1f5b123%3A0x1234567890abcdef!2sBangalore!5e0!3m2!1sen!2sin!4v0000000000000"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
