"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  User,
  Package,
  LogOut,
  ShoppingBag,
  Pencil,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useAuthStore } from "@/store/useAuthStore";
import { useLogout, useUpdateProfile, useDeactivateAccount } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { getAxiosErrorMessage } from "@/lib/errorUtils";

export default function AccountPage() {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();
  const logout = useLogout();
  const updateProfile = useUpdateProfile();
  const deactivateAccount = useDeactivateAccount();

  // Redirect when session is confirmed gone
  useEffect(() => {
    if (isHydrated && !user) {
      router.replace("/login");
    }
  }, [isHydrated, user, router]);

  // ── Profile edit state ──────────────────────────────────────
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // ── Account deactivation state ──────────────────────────────
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  // ── Orders (Phase 2 — shows gracefully if no orders yet) ───
  const ordersQuery = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => (await api.get("/orders")).data.data,
    enabled: !!user,
    retry: false,
  });

  console.log({ user, isHydrated })

  // Loading / unauthenticated guard
  if (!isHydrated || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-ink/50">Loading your account…</p>
      </main>
    );
  }

  // Display mobile without country code prefix for readability
  const mobileDisplay = user.mobile.startsWith("+91")
    ? user.mobile.slice(3)
    : user.mobile;

  // ── Profile edit helpers ────────────────────────────────────

  function startEditName() {
    setNameInput(user!.name ?? "");
    setEditingName(true);
    setProfileError(null);
    setProfileSuccess(null);
  }

  function cancelEditName() {
    setEditingName(false);
    setNameInput("");
    setProfileError(null);
  }

  function saveName() {
    const trimmed = nameInput.trim();
    if (trimmed.length < 2) {
      setProfileError("Name must be at least 2 characters.");
      return;
    }
    setProfileError(null);
    updateProfile.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          setEditingName(false);
          setProfileSuccess("Name updated.");
          setTimeout(() => setProfileSuccess(null), 3000);
        },
        onError: (err) => setProfileError(getAxiosErrorMessage(err)),
      }
    );
  }

  function startEditEmail() {
    setEmailInput(user!.email ?? "");
    setEditingEmail(true);
    setProfileError(null);
    setProfileSuccess(null);
  }

  function cancelEditEmail() {
    setEditingEmail(false);
    setEmailInput("");
    setProfileError(null);
  }

  function saveEmail() {
    const trimmed = emailInput.trim();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setProfileError("Enter a valid email address.");
      return;
    }
    setProfileError(null);
    updateProfile.mutate(
      { email: trimmed || null },
      {
        onSuccess: () => {
          setEditingEmail(false);
          setProfileSuccess(trimmed ? "Email updated." : "Email removed.");
          setTimeout(() => setProfileSuccess(null), 3000);
        },
        onError: (err) => {
          const status = (err as any)?.response?.status;
          if (status === 409) {
            setProfileError("That email is already associated with another account.");
          } else {
            setProfileError(getAxiosErrorMessage(err));
          }
        },
      }
    );
  }

  // ── Deactivation helper ─────────────────────────────────────

  function confirmDeactivate() {
    setDeactivateError(null);
    deactivateAccount.mutate(undefined, {
      onSuccess: () => router.replace("/"),
      onError: (err) => setDeactivateError(getAxiosErrorMessage(err)),
    });
  }

  return (
    <>
      <CartDrawer />

      <main className="min-h-[70vh] bg-cream px-4 py-10 sm:py-16">
        <div className="max-w-2xl mx-auto">

          {/* ── Page header ──────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-leaf/10 flex items-center justify-center shrink-0">
                <User className="text-leaf" size={26} />
              </div>
              <div>
                <h1 className="font-display text-2xl text-ink">
                  {user.name ?? "Welcome back"}
                </h1>
                <p className="text-ink/50 text-sm">+91 {mobileDisplay}</p>
              </div>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full bg-leaf text-white text-sm font-medium px-5 py-2.5 hover:opacity-90 transition-opacity"
            >
              <ShoppingBag size={16} /> Continue shopping
            </Link>
          </div>

          {/* ── Profile details ───────────────────────────────────── */}
          <div className="rounded-2xl bg-white border border-ink/5 p-6 mb-4">
            <h2 className="font-medium text-ink mb-4 flex items-center gap-2">
              <User size={16} className="text-leaf" /> Profile
            </h2>

            {profileSuccess && (
              <div className="mb-4 rounded-lg bg-leaf/10 border border-leaf/20 text-leaf text-sm px-4 py-2.5">
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5">
                {profileError}
              </div>
            )}

            {/* Name */}
            <div className="mb-4">
              <label className="text-xs text-ink/50 uppercase tracking-wider mb-1 block">
                Full name
              </label>
              {editingName ? (
                <div className="flex gap-2 items-center">
                  <input
                    autoFocus
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                    placeholder="Your name"
                    className="flex-1 rounded-lg border border-ink/15 focus:border-leaf px-3 py-2 text-sm text-ink outline-none transition-colors"
                  />
                  <button
                    onClick={saveName}
                    disabled={updateProfile.isPending}
                    className="h-9 w-9 rounded-lg bg-leaf text-white flex items-center justify-center hover:opacity-90 disabled:opacity-50"
                    aria-label="Save name"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={cancelEditName}
                    className="h-9 w-9 rounded-lg border border-ink/10 flex items-center justify-center hover:bg-ink/5"
                    aria-label="Cancel"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ink">{user.name ?? <span className="text-ink/40">Not set</span>}</p>
                  <button
                    onClick={startEditName}
                    className="text-leaf text-xs flex items-center gap-1 hover:underline"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                </div>
              )}
            </div>

            {/* Mobile (read-only) */}
            <div className="mb-4">
              <label className="text-xs text-ink/50 uppercase tracking-wider mb-1 block">
                Mobile number
              </label>
              <p className="text-sm text-ink/70">+91 {mobileDisplay}</p>
              <p className="text-xs text-ink/40 mt-0.5">Mobile number cannot be changed</p>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs text-ink/50 uppercase tracking-wider mb-1 block">
                Email address{" "}
                <span className="normal-case text-ink/40 font-normal">(optional)</span>
              </label>
              {editingEmail ? (
                <div className="flex gap-2 items-center">
                  <input
                    autoFocus
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEmail()}
                    placeholder="you@example.com"
                    className="flex-1 rounded-lg border border-ink/15 focus:border-leaf px-3 py-2 text-sm text-ink outline-none transition-colors"
                  />
                  <button
                    onClick={saveEmail}
                    disabled={updateProfile.isPending}
                    className="h-9 w-9 rounded-lg bg-leaf text-white flex items-center justify-center hover:opacity-90 disabled:opacity-50"
                    aria-label="Save email"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={cancelEditEmail}
                    className="h-9 w-9 rounded-lg border border-ink/10 flex items-center justify-center hover:bg-ink/5"
                    aria-label="Cancel"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ink">
                    {user.email ?? <span className="text-ink/40">Not set</span>}
                  </p>
                  <button
                    onClick={startEditEmail}
                    className="text-leaf text-xs flex items-center gap-1 hover:underline"
                  >
                    <Pencil size={12} /> {user.email ? "Edit" : "Add"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Orders ───────────────────────────────────────────── */}
          <div className="rounded-2xl bg-white border border-ink/5 p-6 mb-4">
            <div className="flex items-center gap-2 text-ink/70 mb-3">
              <Package size={18} className="text-leaf" />
              <h2 className="font-medium">Your orders</h2>
            </div>
            {ordersQuery.isLoading && <p className="text-sm text-ink/40">Loading…</p>}
            {(ordersQuery.isError || ordersQuery.data?.length === 0) && (
              <p className="text-sm text-ink/40">
                No orders yet —{" "}
                <Link href="/products" className="text-leaf font-medium hover:underline">
                  go find something good
                </Link>
                .
              </p>
            )}
            {ordersQuery.data && ordersQuery.data.length > 0 && (
              <ul className="space-y-2">
                {ordersQuery.data.slice(0, 5).map((o: any) => (
                  <li key={o.id} className="text-sm text-ink/70 flex justify-between">
                    <span>#{o.id.slice(0, 8)}</span>
                    <span className="capitalize">{o.status.toLowerCase()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── Logout + Deactivate ───────────────────────────────── */}
          <div className="rounded-2xl bg-white border border-ink/5 p-6 space-y-4">
            <button
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="inline-flex items-center gap-2 text-sm text-ink/60 font-medium hover:text-ink transition-colors disabled:opacity-50"
            >
              <LogOut size={15} /> {logout.isPending ? "Logging out…" : "Log out"}
            </button>

            <div className="border-t border-ink/5 pt-4">
              {!showDeactivateConfirm ? (
                <button
                  onClick={() => setShowDeactivateConfirm(true)}
                  className="inline-flex items-center gap-2 text-sm text-red-400 font-medium hover:text-red-600 transition-colors"
                >
                  <AlertTriangle size={14} /> Deactivate account
                </button>
              ) : (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-700 font-medium mb-1">
                    Are you sure you want to deactivate your account?
                  </p>
                  <p className="text-xs text-red-500 mb-4">
                    Your account will be deactivated and all sessions will be revoked.
                    Contact support to reactivate.
                  </p>
                  {deactivateError && (
                    <p className="text-xs text-red-600 mb-3">{deactivateError}</p>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={confirmDeactivate}
                      disabled={deactivateAccount.isPending}
                      className="rounded-lg bg-red-500 text-white text-sm font-medium px-4 py-2 hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      {deactivateAccount.isPending ? "Deactivating…" : "Yes, deactivate"}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeactivateConfirm(false);
                        setDeactivateError(null);
                      }}
                      className="rounded-lg border border-ink/10 text-ink text-sm font-medium px-4 py-2 hover:bg-ink/5 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
