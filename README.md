# Divantraa Frontend (Next.js App Router)

## Setup

```bash
npm install
cp .env.example .env.local     # set NEXT_PUBLIC_API_URL to your backend
npm run dev                     # http://localhost:3000
```

Requires the `divantraa-backend` API running (default `http://localhost:5000`).

## Login flow (button-free, mobile OTP)

`app/login/page.tsx` → `components/auth/LoginFlow.tsx` orchestrates 3 steps:

1. **`PhoneStep.tsx`** — 10-digit phone input. The moment the 10th digit is
   typed, `POST /auth/otp/send` fires automatically — no "Send OTP" button.
2. **`OtpStep.tsx`** — 4 individual OTP boxes with auto-advance focus. The
   moment the 4th digit is typed, `POST /auth/otp/verify` fires automatically
   — no "Verify" button. An "Edit number" link goes back to step 1.
3. **`ProfileStep.tsx`** — shown only when the backend reports `isNewUser`
   (first-time login): collects name + optional email, then routes to
   `/account`. Returning users skip straight to `/account`.

Session state:
- Access token + user profile live in `store/useAuthStore.ts` (memory only).
- The refresh token is an httpOnly cookie set by the backend; `lib/AuthProvider.tsx`
  calls `/auth/refresh` once on app load to silently restore the session.
- `lib/api.ts` auto-refreshes on a 401 and retries the original request.

## Folder structure

```
app/
  page.tsx                homepage
  login/page.tsx           OTP login/signup
  account/page.tsx         returning-user account page
  products/[slug]/page.tsx product details
  checkout/page.tsx        shipping + Razorpay checkout
components/
  auth/     PhoneStep, OtpStep, ProfileStep, LoginFlow
  cart/     CartDrawer (slide-over, free shipping bar)
  home/     HeroCarousel, TrustBadges, CategoryGrid
  layout/   SiteHeader
store/      useAuthStore, useCartStore (persisted), useUiStore
lib/        api.ts (axios + auto-refresh), providers.tsx, AuthProvider.tsx
hooks/      useAuth.ts (send/verify OTP, complete profile, logout)
types/      product.ts
```
