# T&B Paving — Product Requirements (PRD)

## Original Problem Statement
"I want to develop a construction app or website." User is **T&B Paving** (Manchester & North West) — driveways, patios & paths, trusted since 2009. Provided their existing marketing website PDF + a real job photo. Wants brand matched closely (terracotta/peach + black), customer-facing site, with enquiries landing in an admin area and an instant AI estimate.

## Architecture
- Frontend: Expo Router (SDK 54), mobile + web. Bottom tabs: Home, Services, Our Work, Reviews, Get Quote. Separate `/admin` route.
- Backend: FastAPI + MongoDB. JWT auth (staff). Emergent LLM key (gpt-5.4) for AI paving estimates.
- Brand/content centralised in `src/brand.ts`; theme tokens in `src/theme.ts`.

## User Personas
1. **Customer/Homeowner** (no login): browses services, gallery, reviews; gets instant AI estimate; submits a free-quote enquiry.
2. **T&B Staff/Owner** (login): views & manages incoming enquiries, marks them contacted, taps to call/email the lead.

## Core Requirements (static)
- Faithful T&B branding: logo mark, "Trusted Since 2009", 10-yr guarantee, phone 01376 618683 / mobile 07717 315528, email bbirdpaving@gmail.com, North West coverage.
- Lead capture is the #1 goal (quote form → admin dashboard).

## Implemented (2026-06-27)
- Public marketing site: hero (uses real T&B job photo), stats, trust badges, 11 services, how-it-works, work gallery + fullscreen viewer, testimonials, review platforms, coverage chips, FAQ accordion.
- Get Quote: tap-to-call/email, **Instant AI paving estimate** (POST /api/ai/paving-estimate → £ ranges), enquiry form → POST /api/enquiries → success state.
- Admin (`/admin`, footer "Staff Login"): JWT login, enquiries dashboard (new/contacted), call/email/mark-done actions.
- **3D-style cards** (`src/components/Card3D.tsx`, reanimated + gesture-handler): Services use tap-to-**flip** cards (front icon/title → back description, terracotta gradient); Home service-preview + "Our Work" carousel + Gallery grid use **tilt/parallax** depth cards that lean toward the finger and lift on press. Tap still navigates/opens viewer. (True WebGL 3D scenes avoided — too heavy/slow on mobile + Expo Go; transform-based 3D runs at 60fps.)
- **SendGrid email** on new enquiry (`send_owner_email`, BackgroundTask, non-blocking): emails OWNER_EMAIL when SENDGRID_API_KEY + SENDER_EMAIL are set; otherwise lead just saves to dashboard. Env placeholders in backend/.env.
- Backend verified via pytest + UI testing. Admin seed: admin@tbpaving.co.uk / paving2009.

## Backlog (prioritised)
- **P1 (next)**: Owner-editable content from Staff dashboard — Services + Gallery (photo upload) + Reviews (backend CRUD + seed from brand.ts + frontend fetch with static fallback).
- **P1**: Add real SendGrid key + verified sender to enable lead emails (user to provide).
- **P2**: Spam protection (honeypot/rate-limit) on public /api/enquiries.
- **P2**: Replace `shadow*` props with `boxShadow` to silence RN-web warnings.

## Next Tasks
- Build owner-editable content (Services/Gallery/Reviews) backed by Mongo + admin management UI.
