"use client";

import { useState } from "react";
import { Droplet, FlaskConical, Leaf, Star } from "lucide-react";

const badges = [
  { icon: Star, label: "All", slug: "all" },
  { icon: Droplet, label: "A2 Cow Ghee", slug: "ghee" },
  { icon: Leaf, label: "Wood Cold Pressed", slug: "oils" },
  { icon: FlaskConical, label: "Lab Tested", slug: "lab" },
];

export function TrustBadges() {
  const [active, setActive] = useState("all");

  return (
    <section className="border-y border-gray-200 bg-white">
      {/* Heading */}
      <div className="text-center py-8 flex flex-col items-center gap-2">
        <h4 className="text-4xl md:text-4xl font-bold text-[#235a45] font-serif font-light">
          Welcome To Divantraa!
        </h4>
        <p className="text-lg md:text-4xl text-[#235a45] font-serif font-semibold">
          You're One Step Closer to Purity
        </p>
      </div>

      {/* Badges */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-wrap items-center justify-center gap-8">
        {badges.map(({ icon: Icon, label, slug }) => (
          <button
            key={slug}
            onClick={() => setActive(slug)}
            className={`flex flex-col items-center justify-center gap-2 transition-colors relative pb-1
              ${active === slug ? "text-[#235a45]" : "text-gray-400 hover:text-[#407a4a]"}`}
          >
            <Icon
              size={32}
              className={`transition-transform ${
                active === slug ? "scale-110 text-[#407a4a]" : "text-gray-400"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                active === slug ? "text-[#235a45]" : "text-gray-500"
              }`}
            >
              {label}
            </span>

            {/* Active underline */}
            {active === slug && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#407a4a] rounded-full"></span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
