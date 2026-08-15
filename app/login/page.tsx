import { LoginFlow } from "@/components/auth/LoginFlow";

export const metadata = { title: "Log in — Divantraa" };

export default function LoginPage() {
  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-cream">
      {/* Left: brand panel (hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between bg-forest text-cream p-12 relative overflow-hidden">
        <div className="relative z-10">
          <span className="font-display text-2xl tracking-wide">Divantraa</span>
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-4xl leading-tight mb-4">
            Straight from the farm, to your family.
          </h2>
          <p className="text-cream/70 text-sm leading-relaxed">
            A2 ghee, wood cold-pressed oils and lab-tested essentials — sourced with
            traceability at every step.
          </p>
        </div>
        <div className="relative z-10 text-xs text-cream/40">
          © {new Date().getFullYear()} Divantraa Farm
        </div>
        {/* subtle decorative gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(211,162,74,0.25),transparent_60%)]" />
      </div>

      {/* Right: login flow */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <LoginFlow />
      </div>
    </main>
  );
}
