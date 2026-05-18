# Go-Live Sign-Off Template

Status: Fill before every production release
Owner: Release Commander

## 1. Release Metadata

- Release ID:
- Release Checklist File: release-checklists/RLS-YYYY-MM-DD-NN.md
- Version/Commit SHA:
- Date:
- Planned Start Time:
- Planned End Time:
- Change Scope:
- Risk Level: Low / Medium / High

## 2. Roles and Accountability

Fill every role before deployment starts.

| Role | Primary Owner | Backup Owner | Contact | Status |
|---|---|---|---|---|
| Release Commander |  |  |  | Pending |
| Backend Deploy Owner |  |  |  | Pending |
| Frontend Deploy Owner |  |  |  | Pending |
| Smoke Test Owner |  |  |  | Pending |
| Data Backup Owner |  |  |  | Pending |
| Rollback Owner (Backend) |  |  |  | Pending |
| Rollback Owner (Frontend) |  |  |  | Pending |
| Incident Communications Owner |  |  |  | Pending |
| Final Business Approver |  |  |  | Pending |

## 3. Hard Gates Before Deploy

All checks must be PASS.

| Gate | Owner | Result | Evidence |
|---|---|---|---|
| Backend unit tests |  | PASS / FAIL |  |
| Backend integration tests |  | PASS / FAIL |  |
| Frontend build |  | PASS / FAIL |  |
| Required env vars verified |  | PASS / FAIL |  |
| /health endpoint reachable |  | PASS / FAIL |  |
| /api/system/health reachable |  | PASS / FAIL |  |
| Rollback target verified |  | PASS / FAIL |  |

Blocker rule:
- If one gate is FAIL, deployment does not start.

## 4. Deployment Timeline and ETA

Use this as default schedule and adapt if needed.

| Time | Task | Owner | ETA | Status |
|---|---|---|---|---|
| T-30m | Code freeze + branch protection check | Release Commander | 5m | Pending |
| T-25m | Backup/snapshot verification | Data Backup Owner | 10m | Pending |
| T-15m | Railway backend deploy | Backend Deploy Owner | 10m | Pending |
| T-5m | Backend health checks | Backend Deploy Owner | 5m | Pending |
| T+0m | Vercel frontend deploy | Frontend Deploy Owner | 10m | Pending |
| T+10m | Smoke Phase A complete | Smoke Test Owner | 10m | Pending |
| T+20m | Smoke Phase B complete | Smoke Test Owner | 20m | Pending |
| T+40m | Smoke Phase C complete | Smoke Test Owner | 15m | Pending |
| T+55m | Final GO/NO-GO decision | Release Commander + Business Approver | 5m | Pending |

## 5. Smoke Result Snapshot

Reference: PRODUCTION_TESTING.md

| Phase | Result | Owner | Timestamp | Notes |
|---|---|---|---|---|
| Phase A (Technical Gates) | PASS / FAIL |  |  |  |
| Phase B (Happy Path) | PASS / FAIL |  |  |  |
| Phase C (Failover) | PASS / FAIL |  |  |  |
| Phase D (Rollback Readiness) | PASS / FAIL |  |  |  |

## 6. Rollback Ownership and ETA

Rollback triggers:
- Health unstable for more than 5 minutes
- Checkout or public booking reproducibly broken
- Tenant data integrity issue

| Rollback Action | Primary Owner | Backup Owner | Target ETA | Status |
|---|---|---|---|---|
| Rollback Railway backend deployment |  |  | <= 10m | Pending |
| Promote previous Vercel deployment |  |  | <= 5m | Pending |
| Post-rollback health verification |  |  | <= 10m | Pending |
| Incident communication update |  |  | <= 5m | Pending |

## 7. Final Decision Log

Decision:
- GO
- NO-GO
- ROLLBACK

Reason:

Required approvals:
- Release Commander (Name/Time):
- Final Business Approver (Name/Time):
- Smoke Test Owner (Name/Time):
- Rollback Owner Backend (Name/Time):
- Rollback Owner Frontend (Name/Time):

## 8. First 60 Minutes Monitoring

After GO, monitor and log every 15 minutes.

| Time Slot | Health | Error Rate | Checkout Status | Booking Status | Owner | Notes |
|---|---|---|---|---|---|---|
| +15m | OK / ISSUE | OK / ISSUE | OK / ISSUE | OK / ISSUE |  |  |
| +30m | OK / ISSUE | OK / ISSUE | OK / ISSUE | OK / ISSUE |  |  |
| +45m | OK / ISSUE | OK / ISSUE | OK / ISSUE | OK / ISSUE |  |  |
| +60m | OK / ISSUE | OK / ISSUE | OK / ISSUE | OK / ISSUE |  |  |

Close criteria:
- If all 4 checks stay OK for 60 minutes, release can be marked stable.
