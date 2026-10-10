"use client";

import { useState, useEffect } from "react";
import { Truck, MapPin, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { detectCurrentAddress } from "@/lib/geolocation";

interface ProductShippingNoticeProps {
  freeShippingThreshold?: number;
  className?: string;
}

const PINCODE_STORAGE_KEY = "divantraa_delivery_pincode";

export function ProductShippingNotice({
  freeShippingThreshold = 499,
  className = "my-6",
}: ProductShippingNoticeProps) {
  const [pincode, setPincode] = useState("");
  const [checking, setChecking] = useState(false);
  const [locating, setLocating] = useState(false);
  const [verifiedPincode, setVerifiedPincode] = useState<string | null>(null);
  const [cityState, setCityState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load previously saved pincode from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PINCODE_STORAGE_KEY);
      if (saved && /^\d{6}$/.test(saved)) {
        setPincode(saved);
        setVerifiedPincode(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleCheck = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    const cleanPin = pincode.trim();

    if (!/^\d{6}$/.test(cleanPin)) {
      setError("Please enter a valid 6-digit pincode.");
      setVerifiedPincode(null);
      return;
    }

    setChecking(true);
    // Simulate instant delivery estimate calculation
    setTimeout(() => {
      setVerifiedPincode(cleanPin);
      setChecking(false);
      try {
        localStorage.setItem(PINCODE_STORAGE_KEY, cleanPin);
      } catch {
        // ignore
      }
    }, 250);
  };

  const handleDetectLocation = async () => {
    setError(null);
    setLocating(true);
    try {
      const res = await detectCurrentAddress();
      if (res?.pincode) {
        setPincode(res.pincode);
        setVerifiedPincode(res.pincode);
        if (res.city || res.state) {
          setCityState([res.city, res.state].filter(Boolean).join(", "));
        }
        localStorage.setItem(PINCODE_STORAGE_KEY, res.pincode);
      } else {
        setError("Could not detect pincode. Please enter manually.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to fetch location.";
      setError(msg);
    } finally {
      setLocating(false);
    }
  };

  // Compute estimated delivery date (current date + 3 to 4 business days)
  const getEstimatedDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className={`rounded-2xl border border-forest/15 bg-forest/[0.03] p-4 sm:p-5 transition-all ${className}`}
    >
      {/* ── Top Shipping Banner ─────────────────────────────────── */}
      <div className="flex items-start gap-3 sm:gap-3.5 mb-4">
        <div className="h-10 w-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center shrink-0 mt-0.5">
          <Truck size={22} className="text-forest" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-forest text-sm sm:text-base">
              Free Shipping on orders above ₹{freeShippingThreshold}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink/70 mt-0.5 leading-relaxed">
            Standard delivery across India · Dispatches within 24 hours
          </p>
        </div>
      </div>

      {/* ── Pincode Checker Form ─────────────────────────────────── */}
      <div className="border-t border-forest/10 pt-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-ink/80 flex items-center gap-1.5">
            <MapPin size={13} className="text-forest" /> Check delivery availability
          </span>

          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={locating}
            className="text-xs text-forest hover:underline font-medium inline-flex items-center gap-1 disabled:opacity-50"
          >
            {locating && <Loader2 size={11} className="animate-spin" />}
            {locating ? "Detecting…" : "Use my location"}
          </button>
        </div>

        <form onSubmit={handleCheck} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              maxLength={6}
              value={pincode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setPincode(val);
                if (val.length === 6) {
                  setError(null);
                }
              }}
              placeholder="Enter 6-digit pincode"
              className="w-full text-sm bg-white rounded-xl border border-ink/15 px-3.5 py-2.5 text-ink placeholder:text-ink/40 focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={checking || pincode.length !== 6}
            className="rounded-xl bg-forest hover:bg-forest/90 text-white text-xs sm:text-sm font-medium px-4 py-2.5 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center justify-center min-w-[72px]"
          >
            {checking ? <Loader2 size={15} className="animate-spin" /> : "Check"}
          </button>
        </form>

        {/* Validation error */}
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

        {/* Delivery estimate result */}
        {verifiedPincode && !error && (
          <div className="mt-3 rounded-xl bg-white border border-forest/20 p-3 text-xs space-y-1.5 animate-fadeIn">
            <div className="flex items-center gap-1.5 text-forest font-semibold">
              <CheckCircle2 size={14} className="text-forest shrink-0" />
              <span>
                Delivering to {verifiedPincode}
                {cityState ? ` (${cityState})` : ""}:
              </span>
            </div>

            <div className="text-ink/75 pl-5 space-y-1">
              <p>
                Estimated Delivery by{" "}
                <span className="font-semibold text-ink">{getEstimatedDate()}</span>
              </p>
              <div className="flex items-center gap-3 pt-0.5 text-[11px] text-ink/60">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-forest" /> Cash on Delivery available
                </span>
                <span>•</span>
                <span>Express dispatch</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductShippingNotice;
