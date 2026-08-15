"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useCompleteProfile } from "@/hooks/useAuth";

interface ProfileStepProps {
  onComplete: () => void;
}

/**
 * Shown only to first-time users right after OTP verification succeeds.
 * Returning users skip this entirely and land on /account.
 */
export function ProfileStep({ onComplete }: ProfileStepProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const completeProfile = useCompleteProfile();

  const isValid = name.trim().length >= 2;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    completeProfile.mutate(
      { name: name.trim(), email: email.trim() || undefined },
      { onSuccess: onComplete }
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full"
    >
      <h1 className="font-display text-3xl text-ink mb-2">Welcome to Divantraa 🌿</h1>
      <p className="text-ink/60 mb-8 text-sm">
        Just a couple of details before we get you shopping.
      </p>

      <label className="block text-sm font-medium text-ink/70 mb-2">Full name</label>
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="w-full rounded-xl border-2 border-ink/10 focus:border-leaf bg-white px-4 py-3 text-lg text-ink outline-none mb-5 transition-colors"
      />

      <label className="block text-sm font-medium text-ink/70 mb-2">
        Email <span className="text-ink/40 font-normal">(optional)</span>
      </label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-xl border-2 border-ink/10 focus:border-leaf bg-white px-4 py-3 text-lg text-ink outline-none mb-8 transition-colors"
      />

      {completeProfile.isError && (
        <p className="mb-4 text-xs text-red-500">Something went wrong. Please try again.</p>
      )}

      <button
        type="submit"
        disabled={!isValid || completeProfile.isPending}
        className="w-full rounded-xl bg-leaf py-3.5 text-white font-medium text-lg transition-opacity disabled:opacity-40 hover:opacity-90"
      >
        {completeProfile.isPending ? "Saving…" : "Continue"}
      </button>
    </motion.form>
  );
}
