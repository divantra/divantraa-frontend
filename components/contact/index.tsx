"use client";

import { useState } from "react";

const ContactUs = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setSubmitted(true);
    setFormData({ name: "", email: "", message: "" });
  };

  const WhatsAppIcon = () => (
    <svg stroke="#007A6B" fill="#007A6B" strokeWidth="0" viewBox="0 0 1024 1024" height="20" width="20" className="shrink-0">
      <path d="M713.5 599.9c-10.9-5.6-65.2-32.2-75.3-35.8-10.1-3.8-17.5-5.6-24.8 5.6-7.4 11.1-28.4 35.8-35 43.3-6.4 7.4-12.9 8.3-23.8 2.8-64.8-32.4-107.3-57.8-150-131.1-11.3-19.5 11.3-18.1 32.4-60.2 3.6-7.4 1.8-13.7-1-19.3-2.8-5.6-24.8-59.8-34-81.9-8.9-21.5-18.1-18.5-24.8-18.9-6.4-0.4-13.7-0.4-21.1-0.4-7.4 0-19.3 2.8-29.4 13.7-10.1 11.1-38.6 37.8-38.6 92s39.5 106.7 44.9 114.1c5.6 7.4 77.7 118.6 188.4 166.5 70 30.2 97.4 32.8 132.4 27.6 21.3-3.2 65.2-26.6 74.3-52.5 9.1-25.8 9.1-47.9 6.4-52.5-2.7-4.9-10.1-7.7-21-13z" />
      <path d="M925.2 338.4c-22.6-53.7-55-101.9-96.3-143.3-41.3-41.3-89.5-73.8-143.3-96.3C630.6 75.7 572.2 64 512 64h-2c-60.6 0.3-119.3 12.3-174.5 35.9-53.3 22.8-101.1 55.2-142 96.5-40.9 41.3-73 89.3-95.2 142.8-23 55.4-34.6 114.3-34.3 174.9 0.3 69.4 16.9 138.3 48 199.9v152c0 25.4 20.6 46 46 46h152.1c61.6 31.1 130.5 47.7 199.9 48h2.1c59.9 0 118-11.6 172.7-34.3 53.5-22.3 101.6-54.3 142.8-95.2 41.3-40.9 73.8-88.7 96.5-142 23.6-55.2 35.6-113.9 35.9-174.5 0.3-60.9-11.5-120-34.8-175.6z m-151.1 438C704 845.8 611 884 512 884h-1.7c-60.3-0.3-120.2-15.3-173.1-43.5l-8.4-4.5H188V695.2l-4.5-8.4C155.3 633.9 140.3 574 140 513.7c-0.4-99.7 37.7-193.3 107.6-263.8 69.8-70.5 163.1-109.5 262.8-109.9h1.7c50 0 98.5 9.7 144.2 28.9 44.6 18.7 84.6 45.6 119 80 34.3 34.3 61.3 74.4 80 119 19.4 46.2 29.1 95.2 28.9 145.8-0.6 99.6-39.7 192.9-110.1 262.7z" />
    </svg>
  );

  return (
    <section className="bg-cream/30 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-5 md:px-8">

        {/* Page heading */}
        {/* <div className="mb-10 text-center md:mb-14">
          <h1 className="font-display text-3xl font-semibold text-forest md:text-4xl">
            Get in Touch
          </h1>
          <p className="mt-3 text-sm text-ink/60 md:text-base">
            We&apos;d love to hear from you. Fill out the form or reach us through the details below.
          </p>
        </div> */}

        <div className="grid gap-10 md:grid-cols-2 md:gap-12">
          {/* Contact form */}
          <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow-sm md:p-8">
            <h2 className="font-display mb-4 text-3xl font-semibold text-ink">
              Contact Us
            </h2>
            <div className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-ink/60 mb-1">
                  Full Name
                </label>
                <input
                  id="name" name="name" type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-ink/20 px-3 py-2.5 text-sm outline-none transition focus:border-leaf focus:ring-1 focus:ring-leaf/30"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-medium text-ink/60 mb-1">
                  Email
                </label>
                <input
                  id="email" name="email" type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-ink/20 px-3 py-2.5 text-sm outline-none transition focus:border-leaf focus:ring-1 focus:ring-leaf/30"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-medium text-ink/60 mb-1">
                  Message
                </label>
                <textarea
                  id="message" name="message" rows={5}
                  placeholder="Your message here..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full resize-none rounded-lg border border-ink/20 px-3 py-2.5 text-sm outline-none transition focus:border-leaf focus:ring-1 focus:ring-leaf/30"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-forest py-2.5 font-medium text-white transition-colors hover:bg-leaf"
              >
                Send Message
              </button>

              {submitted && (
                <p className="text-sm text-leaf font-medium">
                  ✓ Thank you! Your message has been sent.
                </p>
              )}
            </div>
          </form>

          {/* Contact info */}
          <div>
            <h6 className="font-display mb-4 text-2xl text-ink">
              Get in touch
            </h6>

            <div className="text-base leading-relaxed text-ink/70">
              <p>
                For collaborations and business queries:{" "}
                <a href="mailto:divantraa@rediffmail.com" className="text-leaf font-medium hover:underline">
                  divantraa@rediffmail.com
                </a>
              </p>

              <p className="mt-1">
                For customer related queries:{" "}
                <a href="mailto:divantraa@rediffmail.com" className="text-leaf font-medium hover:underline">
                  divantraa@rediffmail.com
                </a>
              </p>

              <p className="mt-1">
                For any other query:{" "}
                <a href="mailto:divantraa@rediffmail.com" className="text-leaf font-medium hover:underline">
                  divantraa@rediffmail.com
                </a>
              </p>

              <p className="mt-1">
                Text us on WhatsApp for faster response:{" "}
                <a
                  href="https://wa.me/919008301490?text=hi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-leaf hover:underline"
                >
                  <WhatsAppIcon />
                  <span>+91 9008301490</span>
                </a>
              </p>

              <p className="text-sm text-ink/70 mt-1">
                Available between 10 AM - 7 PM, all days.
              </p>
            </div>

            {/* Google Map */}
            <div className="mt-10 overflow-hidden rounded-lg shadow-sm">
              <iframe
                title="Google Maps"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.972877233429!2d77.59456231534266!3d12.9715988908579!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670e1f5b123%3A0x1234567890abcdef!2sBangalore!5e0!3m2!1sen!2sin!4v0000000000000"
                allowFullScreen
                loading="lazy"
                className="h-64 w-full border-0"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;
