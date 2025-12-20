# SECURITY FIX CHECKLIST - Codacy Critical Issues

## ✅ COMPLETED (Automated via securityHelpers.js)
- [x] Created centralized security helpers
- [x] Crypto-safe random generation functions
- [x] NoSQL injection prevention utilities
- [x] XSS escaping functions
- [x] Path traversal protection
- [x] Timing-safe comparison
- [x] Prototype pollution guards

## 🔴 HIGH PRIORITY (Manual Fix Required)

### 1. Crypto - Replace Math.random() in Security Contexts
**Files**: 25 occurrences
**Fix**: Use `crypto.randomBytes()` instead

```diff
// ❌ BEFORE
- const id = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
+ const id = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

// ❌ BEFORE  
- const uuid = Math.random().toString(36).substr(2, 9);
+ const uuid = crypto.randomBytes(6).toString('hex');
```

**Target Files**:
- backend/utils/helpers.js (line 54, 265)
- backend/middleware/fileUploadMiddleware.js (line 41)
- backend/routes/brandingRoutes.js (line 30)
- backend/routes/progressRoutes.js (line 27)
- backend/routes/artistPortfolioRoutes.js (line 26)
- backend/models/DeletionRequest.js (line 12)
- backend/models/BreachIncident.js (line 12)
- backend/controllers/supportController.js (line 15)
- backend/utils/structuredLogger.js (line 86)
- backend/middleware/securityMiddleware.js (line 172)
- frontend/src/pages/onboarding/PricingWizard.jsx (line 30)
- frontend/src/pages/booking/PublicBooking.jsx (line 196)
- frontend/src/pages/customer/Booking.jsx (line 189)

### 2. NoSQL Injection - Sanitize findOne() Parameters
**Files**: 40+ occurrences
**Fix**: Validate user input before MongoDB queries

```diff
// ❌ BEFORE
- const user = await User.findOne({ email: req.body.email });
+ const user = await User.findOne({ email: String(req.body.email).toLowerCase() });

// OR use helper
+ import { sanitizeMongoQuery } from '../utils/securityHelpers.js';
+ const user = await User.findOne(sanitizeMongoQuery({ email: req.body.email }));
```

**Target Files**:
- backend/utils/createCEO.js (line 88, 146)
- backend/controllers/authController.js (line 882, 99)
- backend/controllers/marketingController.js (line 17, 233)
- backend/controllers/tattooController.js (line 618, 25)
- backend/controllers/gdprController.js (line 16)
- backend/controllers/employeeController.js (line 40)
- backend/controllers/workflowController.js (line 151)
- backend/controllers/widgetController.js (line 16)
- backend/controllers/publicBookingController.js (line 485, 567)
- backend/models/User.js (line 298)
- backend/models/Salon.js (line 846)
- backend/models/Customer.js (line 241)

### 3. XSS - Escape HTML in Email Templates
**Files**: 8 occurrences
**Fix**: Use `escapeHtml()` for all user data in HTML

```diff
+ import { escapeHtml } from '../utils/securityHelpers.js';

// ❌ BEFORE
- <p><strong>Ticket:</strong> ${ticket.ticketNumber}</p>
+ <p><strong>Ticket:</strong> ${escapeHtml(ticket.ticketNumber)}</p>

// ❌ BEFORE
- <p>${description}</p>
+ <p>${escapeHtml(description)}</p>
```

**Target Files**:
- backend/controllers/supportController.js (line 73, 74, 75, 78, 94, 254, 257)

### 4. RegExp DoS - Escape User Input in RegExp
**Files**: 10 occurrences
**Fix**: Use `escapeRegExp()` before RegExp constructor

```diff
+ import { escapeRegExp } from '../utils/securityHelpers.js';

// ❌ BEFORE
- const regex = new RegExp(userInput, 'i');
+ const regex = new RegExp(escapeRegExp(userInput), 'i');

// ❌ BEFORE
- const regex = new RegExp(`{{${key}}}`, 'g');
+ const regex = new RegExp(`{{${escapeRegExp(key)}}}`, 'g');
```

**Target Files**:
- backend/controllers/marketingController.js (line 698)
- backend/controllers/publicBookingController.js (line 102, 144)
- backend/controllers/crmController.js (line 157)
- backend/middleware/sanitizationMiddleware.js (line 97, 99)
- backend/middleware/widgetCorsMiddleware.js (line 64)
- backend/services/emailService.js (line 364)
- backend/services/googleReviewService.js (line 100)
- backend/services/smsTemplates.js (line 336)
- backend/services/cacheService.js (line 79)
- backend/workers/marketingCampaignWorker.js (line 393)

### 5. File Path Traversal - Validate Paths
**Files**: 30+ occurrences
**Fix**: Use `sanitizeFilePath()` or `safePathJoin()`

```diff
+ import { safePathJoin } from '../utils/securityHelpers.js';

// ❌ BEFORE
- const filePath = path.join(backupDir, req.params.filename);
+ const filePath = safePathJoin(backupDir, req.params.filename);

// ❌ BEFORE
- fs.unlinkSync(req.file.path);
+ const safePath = sanitizeFilePath(req.file.path, uploadsDir);
+ fs.unlinkSync(safePath);
```

