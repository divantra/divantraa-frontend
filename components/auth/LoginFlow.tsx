"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { PhoneStep } from "./PhoneStep";
import { OtpStep } from "./OtpStep";
import { ProfileStep } from "./ProfileStep";
import { useCartStore } from "@/store/useCartStore";

type Step = "phone" | "otp" | "profile";

/**
 * Full login/signup flow:
 *  1. Phone number -> OTP auto-sent at 10 digits (no button)
 *  2. OTP -> auto-verified at 6 digits (no button), can edit phone
 *  3a. New user  -> collect name/email, then -> checkout (cart has items) or home
 *  3b. Existing user -> straight to checkout (cart has items) or home
 */
export function LoginFlow() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const router = useRouter();

  // Signed in: continue to checkout when there is something in the cart, otherwise go home.
  const goAfterLogin = () => router.replace(useCartStore.getState().items.length > 0 ? "/checkout" : "/");

  return (
    <div className="w-full max-w-sm mx-auto">
      <AnimatePresence mode="wait">
        {step === "phone" && (
          <PhoneStep
            key="phone"
            onOtpSent={(p) => {
              setPhone(p);
              setStep("otp");
            }}
          />
        )}

        {step === "otp" && (
          <OtpStep
            key="otp"
            phone={phone}
            onEditPhone={() => setStep("phone")}
            onVerified={(isNewUser) => {
              if (isNewUser) {
                setStep("profile");
              } else {
                goAfterLogin();
              }
            }}
          />
        )}

        {step === "profile" && (
          <ProfileStep key="profile" onComplete={goAfterLogin} />
        )}
      </AnimatePresence>
    </div>
  );
}
