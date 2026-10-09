"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Truck, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { getAxiosErrorMessage } from "@/lib/errorUtils";

interface ShipmentEventRow {
  id: string; eventId: string; type: string; orderId: string | null; awbCode: string | null;
  status: string; attempts: number; lastError: string | null; createdAt: string;
}

interface RemittanceRow {
  id: string; amount: number | string; reference: string | null; remittedAt: string; createdAt: string;
  order: { orderNumber: string | null; total: number | string };
}

const STATUS_COLOR: Record<string, string> = {
  DEAD: "bg-red-100 text-red-600",
  FAILED: "bg-red-100 text-red-600",
  RECEIVED: "bg-amber-100 text-amber-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  PROCESSED: "bg-green-100 text-green-700",
};

const inr = (n: number | string) => `₹${Number(n).toFixed(2)}`;
const when = (d: string) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function ShippingPanel({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-shipment-events"] });
    qc.invalidateQueries({ queryKey: ["admin-cod-remittances"] });
  };

  const { data: events } = useQuery<ShipmentEventRow[]>({
    queryKey: ["admin-shipment-events"],
    queryFn: async () => (await api.get("/admin/shipment-events", { params: { limit: 50 } })).data.data,
  });
  const { data: remittances, isLoading: loadingRemittances } = useQuery<RemittanceRow[]>({
    queryKey: ["admin-cod-remittances"],
    queryFn: async () => (await api.get("/admin/cod-remittances", { params: { limit: 50 } })).data.data,
  });

  const replay = useMutation({
    mutationFn: (id: string) => api.post(`/admin/shipment-events/${id}/replay`),
    onSuccess: () => { setError(null); refresh(); },
    onError: (e) => setError(getAxiosErrorMessage(e)),
  });

  return (
    <div className="space-y-8">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {/* COD remittance ledger */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 font-semibold text-ink"><Wallet size={16} /> COD remittance ledger</h2>
          <button onClick={refresh} className="text-ink/40 hover:text-ink" aria-label="Refresh"><RefreshCw size={15} /></button>
        </div>
        <p className="text-xs text-ink/50 mb-3">
          Shiprocket doesn&apos;t expose a pull API for remittance data yet — record entries by hand from their
          dashboard&apos;s Remittance Report (Tools → Reports) so they&apos;re tracked here too.
        </p>

        {isAdmin && <RecordRemittanceForm onDone={refresh} />}

        {loadingRemittances && <p className="py-8 text-center text-sm text-ink/40">Loading…</p>}
        {!loadingRemittances && !remittances?.length && (
          <p className="rounded-2xl border border-dashed border-ink/15 py-10 text-center text-sm text-ink/40 mt-3">No remittance entries recorded yet.</p>
        )}
        <div className="space-y-2 mt-3">
          {remittances?.map((r) => (
            <div key={r.id} className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-mono font-semibold text-leaf">{r.order.orderNumber ?? "—"}</p>
                <p className="text-xs text-ink/50 mt-0.5">
                  Remitted {when(r.remittedAt)}{r.reference ? ` · Ref ${r.reference}` : ""} · order total {inr(r.order.total)}
                </p>
              </div>
              <p className="text-base font-semibold text-ink shrink-0">{inr(r.amount)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Shipment webhook inbox / dead-letter */}
      <section>
        <h2 className="flex items-center gap-2 font-semibold text-ink mb-3"><Truck size={16} /> Shipment webhook events needing a look</h2>
        {!events?.length ? (
          <p className="rounded-2xl border border-dashed border-ink/15 py-8 text-center text-sm text-ink/40">All shipment webhooks processed.</p>
        ) : (
          <div className="space-y-2">
            {events.map((e) => (
              <div key={e.id} className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{e.type} <span className="text-xs font-mono text-ink/40">{e.awbCode ?? ""}</span></p>
                  <p className="text-xs text-ink/50">{when(e.createdAt)} · {e.attempts} attempt{e.attempts !== 1 ? "s" : ""}</p>
                  {e.lastError && <p className="text-xs text-red-600 mt-1 break-words">{e.lastError}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[e.status] ?? "bg-ink/10 text-ink/60"}`}>{e.status}</span>
                  {isAdmin && (e.status === "DEAD" || e.status === "FAILED") && (
                    <button disabled={replay.isPending} onClick={() => replay.mutate(e.id)}
                      className="rounded-xl border border-ink/20 px-3 py-1.5 text-xs font-semibold hover:bg-ink/5 disabled:opacity-50">Replay</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/** Manual COD remittance entry — needs the order's id, which the admin pastes from the order number lookup. */
function RecordRemittanceForm({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [remittedAt, setRemittedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const m = useMutation({
    mutationFn: () => api.post(`/admin/orders/${orderId}/cod-remittance`, {
      amount: Number(amount), reference: reference.trim() || undefined, remittedAt,
    }),
    onSuccess: () => { setOpen(false); setOrderId(""); setAmount(""); setReference(""); setError(null); onDone(); },
    onError: (e) => setError(getAxiosErrorMessage(e)),
  });

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-xl bg-leaf px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
        + Record a remittance
      </button>
    );
  }

  const valid = orderId.trim().length > 0 && Number(amount) > 0 && remittedAt;
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4 space-y-2">
      <p className="text-xs text-ink/50">Order ID (the order&apos;s internal id, not the order number — open the order in the Orders tab and copy it from the URL)</p>
      <div className="grid sm:grid-cols-4 gap-2">
        <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Order id"
          className="border border-ink/15 rounded-lg px-3 py-2 text-xs sm:col-span-2" />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="Amount (₹)"
          className="border border-ink/15 rounded-lg px-3 py-2 text-xs" />
        <input type="date" value={remittedAt} onChange={(e) => setRemittedAt(e.target.value)}
          className="border border-ink/15 rounded-lg px-3 py-2 text-xs" />
        <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Reference / UTR (optional)"
          className="border border-ink/15 rounded-lg px-3 py-2 text-xs sm:col-span-4" />
      </div>
      <div className="flex gap-2">
        <button disabled={!valid || m.isPending} onClick={() => m.mutate()}
          className="rounded-lg bg-leaf px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{m.isPending ? "Saving…" : "Save"}</button>
        <button onClick={() => setOpen(false)} className="rounded-lg border border-ink/15 px-3 py-2 text-xs">Cancel</button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
