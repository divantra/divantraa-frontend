"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import {
  BRAND_LABEL, cvvLength, detectBrand, digitsOnly, formatCardNumber, formatExpiry, validateCard,
  type CardErrors, type CardValue,
} from "@/lib/card";

/**
 * Our own card form. Values stay in React state and are handed straight to
 * Razorpay's script by the parent — nothing here is logged, stored or sent to our API.
 */
export default function CardForm({ value, onChange }: { value: CardValue; onChange: (c: CardValue) => void }) {
  const [touched, setTouched] = useState<Partial<Record<keyof CardValue, boolean>>>({});
  const errors: CardErrors = validateCard(value);
  const brand = detectBrand(value.number);
  const show = (k: keyof CardValue) => touched[k] && errors[k];
  const touch = (k: keyof CardValue) => () => setTouched((t) => ({ ...t, [k]: true }));

  const field = "w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition-colors";
  const ok = "border-ink/15 focus:border-leaf";
  const bad = "border-red-400";

  return (
    <div className="space-y-3" data-card-form>
      <div>
        <label htmlFor="cc-number" className="mb-1 block text-xs text-ink/50">Card number</label>
        <div className="relative">
          <input
            id="cc-number" name="cardnumber" autoComplete="cc-number" inputMode="numeric" placeholder="1234 5678 9012 3456"
            value={value.number} onChange={(e) => onChange({ ...value, number: formatCardNumber(e.target.value) })} onBlur={touch("number")}
            aria-invalid={!!show("number")} className={`${field} pr-20 ${show("number") ? bad : ok}`}
          />
          {brand !== "unknown" && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded bg-ink/5 px-2 py-0.5 text-[10px] font-semibold text-ink/60">
              {BRAND_LABEL[brand]}
            </span>
          )}
        </div>
        {show("number") && <p className="mt-1 text-xs text-red-500">{errors.number}</p>}
      </div>

      <div>
        <label htmlFor="cc-name" className="mb-1 block text-xs text-ink/50">Name on card</label>
        <input
          id="cc-name" name="ccname" autoComplete="cc-name" placeholder="As printed on the card"
          value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value.replace(/[^a-zA-Z .'-]/g, "") })} onBlur={touch("name")}
          aria-invalid={!!show("name")} className={`${field} ${show("name") ? bad : ok}`}
        />
        {show("name") && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="cc-exp" className="mb-1 block text-xs text-ink/50">Expiry</label>
          <input
            id="cc-exp" name="cc-exp" autoComplete="cc-exp" inputMode="numeric" placeholder="MM/YY" maxLength={5}
            value={value.expiry} onChange={(e) => onChange({ ...value, expiry: formatExpiry(e.target.value) })} onBlur={touch("expiry")}
            aria-invalid={!!show("expiry")} className={`${field} ${show("expiry") ? bad : ok}`}
          />
          {show("expiry") && <p className="mt-1 text-xs text-red-500">{errors.expiry}</p>}
        </div>
        <div>
          <label htmlFor="cc-cvv" className="mb-1 block text-xs text-ink/50">CVV</label>
          <input
            id="cc-cvv" name="cvc" type="password" autoComplete="cc-csc" inputMode="numeric" placeholder={"•".repeat(cvvLength(brand))}
            maxLength={cvvLength(brand)} value={value.cvv}
            onChange={(e) => onChange({ ...value, cvv: digitsOnly(e.target.value).slice(0, cvvLength(brand)) })} onBlur={touch("cvv")}
            aria-invalid={!!show("cvv")} className={`${field} ${show("cvv") ? bad : ok}`}
          />
          {show("cvv") && <p className="mt-1 text-xs text-red-500">{errors.cvv}</p>}
        </div>
      </div>

      <p className="flex items-start gap-2 text-xs text-ink/50">
        <Lock size={13} className="mt-0.5 shrink-0 text-leaf" />
        Your card details go directly to Razorpay over an encrypted connection. We never see or store them.
      </p>
    </div>
  );
}
