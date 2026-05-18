# Release Checklist - RLS-YYYY-MM-DD-NN

## 1. Metadata

- Release ID:
- Date:
- Branch:
- Commit SHA:
- Release Commander:
- Risk Level: Low / Medium / High

## 2. Owners

| Area | Primary Owner | Backup Owner | Contact | Status |
|---|---|---|---|---|
| Backend Deploy |  |  |  | Pending |
| Frontend Deploy |  |  |  | Pending |
| Smoke Test |  |  |  | Pending |
| Rollback Backend |  |  |  | Pending |
| Rollback Frontend |  |  |  | Pending |
| Incident Comms |  |  |  | Pending |
| Business Approval |  |  |  | Pending |

## 3. Pre-Deploy Gates

- [ ] Backend Unit Tests PASS
  - Command: cd backend && npm test -- --testTimeout=15000 --forceExit
  - Evidence:
- [ ] Backend Integration Tests PASS
  - Command: cd backend && node --no-warnings --experimental-vm-modules scripts/jestRunner.cjs --config jest.integration.config.js --testTimeout=20000 --forceExit
  - Evidence:
- [ ] Frontend Build PASS
  - Command: cd frontend && npm run build
  - Evidence:
- [ ] Health endpoint returns 200
  - Command: curl -fsS "$BACKEND_URL/health"
  - Evidence:
- [ ] System health returns 200
  - Command: curl -fsS "$BACKEND_URL/api/system/health"
  - Evidence:
- [ ] Rollback target verified
  - Evidence:

## 4. Deployment Timeline

| Time | Action | Owner | ETA | Status | Notes |
|---|---|---|---|---|---|
| T-30m | Code freeze and gate confirmation |  | 5m | Pending |  |
| T-15m | Deploy backend on Railway |  | 10m | Pending |  |
| T-5m | Run backend health checks |  | 5m | Pending |  |
| T+0m | Deploy frontend on Vercel |  | 10m | Pending |  |
| T+10m | Run smoke phase A |  | 10m | Pending |  |
| T+20m | Run smoke phase B |  | 20m | Pending |  |
| T+40m | Run smoke phase C |  | 15m | Pending |  |
| T+55m | Final go/no-go decision |  | 5m | Pending |  |

## 5. Smoke Result Log

| Phase | Result | Owner | Timestamp | Ticket/Note |
|---|---|---|---|---|
| A - Technical Gates | PASS / FAIL |  |  |  |
| B - Happy Path | PASS / FAIL |  |  |  |
| C - Failover | PASS / FAIL |  |  |  |
| D - Rollback Readiness | PASS / FAIL |  |  |  |

## 6. Rollback Plan Confirmation

- [ ] Railway previous deployment identified
- [ ] Vercel previous deployment identified
- [ ] Rollback owners reachable
- [ ] Incident comm template prepared

## 7. Final Decision

Decision:
- GO
- NO-GO
- ROLLBACK

Reason:

Approvals:
- Release Commander (name/time):
- Business Approver (name/time):
- Smoke Test Owner (name/time):
- Rollback Backend Owner (name/time):
- Rollback Frontend Owner (name/time):
