"use client";

import { useState } from "react";

const ContactUs = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setSubmitted(true);
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-center text-[#235a45] mb-4">
          Get in Touch
        </h1>
        <p className="text-center text-gray-600 mb-12">
          We’d love to hear from you. Fill out the form or reach us through the details below.
        </p>

        <div className="grid md:grid-cols-2 gap-12">
          {/* --- Contact Form --- */}
          <form
            onSubmit={handleSubmit}
            className="bg-white shadow rounded-lg p-8 space-y-6"
          >
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#235a45] focus:border-[#235a45]"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#235a45] focus:border-[#235a45]"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                placeholder="Your message here..."
                value={formData.message}
                onChange={handleChange}
                required
                className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#235a45] focus:border-[#235a45]"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-[#235a45] text-white font-medium py-2 rounded-lg hover:bg-[#407a4a] transition-colors"
            >
              Send Message
            </button>

            {submitted && (
              <p className="text-green-600 text-sm mt-4">
                ✅ Thank you! Your message has been sent.
              </p>
            )}
          </form>

          {/* --- Contact Info --- */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#235a45]">Contact Information</h2>
            <p>
              <strong>Email:</strong> support@divantra.com
            </p>
            <p>
              <strong>Phone:</strong> +91 98765 43210
            </p>
            <p>
              <strong>Address:</strong> Divantra Naturals Pvt Ltd, Bengaluru, India
            </p>

            <div className="rounded-lg overflow-hidden shadow">
              <iframe
                title="Google Maps"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.972877233429!2d77.59456231534266!3d12.9715988908579!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670e1f5b123%3A0x1234567890abcdef!2sBangalore!5e0!3m2!1sen!2sin!4v0000000000000"
                allowFullScreen
                loading="lazy"
                className="w-full h-64 border-0"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;
