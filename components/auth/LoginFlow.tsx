"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { PhoneStep } from "./PhoneStep";
import { OtpStep } from "./OtpStep";
import { ProfileStep } from "./ProfileStep";

type Step = "phone" | "otp" | "profile";

/**
 * Full login/signup flow:
 *  1. Phone number -> OTP auto-sent at 10 digits (no button)
 *  2. OTP -> auto-verified at 4 digits (no button), can edit phone
 *  3a. New user  -> collect name/email, then -> /account
 *  3b. Existing user -> straight to /account
 */
export function LoginFlow() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const router = useRouter();

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
                router.replace("/account");
              }
            }}
          />
        )}

        {step === "profile" && (
          <ProfileStep key="profile" onComplete={() => router.replace("/account")} />
        )}
      </AnimatePresence>
    </div>
  );
}
