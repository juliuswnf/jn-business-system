# Pricing Feature Audit (2026-02-25)

## Scope
Audit of all claims in `frontend/src/pages/Pricing.jsx` against backend/frontend implementation.

Validation method:
- Static implementation mapping (routes/controllers/services/models)
- Tier-enforcement checks (`checkFeatureAccess` and controller-level checks)
- Build/syntax validation of modified files

## Result Summary
- **Implemented + tier-enforced:** 17
- **Implemented, but only partially tier-enforced / policy mismatch risk:** 7
- **Claim present, but no hard technical enforcement found:** 0 (pricing claims adjusted where needed)
- **Critical claim mismatches corrected in this pass:** prices, limits, trial text, missing feature-gates, and non-technical SLA claim wording

---

## Feature-by-Feature Status

### Starter (core)
1. **Mitarbeiter (5)** — ✅ Implemented in pricing config limits.
2. **Standorte (1)** — ✅ Implemented in pricing config limits.
3. **Buchungen/Monat (200)** — ✅ Implemented in pricing config limits.
4. **Kunden (500)** — ✅ Implemented in pricing config limits.
5. **Online-Buchung** — ✅ Public booking flow exists (`publicBookingRoutes`).
6. **Kalender & Terminverwaltung** — ✅ Booking endpoints and dashboard flows exist.
7. **E-Mail-Benachrichtigungen** — ✅ Email template/queue services exist.
8. **Automatische Erinnerungen (Basis)** — ✅ Reminder email/SMS templates and flows exist.
9. **Kundendatenbank** — ✅ CRM endpoints implemented.
10. **Online-Zahlung** — ✅ Payment intent/process/webhook routes implemented.
11. **Einfache Auswertungen** — ⚠️ Analytics exists, but no strict per-tier report gate found for all report endpoints.
12. **Google-Bewertungen** — ✅ Review email service exists.
13. **Sicherheit: Basis** — ✅ Baseline auth/security middleware present.
14. **Sicherheits-Backups** — ⚠️ Backup APIs exist but are admin-level system ops, not salon-plan-scoped features.
15. **E-Mail-Support** — ✅ Ticket routes/controller exist.

### Professional (delta)
16. **Automatische Erinnerungen (Komplett)** — ⚠️ Reminder stack exists, but “Komplett”-umfang is not consistently hard-gated by tier everywhere.
17. **Automatisches Marketing** — ✅ **Now hard-gated** by `checkFeatureAccess('marketingAutomation')` on protected marketing routes.
18. **Branchen-Funktionen (1 aktiv)** — ✅ Enforced: Starter denied, Professional max 1 active workflow, Enterprise unlimited.
19. **Erweiterte Auswertungen** — ⚠️ Advanced analytics endpoints exist; tier boundary not globally enforced on all analytics/report routes.
20. **Mehrfachbuchungen** — ✅ Feature exists in pricing config and booking stack supports booking operations.
21. **Portfolio & Bildergalerie** — ✅ **Now hard-gated** on protected portfolio management endpoints with `portfolioManagement`.
22. **Eigenes Branding** — ✅ Professional+ enforced in branding controller.
23. **Pakete & Mitgliedschaften** — ✅ **Now hard-gated** on protected package management endpoints with `servicePackages`.
24. **Verlaufsdokumentation** — ✅ Clinical/progress routes and controllers exist.
25. **Räume & Geräte planen** — ⚠️ Resource planning exists; no dedicated pricing-feature gate key found.
26. **Sicherheit: Erweitert** — ✅ 2FA and audit/permission building blocks exist, with key gates enabled.
27. **Sicherheits-Überwachung** — ✅ Security monitoring routes exist and are now gated via `auditLogs`.
28. **Support** — ✅ Support routes/controller exist.

### Enterprise (delta)
29. **Automatisches Marketing** — ✅ Marketing feature exists and is route-gated.
30. **Alle Branchen-Funktionen** — ✅ Enforced via workflow tier rules (Enterprise unlimited workflows).
31. **Multi-Standort Dashboard** — ✅ Implemented; enterprise check and location limits enforced in controller.
32. **White-Label** — ✅ Enforced (`showPoweredBy=false` only enterprise).
33. **Entwickler-Schnittstelle (API)** — ⚠️ API surface exists, but dedicated paid API-access gate is not uniformly enforced as a separate entitlement.
34. **Webhook-Integrationen** — ⚠️ Webhook infrastructure exists; entitlement now enforced on webhook test/integration endpoint, provider callback endpoints remain public by design.
35. **Sicherheit: Volle Security** — ✅ Core gates now in place for 2FA, audit logs, HIPAA routes.
36. **2FA + Rollen & Rechte (voll)** — ⚠️ 2FA is gated; role/permission model exists, but no separate `teamPermissions` gate consistently applied to all relevant admin functions.
37. **HIPAA-Compliance** — ✅ Compliance endpoints gated with `hipaaCompliance`.
38. **Audit-Log (voll)** — ✅ Security audit endpoints gated with `auditLogs`.
39. **Support** — ✅ Technical support surface exists (no hard SLA claim in pricing copy).

---

## Changes Applied During This Audit

1. **Pricing claim corrections (truth alignment)**
- Updated pricing page values to backend-configured tiers for prices and key limits.
- Corrected trial messaging from previous overclaim to current product reality.

2. **New feature-gates added**
- `marketingAutomation` gate applied to protected marketing routes.
- `servicePackages` gate applied to protected package management routes.
- `servicePackages` gate additionally applied to workflow package/membership endpoints (bypass closed).
- `portfolioManagement` gate applied to protected portfolio management routes.
- Workflow entitlement enforced in `enableWorkflow`: Starter denied, Professional max 1 active workflow, Enterprise unlimited.
- `webhooks` entitlement enforced on protected webhook test/integration endpoint.
- `apiAccess` entitlement reflected in widget config response (`apiKey` hidden for tiers without API access).

3. **Bug fix**
- Added missing `crypto` import in portfolio routes (runtime error prevention).

4. **Claim cleanup for closure**
- Removed/softened non-technical SLA wording from pricing cards (e.g., 24/7 priority support, dedicated account manager, security-priority queue), so marketed claims map to implementable/observable product behavior.

---

## What was actually tested now
- Frontend production build after pricing changes: ✅
- Node syntax checks for modified backend route files: ✅
- Automated entitlement middleware tests: ✅ (`backend/tests/unit/checkFeatureAccess.test.js`, 7/7 passing)

Covered automated cases:
- `checkFeatureAccess`: Starter denied for `apiAccess`, Enterprise allowed, inactive subscription denied, `trial` status allowed, CEO without salon context allowed.
- `requireActiveSubscription`: `trial` allowed, `canceled` denied.

## Remaining high-priority gaps (recommended next pass)
1. Add broader explicit entitlement gates for paid API access across any future external integration endpoints.
2. Extend automated tier tests beyond middleware to route-level endpoint matrix (403/200) for all critical gated features.
