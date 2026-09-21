"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { LogoRow, PayLogo } from "@/components/checkout/PayLogo";

export interface QrState {
  status: "idle" | "loading" | "shown" | "expired" | "error";
  image?: string;
  expiresAt?: number; // epoch ms
  error?: string;
}

/** Decorative stand-in shown (blurred) until the real QR is requested. */
function PlaceholderQr() {
  const n = 25;
  const finder = (x: number, y: number) => {
    const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
    for (const [ox, oy] of [[0, 0], [n - 7, 0], [0, n - 7]] as const) {
      if (inBox(ox, oy)) {
        const dx = x - ox, dy = y - oy;
        return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
      }
    }
    return null;
  };
  const cells: ReactNode[] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const f = finder(x, y);
    const on = f ?? ((x * 7 + y * 13 + x * y * 3) % 5 < 2);
    if (on) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
  }
  return <svg viewBox={`0 0 ${n} ${n}`} className="h-full w-full fill-ink/80 blur-[3px]" aria-hidden>{cells}</svg>;
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * "Pay via UPI Apps" card: a QR the customer scans with any UPI app. The QR is only generated (and the order
 * created) when they ask for it; the parent polls for the result while it is shown.
 */
export default function QrCard(props: {
  qr: QrState;
  amount: string;
  chip?: ReactNode;
  disabled?: boolean;
  onShow: () => void;
  onExpired: () => void;
}) {
  const { qr, disabled } = props;
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (qr.status !== "shown" || !qr.expiresAt) { setLeft(null); return; }
    const tick = () => {
      const s = Math.max(0, Math.round((qr.expiresAt! - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) props.onExpired();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qr.status, qr.expiresAt]);

  return (
    <div className={`overflow-hidden rounded-2xl border-2 border-ink/10 bg-white ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3 border-b border-ink/8 px-4 py-3">
        <PayLogo name="upi" label="UPI" className="h-6" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Pay via UPI Apps</p>
          {props.chip && <div className="mt-1">{props.chip}</div>}
        </div>
        <span className="text-sm font-semibold text-ink">{props.amount}</span>
      </div>

      <div className="flex flex-col items-center gap-4 p-4 sm:flex-row sm:items-center">
        <div className="relative h-44 w-44 shrink-0 overflow-hidden rounded-xl border border-ink/10 bg-white p-2">
          {qr.status === "shown" && qr.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr.image} alt="UPI QR code — scan with any UPI app" className="h-full w-full object-contain" />
          ) : (
            <>
              <PlaceholderQr />
              <div className="absolute inset-0 flex items-center justify-center bg-white/40">
                {qr.status === "loading" ? (
                  <Loader2 size={28} className="animate-spin text-forest" />
                ) : (
                  <button
                    type="button" disabled={disabled} onClick={props.onShow}
                    className="rounded-lg bg-forest px-3 py-2 text-xs font-semibold text-white shadow hover:opacity-90 disabled:opacity-50"
                  >
                    {qr.status === "expired" || qr.status === "error" ? <span className="inline-flex items-center gap-1"><RefreshCw size={12} /> Refresh QR</span> : "Click to show QR"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="text-center sm:text-left">
          <p className="text-sm text-ink/70">Scan the QR &amp; Pay with your UPI app of choice</p>
          <LogoRow className="mt-3" items={[{ name: "phonepe", label: "PhonePe" }, { name: "paytm", label: "Paytm" }, { name: "bhim", label: "BHIM" }, { name: "gpay", label: "GPay" }]} />
          {qr.status === "shown" && (
            <p className="mt-3 flex items-center justify-center gap-2 text-xs text-ink/60 sm:justify-start" role="status">
              <Loader2 size={13} className="animate-spin text-forest" />
              Waiting for your payment{left != null ? ` · QR valid for ${mmss(left)}` : ""}
            </p>
          )}
          {qr.status === "expired" && <p className="mt-3 text-xs text-amber-700">This QR has expired. Tap Refresh QR for a new one.</p>}
          {qr.status === "error" && <p className="mt-3 text-xs text-red-600" role="alert">{qr.error ?? "We couldn't create the QR. Please try again."}</p>}
        </div>
      </div>
    </div>
  );
}
