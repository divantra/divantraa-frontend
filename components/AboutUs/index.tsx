"use client";
import React from "react";

const AboutUs: React.FC = () => {
  return (
    <div className="bg-white text-gray-800">
      {/* Hero Section with Background Image */}
      <section
        className="relative bg-cover bg-top bg-no-repeat py-24 text-center text-white"
        style={{ backgroundImage: "url('/images/divantraa-logo-main.jpeg')" }}
      >
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4">
            About Divantraa
          </h1>
          <p className="text-lg md:text-xl font-light">
            Pure. Sustainable. Handcrafted wellness rooted in nature.
          </p>
        </div>
      </section>

      {/* About Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-[#235a45] font-serif">
            Who We Are
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Divantraa is committed to bringing you pure, natural, and handcrafted oils made with
            traditional methods. Our mission is to provide wellness products that nourish your skin,
            hair, and body with the richness of nature — without chemicals, additives, or harmful
            preservatives.
          </p>
          <p className="text-gray-700 leading-relaxed">
            We believe in sustainable sourcing, ethical production, and respecting ancient Indian
            wellness traditions. Every product is crafted with attention to quality, purity, and
            authenticity.
          </p>
        </div>

        <div className="flex justify-center">
          <img
            src="/images/divantraa-logo-main.jpeg"
            alt="About Divantraa"
            className="w-100 h-100 object-contain"
          />
        </div>
      </section>

      {/* Vision Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold text-[#235a45] mb-3">Our Vision</h3>
            <p className="text-gray-600">
              To create pure, toxin-free wellness essentials that empower people to live healthier,
              more natural lifestyles.
            </p>
          </div>

          <div className="bg-white shadow rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold text-[#235a45] mb-3">Our Mission</h3>
            <p className="text-gray-600">
              To promote traditional Indian wellness practices and bring handcrafted, eco-friendly
              products to every household.
            </p>
          </div>

          <div className="bg-white shadow rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold text-[#235a45] mb-3">Why Choose Us?</h3>
            <p className="text-gray-600">
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
