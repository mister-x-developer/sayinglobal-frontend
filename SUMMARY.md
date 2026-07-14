# UI/Visual/Functional Audit — Complete Summary

**Date:** June 9, 2026  
**Scope:** Frontend UI audit, component-level ErrorBoundaries, mobile optimization, Capacitor readiness

---

## 1. Bug Fixes & UI Corrections

### Toast.tsx — Variable Shadowing Fix
- **Problem:** `t` was used for both the toast `.map()` item and the `useTranslations('common')` function, causing `aria-label={t('close')}` to render `[object Object]`.
- **Fix:** Renamed map variable `t` → `item`, translation function `t` → `tCommon`.

### MapDiscovery.tsx — Design System Token Migration
- **Problem:** Hardcoded Tailwind colors (`slate-*`, `emerald-*`) bypassed the design system.
- **Fix:** Replaced all with design system tokens: `bg-bg-elevated`, `bg-bg-subtle`, `text-fgʻ, `text-fg-muted`, `text-fg-subtle`, `border-border`, `text-brand-primary`, `accent-brand-primary`, `shadow-lift`.
- **Bonus:** Replaced raw `fetch()` with `listingsApi.nearby()` to route through `apiClient` (trailing-slash interceptor, auth headers, timeout).

### lib/i18n.ts — Missing Routing Export
- **Problem:** `middleware.ts` imported `{ routing }` from `./lib/i18n` but it didn't exist (pre-existing TS2614 error).
- **Fix:** Added `export const routing = { locales, defaultLocale }` to `lib/i18n.ts`.

### lib/capacitor.ts — Capacitor 8.x Type Mismatch
- **Problem:** `@capacitor/core` 8.4.0 type definitions don't export `Capacitor` as a named member (TS2305).
- **Fix:** Added `@ts-expect-error` annotation with documentation. The runtime export works correctly.

### capacitor.config.admin.ts & capacitor.config.user.ts — Invalid Properties
- **Problem:** `overrideUserInterfaceStyle` and `bundledWebRuntime` don't exist in Capacitor 8.x `CapacitorConfigʻ type.
- **Fix:** Removed both invalid properties and empty `App: {}` objects.

---

## 2. Component-Level ErrorBoundaries

| Section | File | Scope |
|---------|------|-------|
| **Chat messages** | `app/chat/page.tsx` | Wraps `<div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">` only — sidebar and input remain functional if messages crash |
| **Admin stats grid** | `app/admin/page.tsx` | Wraps stat cards (`grid gap-4 sm:grid-cols-2 lg:grid-cols-4`) |
| **Admin actions/health** | `app/admin/page.tsx` | Wraps quick actions + activity + system health (`grid gap-6 lg:grid-cols-3`) |
| **Admin pending items** | `app/admin/page.tsx` | Wraps PendingListings + RecentComplaints (`grid gap-6 lg:grid-cols-2`) |
| **Admin trends** | `app/admin/page.tsx` | Wraps 30-day user/listings trend charts |
| **Map** | `components/map/MapDiscovery.tsx` | Wraps `<Map>` component for render crash isolation |
| **Root** | `app/layout.tsx` | Wraps `{children}` as global fallback |

---

## 3. Middleware Security — Cookie-Based Role Guard

### middleware.ts
- **Problem:** Admin route protection was client-side only (AdminLayout), causing flickering.
- **Fix:** Added server-side cookie-based role guard:
  - Reads `sayin-auth` cookie synchronously
  - Redirects unauthenticated users from `/admin` → `/auth`
  - Redirects non-admin users from `/admin` → `/dashboard`
  - Redirects authenticated users from `/auth` → `/admin` or `/dashboard`

### lib/types/auth.ts — Deleted (dead code)
- **Deleted:** The file was created as a "shared type" but `writeAuthCookie` in auth.ts takes fundamentally different params (`isAuthenticated + accessToken + user`) vs the read shape (`isAuthenticated + isAdmin`). Forced sharing would be architecturally wrong.
- **Replaced with:** Inline return type on `readAuthCookie()` in middleware.ts.

### lib/store/auth.ts
- Updated `writeAuthCookie` JSDoc to document the cookie shape contract with middleware.

---

## 4. Mobile Optimization (Capacitor WebView)

### CSS (`styles/mobile.css`)
| Feature | Implementation |
|---------|---------------|
| **Pull-to-refresh prevention** | `html { overscroll-behavior-y: contain }` |
| **Touch scrolling** | `-webkit-overflow-scrolling: touch` on `.scroll-container` |
| **iOS zoom prevention** | `input, textarea, select { font-size: 16px !important }` |
| **Touch targets** | `button, a, input, select, textarea { min-height: 44px; min-width: 44px }` |
| **Tap highlight** | `* { -webkit-tap-highlight-color: transparent }` |
| **Safe area insets** | CSS custom properties + utility classes (`.safe-top`, `.safe-bottom`, etc.) |
| **Bottom nav padding** | `.mobile-bottom-nav { padding-bottom: calc(var(--safe-area-bottom) + 1rem) }` |
| **Image drag prevention** | `img { user-drag: none }` |
| **Dark mode** | `@media (prefers-color-scheme: dark) { color-scheme: dark }` |
| **Hardware acceleration** | `.hw-accelerated` utility class |

### Viewport (`app/layout.tsx`)
```ts
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};
```

---

## 5. Logo Verification

✅ **Confirmed:** `logo.pngʻ / `sayinglobal_logo.pngʻ are **NOT** used in any frontend UI component.
- `BrandLogo.tsx` — Uses inline SVG only (has comment: "PNG files MUST NOT be used")
- `AIAssistantButton.tsx` — Uses separate AI-specific logos (`admin_ai_logo.pngʻ, `user_ai_logo.pngʻ)
- Capacitor configs (`capacitor.config.user.ts`, `capacitor.config.admin.ts`) — Use splash screen resources, not `logo.pngʻ

---

## 6. Build Status

✅ **`next build` passes successfully** — zero errors.

### Pre-existing issues (not introduced by this audit):
- `@capacitor/core` 8.4.0 type definitions are incomplete → suppressed with `@ts-expect-error`
- `@capacitor/app` 8.1.0 may have similar type gaps

---

## Files Modified

| File | Change Type |
|------|------------|
| `components/ui/Toast.tsx` | Bug fix (variable shadowing) |
| `components/map/MapDiscovery.tsx` | Design tokens + ErrorBoundary + API client |
| `middleware.ts` | Security (cookie-based role guard) |
| ~~`lib/types/auth.ts`~~ | **DELETED** — Dead type, inlined in middleware.ts |
| `lib/store/auth.ts` | JSDoc update |
| `lib/i18n.ts` | Bug fix (missing routing export) |
| `lib/capacitor.ts` | Type fix (Capacitor 8.x compat) |
| `app/admin/page.tsx` | ErrorBoundaries (4 sections) |
| `app/chat/page.tsx` | ErrorBoundary (messages area) |
| `app/layout.tsx` | Root-level ErrorBoundary |
| `styles/mobile.css` | Mobile optimizations + cleanup |
| `capacitor.config.admin.ts` | Removed invalid properties |
| `capacitor.config.user.ts` | Removed invalid properties |
