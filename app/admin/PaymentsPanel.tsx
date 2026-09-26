"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { getAxiosErrorMessage } from "@/lib/errorUtils";

interface Health {
  ok: boolean;
  alerts: string[];
  events: Record<string, number>;
  refunds: Record<string, number>;
  webhookLagSeconds: number;
  stuckUnpaidOrders: number;
}

interface RefundRow {
  id: string; refundId: string; amount: number | string; status: string; reason: string;
  note: string | null; failureReason: string | null; createdAt: string; attempts: number;
  cfRefundId?: string | null; arn?: string | null; gatewayStatus?: string | null; statusDescription?: string | null;
  order: {
    id: string; orderNumber: string | null; total: number | string; status: string; paymentStatus: string;
    user: { name: string | null; mobile: string } | null;
  };
}

interface EventRow {
  id: string; eventId: string; type: string; orderNumber: string | null; status: string;
  attempts: number; lastError: string | null; createdAt: string;
}

const REASON_LABEL: Record<string, string> = {
  CUSTOMER_CANCELLATION: "Customer cancellation",
  LATE_PAYMENT: "Late payment (auto)",
  DUPLICATE_PAYMENT: "Duplicate payment (auto)",
  ADMIN: "Admin",
  EXTERNAL: "Gateway dashboard",
};

const STATUS_COLOR: Record<string, string> = {
  REQUESTED: "bg-amber-100 text-amber-700",
  APPROVED:  "bg-blue-100 text-blue-700",
  PENDING:   "bg-blue-100 text-blue-700",
  SUCCESS:   "bg-green-100 text-green-700",
  FAILED:    "bg-red-100 text-red-600",
  REJECTED:  "bg-ink/10 text-ink/60",
  DEAD:      "bg-red-100 text-red-600",
  RECEIVED:  "bg-amber-100 text-amber-700",
  PROCESSING:"bg-blue-100 text-blue-700",
};

