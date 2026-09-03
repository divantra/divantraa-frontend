"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { User, Package, MapPin, LogOut, ShoppingBag } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useAuthStore } from "@/store/useAuthStore";
import { useLogout } from "@/hooks/useAuth";
import { api } from "@/lib/api";

export default function AccountPage() {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();
  const logout = useLogout();

  // If hydration finished and there's still no user, send them to /login
  useEffect(() => {
    if (isHydrated && !user) {
      router.replace("/login");
    }
  }, [isHydrated, user, router]);

  const ordersQuery = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => (await api.get("/orders")).data.data,
    enabled: !!user,
  });

  if (!isHydrated || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-ink/50">Loading your account…</p>
      </main>
    );
  }

  return (
    <>
      <CartDrawer />

      <main className="min-h-[70vh] bg-cream px-6 py-10 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-leaf/10 flex items-center justify-center">
                <User className="text-leaf" size={26} />
              </div>
              <div>
                <h1 className="font-display text-2xl text-ink">{user.name ?? "Welcome back"}</h1>
                <p className="text-ink/50 text-sm">+91 {user.phone.replace("+91", "")}</p>
              </div>
            </div>

            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full bg-leaf text-white text-sm font-medium px-5 py-2.5 hover:opacity-90 transition-opacity"
            >
              <ShoppingBag size={16} /> Continue shopping
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            <div className="rounded-2xl bg-white border border-ink/5 p-6">
              <div className="flex items-center gap-2 text-ink/70 mb-3">
                <Package size={18} className="text-leaf" />
                <h2 className="font-medium">Your orders</h2>
              </div>
              {ordersQuery.isLoading && <p className="text-sm text-ink/40">Loading…</p>}
              {ordersQuery.data?.length === 0 && (
                <p className="text-sm text-ink/40">
                  No orders yet —{" "}
                  <Link href="/products" className="text-leaf font-medium hover:underline">
                    go find something good
                  </Link>
                  .
                </p>
              )}
              <ul className="space-y-2">
                {ordersQuery.data?.slice(0, 3).map((o: any) => (
                  <li key={o.id} className="text-sm text-ink/70 flex justify-between">
                    <span>#{o.id.slice(0, 8)}</span>
                    <span className="capitalize">{o.status.toLowerCase()}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-white border border-ink/5 p-6">
              <div className="flex items-center gap-2 text-ink/70 mb-3">
                <MapPin size={18} className="text-leaf" />
                <h2 className="font-medium">Saved addresses</h2>
              </div>
              <p className="text-sm text-ink/40">Add an address at checkout to see it here.</p>
            </div>
          </div>

          <button
            onClick={() => logout.mutate()}
            className="inline-flex items-center gap-2 text-sm text-red-500 font-medium hover:underline"
          >
            <LogOut size={15} /> Log out
          </button>
        </div>
      </main>
    </>
  );
}
