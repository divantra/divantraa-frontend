"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useUiStore } from "@/store/useUiStore";
import { useSendOtp, useVerifyOtp } from "@/hooks/useAuth";
import { ProfileStep } from "./ProfileStep";

type ModalStep = "phone" | "otp" | "profile" | "done";

const OTP_LENGTH = 4;

/**
 * Sign-in modal styled to match the reference design:
 *  - sits over the page as an overlay (promo bar / header stay visible behind)
 *  - top banner image with brand mark
 *  - white card below with a single inline "+91 | phone input | Login" row
 *  - close (X) button
 *
 * Behavior still follows the requested no-extra-click flow:
 *  - Typing the 10th digit auto-sends the OTP (the Login button is a
 *    fallback for anyone who prefers to tap it explicitly).
 *  - Once 4 OTP digits are filled, verification fires automatically.
 *  - New users see a short name/email step; returning users close
 *    straight into their session.
 */
export function LoginModal() {
  const { isLoginModalOpen, closeLoginModal } = useUiStore();
  const [step, setStep] = useState<ModalStep>("phone");
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();

  const isPhoneValid = /^[6-9]\d{9}$/.test(phone);

  function reset() {
    setStep("phone");
    setPhone("");
    setDigits(Array(OTP_LENGTH).fill(""));
  }

  function handleClose() {
    closeLoginModal();
    setTimeout(reset, 300); // wait for exit animation
  }

  function triggerSendOtp() {
    if (!isPhoneValid || sendOtp.isPending) return;
    sendOtp.mutate(phone, { onSuccess: () => setStep("otp") });
  }

  function handleDigitChange(index: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);

    const el = document.getElementById(`modal-otp-${index + 1}`);
    if (char && el) el.focus();

    if (next.every((d) => d !== "")) {
      verifyOtp.mutate(
        { phone, code: next.join("") },
        {
          onSuccess: (data) => setStep(data.isNewUser ? "profile" : "done"),
          onError: () => setDigits(Array(OTP_LENGTH).fill("")),
        }
      );
    }
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
                    src="/images/1740116888717_popup_940x-250.jpg"
                    alt=""
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-black/40" />
                </div>

                {/* Form content */}
                <div className="relative z-10 flex flex-col justify-end p-6 min-h-[550px]">
                  <span className="absolute top-4 right-4 font-display text-lg text-white tracking-wide">
                      Divantraa
                  </span>
                  
                  <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
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
                              if (v.length === 10) {
                                setTimeout(() => {
                                  if (/^[6-9]\d{9}$/.test(v)) {
                                    sendOtp.mutate(v, { onSuccess: () => setStep("otp") });
                                  }
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
                          <p className="mt-2 text-xs text-red-500">Couldn&apos;t send OTP. Try again.</p>
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
                          }}
                          className="block mx-auto text-xs text-leaf font-medium mb-5 hover:underline"
                        >
                          Edit number
                        </button>
                        <div className="flex justify-center gap-3 mb-3">
                          {digits.map((digit, i) => (
                            <input
                              key={i}
                              id={`modal-otp-${i}`}
                              type="tel"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleDigitChange(i, e.target.value)}
                              className="h-12 w-11 rounded-lg border-2 border-ink/15 focus:border-leaf text-center text-lg font-semibold outline-none"
                            />
                          ))}
                        </div>
                        <p className="text-center text-xs h-4 text-leaf">
                          {verifyOtp.isPending && "Verifying…"}
                          {verifyOtp.isError && <span className="text-red-500">Incorrect code, try again</span>}
                        </p>
                      </>
                    )}

                    {step === "profile" && <ProfileStep onComplete={() => setStep("done")} />}

                    {step === "done" && (
                      <div className="text-center py-4">
                        <p className="font-display text-xl text-ink mb-2">You&apos;re signed in 🎉</p>
                        <button
                          onClick={handleClose}
                          className="mt-2 rounded-full bg-leaf text-white text-sm font-medium px-6 py-2.5 hover:opacity-90"
                        >
                          Continue
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-center text-xs text-white/60 pt-4">Powered by Shiprocket</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
