"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Pencil } from "lucide-react";
import { useSendOtp, useResendOtp, useVerifyOtp } from "@/hooks/useAuth";
import { getAxiosErrorMessage } from "@/lib/errorUtils";

interface OtpStepProps {
  phone: string;
  onEditPhone: () => void;
  onVerified: (isNewUser: boolean) => void;
}

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

/**
 * 6 individual OTP boxes. As soon as all 6 digits are filled, verification
 * fires automatically — there is no "Verify" button. Includes an "Edit"
 * link to go back and correct the phone number, and a resend-OTP timer.
 *
 * Resend uses POST /auth/otp/resend (dedicated endpoint, separately rate-limited).
 */
export function OtpStep({ phone, onEditPhone, onVerified }: OtpStepProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resendError, setResendError] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const hasAutoSubmitted = useRef(false);

  const sendOtp = useSendOtp();     // for initial send (not used here)
  const resendOtp = useResendOtp(); // for explicit resend
  const verifyOtp = useVerifyOtp();

  const code = digits.join("");
  const isComplete = digits.every((d) => d !== "");

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Countdown timer for resend button
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  // Auto-verify the instant the 6th digit is entered
  useEffect(() => {
    if (isComplete && !hasAutoSubmitted.current && !verifyOtp.isPending) {
      hasAutoSubmitted.current = true;
      verifyOtp.mutate(
        { phone, code },
        {
          onSuccess: (data) => onVerified(data.isNewUser),
          onError: () => {
            hasAutoSubmitted.current = false;
            // Clear boxes so the user can retry immediately
            setDigits(Array(OTP_LENGTH).fill(""));
            inputsRef.current[0]?.focus();
          },
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, code]);

  function handleDigitChange(index: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);

    if (char && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (pasted.length === OTP_LENGTH) {
      e.preventDefault();
      setDigits(pasted.split(""));
      inputsRef.current[OTP_LENGTH - 1]?.focus();
    }
  }

  function handleResend() {
    setResendError(null);
    hasAutoSubmitted.current = false;
    setDigits(Array(OTP_LENGTH).fill(""));
    setSecondsLeft(RESEND_SECONDS);
    resendOtp.mutate(phone, {
      onError: (err) => {
        const msg = getAxiosErrorMessage(err);
        setResendError(msg);
      },
    });
    inputsRef.current[0]?.focus();
  }

  // Derive a friendly error message for verify errors
  const verifyErrorMessage = (() => {
    if (!verifyOtp.isError) return null;
    const status = (verifyOtp.error as any)?.response?.status;
    if (status === 403) {
      const msg: string = (verifyOtp.error as any)?.response?.data?.message ?? "";
      if (msg.toLowerCase().includes("block")) return "Your account has been blocked. Please contact support.";
      if (msg.toLowerCase().includes("deactivat") || msg.toLowerCase().includes("inactiv"))
        return "Your account is deactivated. Please contact support to reactivate.";
      return msg || "Access denied. Please contact support.";
    }
    return "That code didn't work. Try again.";
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full"
    >
      <h1 className="font-display text-3xl text-ink mb-2">Enter the code</h1>
      <p className="text-ink/60 mb-1 text-sm">
        We sent a {OTP_LENGTH}-digit code to +91 {phone}
      </p>
      <button
        type="button"
        onClick={onEditPhone}
        className="inline-flex items-center gap-1 text-sm text-leaf font-medium mb-8 hover:underline"
      >
        <Pencil size={13} /> Edit number
      </button>

      <div className="flex gap-2.5 justify-start" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`h-14 w-11 rounded-xl border-2 text-center text-2xl font-semibold text-ink outline-none transition-colors bg-white ${
              verifyOtp.isError
                ? "border-red-400"
                : digit
                ? "border-leaf"
                : "border-ink/10 focus:border-leaf"
            }`}
          />
        ))}
      </div>

      <div className="mt-4 min-h-5">
        {verifyOtp.isPending && (
          <p className="text-xs text-leaf animate-pulse">Verifying…</p>
        )}
        {verifyErrorMessage && (
          <p className="text-xs text-red-500">{verifyErrorMessage}</p>
        )}
      </div>

      <div className="mt-6 text-sm text-ink/60">
        {secondsLeft > 0 ? (
          <span>Resend code in 0:{secondsLeft.toString().padStart(2, "0")}</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-leaf font-medium hover:underline"
            disabled={resendOtp.isPending}
          >
            {resendOtp.isPending ? "Resending…" : "Resend code"}
          </button>
        )}
      </div>
      {resendError && (
        <p className="mt-1 text-xs text-red-500">{resendError}</p>
      )}
    </motion.div>
  );
}
