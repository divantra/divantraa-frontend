import { Droplet, FlaskConical, Leaf } from "lucide-react";

const badges = [
  { icon: Droplet, label: "A2 Cow Ghee" },
  { icon: Leaf, label: "Wood Cold Pressed" },
  { icon: FlaskConical, label: "Lab Tested" },
];

export function TrustBadges() {
  return (
    <section className="border-y border-ink/5 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
        {badges.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-ink/70">
            <Icon size={18} className="text-leaf" />
            <span className="text-sm font-medium">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
