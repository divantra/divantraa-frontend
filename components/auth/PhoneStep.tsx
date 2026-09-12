"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { useSendOtp } from "@/hooks/useAuth";

interface PhoneStepProps {
  onOtpSent: (phone: string) => void;
}

/**
 * Collects a 10-digit mobile number. As soon as the 10th digit is typed,
 * the OTP is sent automatically — there is no "Send OTP" button, matching
 * the requested Divantraa-style flow.
 */
export function PhoneStep({ onOtpSent }: PhoneStepProps) {
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const sendOtp = useSendOtp();
  const hasAutoSubmitted = useRef(false);

  const isValid = /^[6-9]\d{9}$/.test(phone);

  useEffect(() => {
    if (isValid && !hasAutoSubmitted.current && !sendOtp.isPending) {
      hasAutoSubmitted.current = true;
      sendOtp.mutate(phone, {
        onSuccess: () => onOtpSent(phone),
        onError: () => {
          // allow retry if the send failed
          hasAutoSubmitted.current = false;
        },
      });
    }
    if (!isValid) {
      hasAutoSubmitted.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, isValid]);

  function handleChange(raw: string) {
    const digitsOnly = raw.replace(/\D/g, "").slice(0, 10);
    setPhone(digitsOnly);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full"
    >
      <h1 className="font-display text-3xl text-ink mb-2">Log in or sign up</h1>
      <p className="text-ink/60 mb-8 text-sm">
        We&apos;ll text you a code to verify your number — no password needed.
      </p>

      <label className="block text-sm font-medium text-ink/70 mb-2">Mobile number</label>
      <div
        className={`flex items-center rounded-xl border-2 bg-white px-4 py-3 transition-colors ${
          touched && !isValid && phone.length > 0
            ? "border-red-400"
            : "border-ink/10 focus-within:border-leaf"
        }`}
      >
        <span className="flex items-center gap-1 pr-3 mr-3 border-r border-ink/10 text-ink/70">
          <Phone size={16} className="text-leaf" />
          +91
        </span>
        <input
          type="tel"
          inputMode="numeric"
          autoFocus
          placeholder="9XXXX XXXXX"
          value={phone}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => setTouched(true)}
          className="flex-1 bg-transparent outline-none text-lg tracking-wide text-ink placeholder:text-ink/30"
          maxLength={10}
        />
        {sendOtp.isPending && (
          <span className="text-xs text-leaf animate-pulse">Sending&nbsp;OTP…</span>
        )}
      </div>

      {touched && phone.length > 0 && !isValid && (
        <p className="mt-2 text-xs text-red-500">Enter a valid 10-digit mobile number</p>
      )}
      {sendOtp.isError && (
        <p className="mt-2 text-xs text-red-500">Couldn&apos;t send OTP. Please check the number and try again.</p>
      )}

      <p className="mt-6 text-xs text-ink/40 leading-relaxed">
        By continuing, you agree to Divantraa&apos;s Terms of Service and Privacy Policy.
      </p>
    </motion.div>
  );
}
