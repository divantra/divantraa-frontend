import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-20 text-center">
      <h1 className="font-display text-5xl text-ink mb-4">404</h1>
      <h2 className="text-xl font-medium text-ink/80 mb-2">Page Not Found</h2>
      <p className="text-ink/60 mb-8 max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link
        href="/"
        className="rounded-full bg-forest text-cream px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Back to Home
      </Link>
    </main>
  );
}