**Target Files**:
- backend/services/dataPortabilityService.js (line 183, 194, 218)
- backend/controllers/ceoBackupsController.js (line 180, 184, 185, 196, 199, 238, 239, 360)
- backend/services/backupService.js (line 92, 101, 102, 125, 137)
- backend/utils/backupDatabase.js (line 54, 55, 114, 122, 124, 127, 132, 193, 215, 217, 227, 236, 289, 299, 300, 324)
- backend/middleware/fileUploadMiddleware.js (line 33, 34, 88)
- backend/controllers/artistPortfolioController.js (line 53)
- backend/controllers/progressController.js (line 114)
- backend/utils/cloudinaryHelper.js (line 71, 72)
- backend/utils/pdfGenerator.js (line 34, 35, 50)

### 6. Open Redirect - Validate Redirect URLs
**Files**: 3 occurrences
**Fix**: Use `safeRedirect()` or whitelist

```diff
+ import { safeRedirect } from '../utils/securityHelpers.js';

// ❌ BEFORE
- res.redirect(req.query.redirectUrl);
+ safeRedirect(res, req.query.redirectUrl, ['myapp.com', 'booking.myapp.com']);
```

**Target Files**:
- backend/controllers/consentFormController.js (line 242, 250)
- backend/controllers/marketingController.js (line 385)

### 7. Timing Attack - Password Comparison
**Files**: 2 occurrences
**Fix**: Use `crypto.timingSafeEqual()`

```diff
+ import { timingSafeEqual } from '../utils/securityHelpers.js';

// ❌ BEFORE
- if (password !== confirmPassword) {
+ if (!timingSafeEqual(password, confirmPassword)) {
```

**Target Files**:
- frontend/src/pages/auth/ResetPassword.jsx (line 52)
- backend/utils/createCEO.js (line 108)

### 8. Prototype Pollution - Safe Object Access
**Files**: 1 occurrence
**Fix**: Use `safeObjectGet()`

```diff
+ import { safeObjectGet } from '../utils/securityHelpers.js';

// ❌ BEFORE
- current = current[key];
+ current = safeObjectGet(current, key);
```

**Target Files**:
- backend/utils/helpers.js (line 147)

## 🟡 MEDIUM PRIORITY (Less Critical)

### 9. SSRF - Validate External URLs
**Files**: 5 occurrences

**Target Files**:
- frontend/src/pages/dashboard/WorkflowProjectDetail.jsx (line 51)
- frontend/src/pages/dashboard/PackagesMemberships.jsx (line 52)
- frontend/src/pages/dashboard/TattooProjectDetails.jsx (line 50)
- frontend/src/pages/dashboard/MultiLocationDashboard.jsx (line 147)
- backend/scripts/testAllSteps.js (line 36)

### 10. SQL Injection (False Positive - No SQL Used)
**Files**: 2 occurrences - These are NOT actual SQL injection (template strings)

**Target Files**:
- backend/controllers/resourceController.js (line 282) - Message string, not SQL
- backend/controllers/systemController.js (line 63) - PowerShell command, needs escaping

## ⚠️ EXCLUDED (Not Security Issues)

- load-test.js - Test file, Math.random() acceptable for load testing
- seedUsers.js - Seed script, Math.random() acceptable for test data

## 📋 IMPLEMENTATION PLAN

### Phase 1: Import Security Helpers (DONE)
- [x] Created `backend/utils/securityHelpers.js`

### Phase 2: Fix Top 5 Categories (DO NOW)
1. Fix all `Math.random()` in security contexts → `crypto.randomBytes()`
2. Fix all `findOne()` with user input → Add validation
3. Fix all HTML templates → `escapeHtml()`
4. Fix all `new RegExp()` with user input → `escapeRegExp()`
5. Fix all file path operations → `sanitizeFilePath()`

### Phase 3: Remaining Fixes
6. Open redirects → `safeRedirect()`
7. Timing attacks → `timingSafeEqual()`
8. Prototype pollution → `safeObjectGet()`
9. SSRF → `validateUrl()`

### Phase 4: Testing
- Run all tests: `npm test`
- Manual security audit
- Codacy re-scan

## 🚀 QUICK FIX COMMANDS

```bash
# 1. Run automated fixes
node backend/scripts/applySecurityFixes.js --apply

# 2. Manual review
git diff

# 3. Test
npm test

# 4. Commit
git add .
git commit -m "Security: Fix Codacy critical issues (Math.random, NoSQL injection, XSS, RegExp DoS, Path traversal)"
```

## 📊 PROGRESS TRACKER

- [ ] Crypto fixes (25 files)
- [ ] NoSQL injection (40 files)
- [ ] XSS escaping (8 files)
- [ ] RegExp DoS (10 files)
- [ ] Path traversal (30 files)
- [ ] Open redirect (3 files)
- [ ] Timing attack (2 files)
- [ ] Prototype pollution (1 file)
- [ ] SSRF (5 files)

**Total**: ~125 critical fixes across ~80 files
