"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/store/useUiStore";
import { useCartStore } from "@/store/useCartStore";
import { applyOtpInput, applyOtpPaste } from "@/lib/otp";
import { useSendOtp, useResendOtp, useVerifyOtp } from "@/hooks/useAuth";
import { ProfileStep } from "./ProfileStep";
import { getAxiosErrorMessage, getAxiosErrorStatus } from "@/lib/errorUtils";
import { getImageUrl } from "@/lib/image.utils";

type ModalStep = "phone" | "otp" | "profile" | "done";

/** Shown briefly on success, then closes (and continues to checkout when the cart has items). */
function AutoRedirectDone({ onClose, toCheckout }: { onClose: () => void; toCheckout: boolean }) {
  useEffect(() => {
    const t = setTimeout(onClose, 900);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="text-center py-6">
      <div className="text-4xl mb-3">🎉</div>
      <p className="font-display text-xl text-ink">You&apos;re signed in!</p>
      <p className="text-sm text-ink/50 mt-1">{toCheckout ? "Taking you to checkout…" : "Welcome back."}</p>
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
  const { isLoginModalOpen, closeLoginModal, loginNotice } = useUiStore();
  const router = useRouter();
  const [step, setStep] = useState<ModalStep>("phone");
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resendTimerActive, setResendTimerActive] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);

  // Stable reference so AutoRedirectDone's useEffect([onClose]) never
  // resets the timeout when the parent re-renders during the 900 ms wait.
  // After signing in, carry on to checkout when there is something in the cart;
  // otherwise just close the modal and leave the customer where they were.
  const hasCartItems = useCartStore((s) => s.items.length > 0);
  const handleDone = useCallback(() => {
    closeLoginModal();
    if (useCartStore.getState().items.length > 0) router.push("/checkout");
  }, [closeLoginModal, router]);

  // Prevent background body scroll while modal is open
  useEffect(() => {
    if (!isLoginModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isLoginModalOpen]);

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

  // Shared by typing, pasting a whole code, and SMS autofill.
  function commitDigits(next: string[], focusIndex: number) {
    setDigits(next);
    document.getElementById(`modal-otp-${focusIndex}`)?.focus();

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

  function handleDigitChange(index: number, value: string) {
    const r = applyOtpInput(digits, index, value, OTP_LENGTH);
    commitDigits(r.digits, r.focusIndex);
  }

  function handleDigitPaste(index: number, e: React.ClipboardEvent<HTMLInputElement>) {
    const r = applyOtpPaste(digits, index, e.clipboardData.getData("text"), OTP_LENGTH);
    if (!r) return;
    e.preventDefault();
    commitDigits(r.digits, r.focusIndex);
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
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          >
            {/* Outer Wrapper with headroom for top center close icon */}
            <div className="relative w-full max-w-[380px] sm:max-w-[430px] my-auto pt-6 pb-2">
              {/* Top-center floating circular close button (matching reference) */}
              <button
                onClick={handleClose}
                aria-label="Close"
                className="absolute top-1 left-1/2 -translate-x-1/2 z-30 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white shadow-xl flex items-center justify-center text-ink/80 hover:text-ink hover:scale-105 active:scale-95 transition-all focus:outline-none"
              >
                <X size={16} strokeWidth={2.5} />
              </button>

              {/* Reduced Height Full HD Card */}
              <div className="relative w-full min-h-[500px] sm:min-h-[520px] rounded-[24px] sm:rounded-[28px] overflow-hidden shadow-2xl flex flex-col justify-end">
                {/* ── Full HD Background Image ── */}
                <div className="absolute inset-0 z-0">
                  <Image
                    src={getImageUrl('public/login/Login_Modal_Bg.png')}
                    alt="Divantraa - Pure Beginnings"
                    fill
                    quality={100}
                    unoptimized
                    priority
                    className="object-cover object-top select-none pointer-events-none"
                  />
                  {/* Black overlay on image */}
                  <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                </div>

                {/* ── Bottom Form Area (firmly pinned to bottom) ── */}
                <div className="relative z-10 p-3 sm:p-4 mt-auto w-full">
                  <div className="w-full rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl p-5 sm:p-6 border border-ink/5">
                    {loginNotice && (
                      <p role="status" className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-800">
                        {loginNotice}
                      </p>
                    )}

                    {/* ── Step: Phone ── */}
                    {step === "phone" && (
                      <>
                        <h2 className="text-center font-display text-xl sm:text-2xl font-bold text-ink mb-5 sm:mb-6">
                          Sign In
                        </h2>

                        <div className="flex items-stretch rounded-xl border border-ink/20 focus-within:border-forest focus-within:ring-1 focus-within:ring-forest overflow-hidden transition-all bg-white">
                          <span className="flex items-center gap-1.5 px-3 bg-white text-sm font-medium text-ink border-r border-ink/15 shrink-0 select-none">
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
                            className="flex-1 px-3 py-3 text-sm text-ink placeholder:text-ink/40 outline-none bg-transparent min-w-0 font-normal"
                          />
                          <button
                            onClick={triggerSendOtp}
                            disabled={!isPhoneValid || sendOtp.isPending}
                            className="px-5 sm:px-6 bg-[#004e42] hover:bg-[#003d34] text-white text-sm font-semibold disabled:opacity-40 hover:opacity-95 transition-all shrink-0 flex items-center justify-center"
                          >
                            {sendOtp.isPending ? "…" : "Login"}
                          </button>
                        </div>

                        {sendOtp.isError && (
                          <p className="mt-2 text-xs text-red-500">
                            {getAxiosErrorMessage(sendOtp.error, "Couldn't send OTP. Try again.")}
                          </p>
                        )}

                        <p className="mt-4 flex items-start gap-1.5 text-[11px] sm:text-xs text-ink/60 leading-relaxed">
                          <span className="text-xs font-semibold leading-none mt-0.5">ⓘ</span>
                          <span>
                            By proceeding, you are agreeing to our{" "}
                            <a
                              href="/policies/terms"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold underline text-ink/75 hover:text-forest"
                            >
                              T&amp;C
                            </a>{" "}
                            and{" "}
                            <a
                              href="/policies/privacy"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold underline text-ink/75 hover:text-forest"
                            >
                              Privacy Policy
                            </a>
                            .
                          </span>
                        </p>
                      </>
                    )}

                    {/* ── Step: OTP ── */}
                    {step === "otp" && (
                      <>
                        <h2 className="text-center font-display text-xl sm:text-2xl font-bold text-ink mb-1">
                          Enter OTP
                        </h2>
                        <p className="text-center text-xs sm:text-sm text-ink/60 mb-1">
                          Sent to +91 {phone}
                        </p>
                        <button
                          onClick={() => {
                            setStep("phone");
                            setDigits(Array(OTP_LENGTH).fill(""));
                            setBlockError(null);
                          }}
                          className="block mx-auto text-xs text-leaf font-medium mb-4 hover:underline"
                        >
                          Edit number
                        </button>

                        <div className="flex justify-center gap-1.5 sm:gap-2 mb-3">
                          {digits.map((digit, i) => (
                            <input
                              key={i}
                              id={`modal-otp-${i}`}
                              type="tel"
                              inputMode="numeric"
                              autoComplete={i === 0 ? "one-time-code" : "off"}
                              value={digit}
                              onChange={(e) => handleDigitChange(i, e.target.value)}
                              onPaste={(e) => handleDigitPaste(i, e)}
                              onKeyDown={(e) => {
                                if (e.key === "Backspace" && !digits[i] && i > 0) {
                                  document.getElementById(`modal-otp-${i - 1}`)?.focus();
                                }
                              }}
                              className={`h-11 w-9 sm:h-12 sm:w-10 rounded-lg border-2 text-center text-lg font-semibold outline-none transition-colors ${verifyOtp.isError || blockError
                                ? "border-red-400"
                                : digit
                                  ? "border-leaf"
                                  : "border-ink/15 focus:border-leaf"
                                }`}
                            />
                          ))}
                        </div>

                        <div className="text-center text-xs min-h-5 mb-2">
                          {verifyOtp.isPending && <span className="text-leaf">Verifying…</span>}
                          {blockError && <span className="text-red-500">{blockError}</span>}
                          {verifyOtp.isError && !blockError && (
                            <span className="text-red-500">Incorrect code, try again</span>
                          )}
                        </div>

                        {/* Resend Timer */}
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

                    {/* ── Step: Profile (new users only) ── */}
                    {step === "profile" && <ProfileStep onComplete={() => setStep("done")} />}

                    {/* ── Step: Done ── */}
                    {step === "done" && (
                      <AutoRedirectDone onClose={handleDone} toCheckout={hasCartItems} />
                    )}
                  </div>

                  {/* ── Footer Branding (over bottom grass, matching reference) ── */}
                  <div className="mt-3 text-center">
                    <p className="text-[11px] font-medium text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] tracking-wide flex items-center justify-center gap-1.5">
                      <span>Powered by</span>
                      <span className="font-semibold text-white">Divantraa</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
