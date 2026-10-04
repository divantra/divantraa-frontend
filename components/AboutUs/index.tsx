"use client";
import { getImageUrl } from "@/lib/image.utils";
import React from "react";

const AboutUs: React.FC = () => {
  return (
    <div className="bg-white text-ink">
      {/* About Section */}
      <section className="max-w-7xl mx-auto px-6 py-14 sm:py-20 grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-5">
          <h2 className="font-display text-3xl font-semibold text-forest">
            Who We Are
          </h2>
          <p className="text-ink/75 leading-relaxed">
            Divantraa is committed to bringing you pure, natural, and handcrafted oils made with
            traditional methods. Our mission is to provide wellness products that nourish your skin,
            hair, and body with the richness of nature — without chemicals, additives, or harmful
            preservatives.
          </p>
          <p className="text-ink/75 leading-relaxed">
            We believe in sustainable sourcing, ethical production, and respecting ancient Indian
            wellness traditions. Every product is crafted with attention to quality, purity, and
            authenticity.
          </p>
        </div>

        <div className="flex justify-center">
          <img
            src={getImageUrl('public/divantraa-logo-main.jpeg')}
            alt="About Divantraa"
            className="w-100 h-100 object-contain"
          />
        </div>
      </section>

      {/* Vision / Mission / Why section */}
      <section className="bg-cream/50 py-16">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          <div className="bg-white shadow-sm rounded-lg p-6 text-center">
            <h3 className="font-display text-xl font-medium text-forest mb-3">Our Vision</h3>
            <p className="text-ink/70 text-sm leading-relaxed">
              To create pure, toxin-free wellness essentials that empower people to live healthier,
              more natural lifestyles.
            </p>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-6 text-center">
            <h3 className="font-display text-xl font-medium text-forest mb-3">Our Mission</h3>
            <p className="text-ink/70 text-sm leading-relaxed">
              To promote traditional Indian wellness practices and bring handcrafted, eco-friendly
              products to every household.
            </p>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-6 text-center">
            <h3 className="font-display text-xl font-medium text-forest mb-3">Why Choose Us?</h3>
            <p className="text-ink/70 text-sm leading-relaxed">
              100% natural ingredients, handcrafted techniques, cruelty-free, sustainable packaging,
              and unmatched quality.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
