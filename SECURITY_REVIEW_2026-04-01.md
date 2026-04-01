# Security Review - 2026-04-01

## Scope
- Backend auth and tenant isolation
- Secret exposure in tracked configuration
- XSS and injection hardening + tests
- Security process baseline

## Findings and Fix Status

### 1) Exposed API Keys
Status: fixed

Actions:
- Removed hardcoded development JWT value from docker compose.
- Replaced inline Mongo credentials in development compose with environment interpolation.
- Added tracked-file secret scanner script:
  - `backend/scripts/scanSecrets.js`
  - `npm run security:scan-secrets` (root)

Notes:
- Untracked local environment files can still contain real keys by design.
- Keep `backend/.env` local only and rotate any previously exposed live keys.

### 2) No Row Level Security
Status: mitigated with application-level tenant isolation (MongoDB)

Actions:
- Enforced tenant-aware access checks in consent endpoints.
- Enabled strict aggregate tenant enforcement by default in production unless explicitly disabled via `MULTI_TENANT_STRICT=false`.
- Continued use of model-level multi-tenant plugin and salon scoping.

### 3) Broken Auth Logic
Status: fixed

Actions:
- Secured consent endpoints that previously allowed unauthenticated access to sensitive records.
- Fixed route ordering to prevent `/:id` from shadowing `/check/:customerId/:consentType`.
- Added backward-compatible revoke route (`POST` + `PATCH`) while keeping auth protection.
- Added explicit tenant-context checks and authorization checks in controller methods.

### 4) No XSS or Injection Testing
Status: fixed

Actions:
- Added security-focused unit tests:
  - `backend/tests/unit/securitySanitization.test.js`
- Test coverage includes:
  - request payload XSS sanitization
  - HTML sanitization of dangerous attributes and scripts
  - Mongo operator/prototype pollution sanitization

### 5) Zero Security Review
Status: fixed

Actions:
- Introduced this security review artifact.
- Added repeatable secret scanning command for future reviews.

## Recommended Next Steps
- Rotate any live API key that was ever placed in a local untracked `.env` file.
- Run `npm run security:scan-secrets` in CI.
- Expand security tests to include authenticated integration tests for tenant boundaries on high-risk routes.