const REFUND_FILTERS = ["REQUESTED", "APPROVED", "PENDING", "FAILED", "SUCCESS", "REJECTED", ""] as const;
const inr = (n: number | string) => `₹${Number(n).toFixed(2)}`;
const when = (d: string) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function PaymentsPanel({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof REFUND_FILTERS)[number]>("REQUESTED");
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-refunds"] });
    qc.invalidateQueries({ queryKey: ["admin-pay-events"] });
    qc.invalidateQueries({ queryKey: ["admin-pay-health"] });
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const { data: health } = useQuery<Health>({
    queryKey: ["admin-pay-health"],
    queryFn: async () => (await api.get("/admin/payments/health")).data.data,
    refetchInterval: 30_000,
  });
  const { data: refunds, isLoading } = useQuery<RefundRow[]>({
    queryKey: ["admin-refunds", filter],
    queryFn: async () => (await api.get("/admin/refunds", { params: { ...(filter ? { status: filter } : {}), limit: 50 } })).data.data,
  });
  const { data: events } = useQuery<EventRow[]>({
    queryKey: ["admin-pay-events"],
    queryFn: async () => (await api.get("/admin/payment-events", { params: { limit: 50 } })).data.data,
  });

  const act = useMutation({
    mutationFn: ({ path, body }: { path: string; body?: object }) => api.post(path, body ?? {}),
    onSuccess: () => { setError(null); setRejecting(null); setRejectReason(""); refresh(); },
    onError: (e) => { setError(getAxiosErrorMessage(e)); refresh(); },
  });

  const attention = (health?.alerts ?? []).filter((a) => !a.includes("awaiting your approval"));

  return (
    <div className="space-y-8">
      {/* Health */}
      <div className={`rounded-2xl border p-4 ${attention.length ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
        <div className="flex items-center justify-between gap-3">
          <p className={`flex items-center gap-2 text-sm font-semibold ${attention.length ? "text-red-700" : "text-green-700"}`}>
            {attention.length ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            {attention.length ? "Needs attention" : "Payments healthy"}
          </p>
          <button onClick={refresh} className="text-ink/40 hover:text-ink" aria-label="Refresh"><RefreshCw size={15} /></button>
        </div>
        {(health?.alerts?.length ?? 0) > 0 && (
          <ul className="mt-2 space-y-1 text-sm text-ink/70 list-disc pl-5">
            {health!.alerts.map((a) => <li key={a}>{a}</li>)}
          </ul>
        )}
        {health && (
          <p className="mt-2 text-xs text-ink/40">
            Webhooks: {Object.entries(health.events).map(([k, v]) => `${k} ${v}`).join(" · ") || "none yet"} · Refunds:{" "}
            {Object.entries(health.refunds).map(([k, v]) => `${k} ${v}`).join(" · ") || "none yet"}
          </p>
        )}
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {/* Refunds */}
      <section>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h2 className="font-semibold text-ink mr-2">Refunds</h2>
          {REFUND_FILTERS.map((f) => (
            <button key={f || "all"} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filter === f ? "bg-leaf text-white border-leaf" : "bg-white text-ink/60 border-ink/15 hover:border-ink/30"
              }`}>
              {f || "All"}
              {f && health?.refunds?.[f] ? ` (${health.refunds[f]})` : ""}
            </button>
          ))}
        </div>

        {isLoading && <p className="py-8 text-center text-sm text-ink/40">Loading…</p>}
        {!isLoading && !refunds?.length && (
          <p className="rounded-2xl border border-dashed border-ink/15 py-10 text-center text-sm text-ink/40">
            {filter === "REQUESTED" ? "No cancellation requests waiting for you." : "Nothing here."}
          </p>
        )}

        <div className="space-y-2">
          {refunds?.map((r) => (
            <div key={r.id} className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-mono font-semibold text-leaf">{r.order.orderNumber ?? r.order.id.slice(0, 8)}</p>
                  <p className="text-sm font-medium text-ink">{r.order.user?.name ?? "—"} <span className="text-ink/40 font-normal">{r.order.user?.mobile}</span></p>
                  <p className="text-xs text-ink/50 mt-0.5">
                    {REASON_LABEL[r.reason] ?? r.reason} · {when(r.createdAt)} · order {r.order.status}/{r.order.paymentStatus}
                  </p>
                  {r.note && <p className="text-xs text-ink/60 mt-1">“{r.note}”</p>}
                  {r.failureReason && <p className="text-xs text-red-600 mt-1">{r.failureReason}</p>}
                  {(r.cfRefundId || r.arn || r.gatewayStatus) && (
                    <p className="text-[11px] font-mono text-ink/40 mt-1 break-all">
                      {r.refundId}{r.cfRefundId ? ` · Cashfree ${r.cfRefundId}` : ""}{r.gatewayStatus ? ` · ${r.gatewayStatus}` : ""}{r.arn ? ` · ARN ${r.arn}` : ""}
                    </p>
                  )}
                  {r.gatewayStatus === "ONHOLD" && <p className="text-xs text-amber-700 mt-1">On hold at Cashfree{r.statusDescription ? `: ${r.statusDescription}` : " (usually low balance)"}.</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-semibold text-ink">{inr(r.amount)}</p>
                  <span className={`inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status] ?? "bg-ink/10 text-ink/60"}`}>{r.status}</span>
                </div>
              </div>

              {isAdmin && r.status === "REQUESTED" && (
                rejecting === r.id ? (
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason shown to the customer…"
                      className="flex-1 border border-ink/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leaf/30" />
                    <button disabled={rejectReason.trim().length < 3 || act.isPending}
                      onClick={() => act.mutate({ path: `/admin/refunds/${r.id}/reject`, body: { reason: rejectReason.trim() } })}
                      className="rounded-xl bg-red-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">Confirm reject</button>
                    <button onClick={() => { setRejecting(null); setRejectReason(""); }} className="rounded-xl border border-ink/15 px-4 py-2 text-xs font-medium">Back</button>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button disabled={act.isPending}
                      onClick={() => { if (confirm(`Approve? This cancels the order and refunds ${inr(r.amount)} to the customer.`)) act.mutate({ path: `/admin/refunds/${r.id}/approve` }); }}
                      className="rounded-xl bg-leaf px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">Approve & refund</button>
                    <button onClick={() => setRejecting(r.id)} className="rounded-xl border border-red-300 px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50">Reject</button>
                  </div>
                )
              )}
              {isAdmin && r.status === "FAILED" && (
                <div className="mt-3">
                  <button disabled={act.isPending}
                    onClick={() => act.mutate({ path: `/admin/refunds/${r.id}/retry` })}
                    className="rounded-xl bg-leaf px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">Retry refund</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Webhook inbox / dead-letter */}
      <section>
        <h2 className="font-semibold text-ink mb-3">Webhook events needing a look</h2>
        {!events?.length ? (
          <p className="rounded-2xl border border-dashed border-ink/15 py-8 text-center text-sm text-ink/40">All payment webhooks processed.</p>
        ) : (
          <div className="space-y-2">
            {events.map((e) => (
              <div key={e.id} className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{e.type} <span className="text-xs font-mono text-ink/40">{e.orderNumber ?? ""}</span></p>
                  <p className="text-xs text-ink/50">{when(e.createdAt)} · {e.attempts} attempt{e.attempts !== 1 ? "s" : ""}</p>
                  {e.lastError && <p className="text-xs text-red-600 mt-1 break-words">{e.lastError}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[e.status] ?? "bg-ink/10 text-ink/60"}`}>{e.status}</span>
                  {isAdmin && (e.status === "DEAD" || e.status === "FAILED") && (
                    <button disabled={act.isPending} onClick={() => act.mutate({ path: `/admin/payment-events/${e.id}/replay` })}
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

/** Manual (partial or full) refund on a paid online order — ADMIN only. */
export function RefundBox({ orderId, total, captured, refunded, onDone }: {
  orderId: string; total: number | string; captured: number | string; refunded: number | string; onDone: () => void;
}) {
  const left = Math.max(0, Number(captured) - Number(refunded));
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const m = useMutation({
    mutationFn: () => api.post(`/admin/orders/${orderId}/refunds`, { amount: Number(amount), note: note.trim() }),
    onSuccess: () => { setOpen(false); setAmount(""); setNote(""); setError(null); onDone(); },
    onError: (e) => setError(getAxiosErrorMessage(e)),
  });
  if (left <= 0) return null;
  if (!open) {
    return <button onClick={() => { setOpen(true); setAmount(String(left)); }} className="rounded-xl border border-ink/20 px-4 py-2 text-xs font-semibold hover:bg-ink/5">Refund…</button>;
  }
  const valid = Number(amount) > 0 && Number(amount) <= left && note.trim().length >= 3;
  return (
    <div className="w-full rounded-xl border border-ink/10 bg-white p-3 space-y-2">
      <p className="text-xs text-ink/60">Refundable balance {inr(left)} of {inr(total)}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="Amount"
          className="w-32 border border-ink/15 rounded-lg px-3 py-2 text-sm" />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (required)"
          className="flex-1 border border-ink/15 rounded-lg px-3 py-2 text-sm" />
        <button disabled={!valid || m.isPending} onClick={() => m.mutate()} className="rounded-lg bg-leaf px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
          {m.isPending ? "Sending…" : "Send refund"}
        </button>
        <button onClick={() => setOpen(false)} className="rounded-lg border border-ink/15 px-3 py-2 text-xs">Cancel</button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
