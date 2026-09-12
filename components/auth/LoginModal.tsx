"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/store/useUiStore";
import { useSendOtp, useResendOtp, useVerifyOtp } from "@/hooks/useAuth";
import { ProfileStep } from "./ProfileStep";
import { getAxiosErrorMessage, getAxiosErrorStatus } from "@/lib/errorUtils";

type ModalStep = "phone" | "otp" | "profile" | "done";

/** Shown briefly on success then closes + redirects to /account. */
function AutoRedirectDone({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 900);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="text-center py-6">
      <div className="text-4xl mb-3">🎉</div>
      <p className="font-display text-xl text-ink">You&apos;re signed in!</p>
      <p className="text-sm text-ink/50 mt-1">Taking you to your account…</p>
    </div>
  );
}

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

/**
 * Sign-in modal: phone → OTP → profile (new users only) → done.
 *
 * Typing the 10th digit auto-sends the OTP.
 * Once all 6 OTP digits are filled, verification fires automatically.
 * New users see a short name/email step; returning users close straight into session.
 */
export function LoginModal() {
  const { isLoginModalOpen, closeLoginModal } = useUiStore();
  const router = useRouter();
  const [step, setStep] = useState<ModalStep>("phone");
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resendTimerActive, setResendTimerActive] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);

  // Stable reference so AutoRedirectDone's useEffect([onClose]) never
  // resets the timeout when the parent re-renders during the 900 ms wait.
  const handleDone = useCallback(() => {
    closeLoginModal();
    router.push("/account");
  }, [closeLoginModal, router]);

  const sendOtp = useSendOtp();
  const resendOtp = useResendOtp();
  const verifyOtp = useVerifyOtp();

  const isPhoneValid = /^[6-9]\d{9}$/.test(phone);

  function reset() {
    setStep("phone");
    setPhone("");
    setDigits(Array(OTP_LENGTH).fill(""));
    setSecondsLeft(RESEND_SECONDS);
    setResendTimerActive(false);
    setBlockError(null);
  }

  function handleClose() {
    closeLoginModal();
    setTimeout(reset, 300); // wait for exit animation
  }

  function startResendTimer() {
    setResendTimerActive(true);
    setSecondsLeft(RESEND_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(interval); setResendTimerActive(false); return 0; }
        return s - 1;
      });
    }, 1000);
  }

  function triggerSendOtp() {
    if (!isPhoneValid || sendOtp.isPending) return;
    sendOtp.mutate(phone, {
      onSuccess: () => {
        setStep("otp");
        startResendTimer();
      },
    });
  }

  function handleDigitChange(index: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);

    // Advance focus
    const nextEl = document.getElementById(`modal-otp-${index + 1}`);
    if (char && nextEl) nextEl.focus();

    // Auto-verify when all filled
    if (next.every((d) => d !== "")) {
      setBlockError(null);
      verifyOtp.mutate(
        { phone, code: next.join("") },
        {
          onSuccess: (data) => setStep(data.isNewUser ? "profile" : "done"),
          onError: (err) => {
            const status = getAxiosErrorStatus(err);
            if (status === 403) {
              const msg = getAxiosErrorMessage(err);
              setBlockError(
                msg.toLowerCase().includes("block")
                  ? "Your account has been blocked. Please contact support."
                  : "Your account is deactivated. Contact support to reactivate."
              );
            }
            setDigits(Array(OTP_LENGTH).fill(""));
            // Re-focus first input
            setTimeout(() => document.getElementById("modal-otp-0")?.focus(), 50);
          },
        }
      );
    }
  }

  function handleResend() {
    setDigits(Array(OTP_LENGTH).fill(""));
    setBlockError(null);
    resendOtp.mutate(phone, { onSuccess: () => startResendTimer() });
    setTimeout(() => document.getElementById("modal-otp-0")?.focus(), 50);
  }

  return (
    <AnimatePresence>
      {isLoginModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 z-[60]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-md">
              <button
                onClick={handleClose}
                aria-label="Close"
                className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 h-6 w-6 rounded-full bg-white/90 flex items-center justify-center text-ink hover:bg-white"
              >
                <X size={14} />
              </button>

              <div className="relative w-full rounded-2xl overflow-hidden bg-forest shadow-2xl">
                {/* Full background image */}
                <div className="absolute inset-0">
                  <Image
                    src="/images/divantraa-logo-main.jpeg"
                    alt=""
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-black/30" />
                </div>

                {/* Form content */}
                <div className="relative z-10 flex flex-col justify-end p-6 min-h-[550px]">
                  <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">

                    {/* ── Phone step ── */}
                    {step === "phone" && (
                      <>
                        <h2 className="text-center font-display text-2xl text-ink mb-6">Sign In</h2>
                        <div className="flex items-stretch rounded-lg border border-ink/15 overflow-hidden">
                          <span className="flex items-center gap-1 px-3 bg-cream text-sm text-ink/70 border-r border-ink/15">
                            🇮🇳 +91
                          </span>
                          <input
                            type="tel"
                            inputMode="numeric"
                            autoFocus
                            maxLength={10}
                            placeholder="10-digit mobile number"
                            value={phone}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                              setPhone(v);
                              if (v.length === 10 && /^[6-9]\d{9}$/.test(v)) {
                                setTimeout(() => {
                                  sendOtp.mutate(v, {
                                    onSuccess: () => {
                                      setStep("otp");
                                      startResendTimer();
                                    },
                                  });
                                }, 0);
                              }
                            }}
                            className="flex-1 px-3 py-3 text-sm outline-none min-w-0"
                          />
                          <button
                            onClick={triggerSendOtp}
                            disabled={!isPhoneValid || sendOtp.isPending}
                            className="px-6 bg-forest text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
                          >
                            {sendOtp.isPending ? "…" : "Login"}
                          </button>
                        </div>
                        {sendOtp.isError && (
                          <p className="mt-2 text-xs text-red-500">
                            {getAxiosErrorMessage(sendOtp.error, "Couldn't send OTP. Try again.")}
                          </p>
                        )}
                        <p className="mt-4 flex items-start gap-1.5 text-xs text-ink/50 leading-relaxed">
                          <span>ⓘ</span>
                          <span>
                            By proceeding, you are agreeing to our{" "}
                            <a href="#" className="underline">T&amp;C</a> and{" "}
                            <a href="#" className="underline">Privacy Policy</a>.
                          </span>
                        </p>
                      </>
                    )}

                    {/* ── OTP step ── */}
                    {step === "otp" && (
                      <>
                        <h2 className="text-center font-display text-2xl text-ink mb-1">Enter OTP</h2>
                        <p className="text-center text-sm text-ink/50 mb-1">
                          Sent to +91 {phone}
                        </p>
                        <button
                          onClick={() => {
                            setStep("phone");
                            setDigits(Array(OTP_LENGTH).fill(""));
                            setBlockError(null);
                          }}
                          className="block mx-auto text-xs text-leaf font-medium mb-5 hover:underline"
                        >
                          Edit number
                        </button>

                        <div className="flex justify-center gap-2 mb-3">
                          {digits.map((digit, i) => (
                            <input
                              key={i}
                              id={`modal-otp-${i}`}
                              type="tel"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleDigitChange(i, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Backspace" && !digits[i] && i > 0) {
                                  document.getElementById(`modal-otp-${i - 1}`)?.focus();
                                }
                              }}
                              className={`h-12 w-10 rounded-lg border-2 text-center text-lg font-semibold outline-none transition-colors ${
                                (verifyOtp.isError || blockError)
                                  ? "border-red-400"
                                  : digit ? "border-leaf" : "border-ink/15 focus:border-leaf"
                              }`}
                            />
                          ))}
                        </div>

                        <div className="text-center text-xs min-h-5 mb-3">
                          {verifyOtp.isPending && <span className="text-leaf">Verifying…</span>}
                          {blockError && (
                            <span className="text-red-500">{blockError}</span>
                          )}
                          {verifyOtp.isError && !blockError && (
                            <span className="text-red-500">Incorrect code, try again</span>
                          )}
                        </div>

                        {/* Resend */}
                        <div className="text-center text-xs text-ink/60">
                          {resendTimerActive ? (
                            <span>Resend in 0:{secondsLeft.toString().padStart(2, "0")}</span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleResend}
                              disabled={resendOtp.isPending}
                              className="text-leaf font-medium hover:underline"
                            >
                              {resendOtp.isPending ? "Resending…" : "Resend OTP"}
                            </button>
                          )}
                        </div>
                        {resendOtp.isError && (
                          <p className="text-center text-xs text-red-500 mt-1">
                            {getAxiosErrorMessage(resendOtp.error, "Resend failed. Try again.")}
                          </p>
                        )}
                      </>
                    )}

                    {/* ── Profile step (new users only) ── */}
                    {step === "profile" && <ProfileStep onComplete={() => setStep("done")} />}

                    {/* ── Done — auto-redirect to /account ── */}
                    {step === "done" && (
                      <AutoRedirectDone onClose={handleDone} />
                    )}
                  </div>
                  <p className="text-center text-xs text-white/60 pt-4">Divantraa — Farm to Home</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
