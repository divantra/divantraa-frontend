"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CashfreeSDK, CfComponent } from "@/lib/cashfree";

export interface FieldState {
  complete: boolean;
  invalid: boolean;
  error: string | null;
  failed: boolean; // the iframe could not load (blocked, domain not whitelisted, …)
}
const IDLE: FieldState = { complete: false, invalid: false, error: null, failed: false };

const EVENTS = ["ready", "change", "complete", "invalid", "empty", "focus", "blur"];

/** Creates + mounts one Cashfree component and reports its state. Cleans up on unmount. */
function useCfComponent(
  sdk: CashfreeSDK | null,
  type: string,
  values: Record<string, unknown>,
  containerId: string,
  onComponent?: (c: CfComponent | null) => void,
) {
  const [state, setState] = useState<FieldState>(IDLE);
  const key = JSON.stringify(values);

  useEffect(() => {
    if (!sdk) return;
    let comp: CfComponent;
    try {
      comp = sdk.create(type, { values: JSON.parse(key) });
    } catch (e) {
      setState({ ...IDLE, failed: true, error: (e as Error).message });
      return;
    }
    const refresh = () => {
      const d = comp.data();
      setState({ complete: !!d.complete, invalid: !!d.invalid, error: d.error?.message ?? null, failed: false });
    };
    EVENTS.forEach((ev) => comp.on(ev, refresh));
    comp.on("loaderror", (d) => setState({ ...IDLE, failed: true, error: (d as { error?: { message?: string } })?.error?.message ?? "Could not load" }));
    try {
      comp.mount(`#${containerId}`);
    } catch (e) {
      setState({ ...IDLE, failed: true, error: (e as Error).message });
      return;
    }
    onComponent?.(comp);
    return () => {
      onComponent?.(null);
      try { comp.destroy(); } catch { /* already gone */ }
    };
    // onComponent is intentionally not a dependency (callers pass inline functions)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdk, type, key, containerId]);

  return state;
}

/** A Cashfree-hosted input (card number, expiry, CVV, UPI ID, …) with our label and error line. */
export function CfField(props: {
  sdk: CashfreeSDK | null;
  type: string;
  label: string;
  values?: Record<string, unknown>;
  onComponent?: (c: CfComponent | null) => void;
  onState?: (s: FieldState) => void;
  className?: string;
}) {
  const id = "cf-" + useId().replace(/:/g, "");
  const state = useCfComponent(props.sdk, props.type, props.values ?? {}, id, props.onComponent);
  const cb = useRef(props.onState);
  cb.current = props.onState;
  useEffect(() => { cb.current?.(state); }, [state]);

  return (
    <div className={props.className}>
      <label className="mb-1 block text-xs text-ink/50">{props.label}</label>
      <div id={id} className={`min-h-[44px] rounded-lg border bg-white px-1 ${state.invalid ? "border-red-400" : "border-ink/15"}`} />
      {state.invalid && state.error && <p className="mt-1 text-xs text-red-500">{state.error}</p>}
    </div>
  );
}

/** A Cashfree-hosted BUTTON component (bank, wallet provider, UPI app). Reports clicks; we highlight the pick. */
export function CfButton(props: {
  sdk: CashfreeSDK | null;
  type: "netbanking" | "wallet" | "upiApp";
  values: Record<string, unknown>;
  selected: boolean;
  onPick: (c: CfComponent) => void;
  onFailed?: () => void;
}) {
  const id = "cf-" + useId().replace(/:/g, "");
  const holder = useRef<CfComponent | null>(null);
  const pick = useRef(props.onPick);
  pick.current = props.onPick;
  const state = useCfComponent(props.sdk, props.type, props.values, id, (c) => {
    holder.current = c;
    if (c) c.on("click", () => pick.current(c));
  });
  const failedCb = useRef(props.onFailed);
  failedCb.current = props.onFailed;
  useEffect(() => { if (state.failed) failedCb.current?.(); }, [state.failed]);

  return (
    <div
      id={id}
      className={`min-h-[44px] overflow-hidden rounded-lg border-2 transition-colors ${props.selected ? "border-forest bg-leaf/5" : "border-ink/15"}`}
    />
  );
}
