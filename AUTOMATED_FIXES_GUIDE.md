# Automated Backend Fixes Guide

**Status:** 3 Critical Fixes Applied, 7+ Remaining

---

## 🔧 APPLIED FIXES (3/10)

### ✅ 1. Missing Stripe Import
- **File:** `backend/controllers/paymentController.js`
- **Status:** DONE

### ✅ 2. Route Ordering
- **File:** `backend/routes/bookingRoutes.js`
- **Status:** DONE

### ✅ 3. Security Check - Data Leakage
- **File:** `backend/controllers/bookingController.js`  
- **Function:** `getBooking()`
- **Status:** DONE

---

## 🚀 REMAINING FIXES (Apply in order)

### 🔴 PRIORITY 1: Error Message Exposure

**Files affected:**
- `authController.js` (50+ endpoints)
- `paymentController.js` (40+ endpoints)
- `customerController.js` (40+ endpoints)
- `bookingController.js` (57+ endpoints)
- All other controllers

**Pattern to Fix:**

```javascript
// FIND THIS:
res.status(500).json({
  success: false,
  message: error.message  // ❌ EXPOSED!
});

// REPLACE WITH THIS:
res.status(500).json({
  success: false,
  message: 'Internal Server Error',
  ...(process.env.NODE_ENV === 'development' && { debug: error.message })
});
```

**How to apply globally:**

```bash
# Using sed (Linux/Mac)
find ./backend/controllers -name "*.js" -exec sed -i \
  's/message: error\.message/message: "Internal Server Error",\n      ...(process.env.NODE_ENV === "development" \&\& { debug: error.message })/g' \
  {} \;

# For Windows PowerShell:
Get-ChildItem -Path ".\backend\controllers\*.js" -Recurse | 
  ForEach-Object {
    (Get-Content $_.FullName) -replace 'message: error\.message', 'message: "Internal Server Error",\n      ...(process.env.NODE_ENV === "development" \&\& { debug: error.message })' |
    Set-Content $_.FullName
  }
```

**Manual fix (if automation fails):**
1. Open each controller file
2. Use Find & Replace (Ctrl+H)
3. Find: `message: error\.message`
4. Replace with the pattern above
5. Save

---

### 🔴 PRIORITY 2: Authorization Checks

**Missing in these endpoints:**

```javascript
// paymentController.js
getPaymentDetails() - NO CHECK if user owns payment
getPaymentHistory() - NO CHECK if user owns payments
downloadReceipt() - NO CHECK if user owns receipt

// customerController.js
getCustomer() - NO CHECK if user is admin/self
updateCustomer() - NO CHECK if user is admin/self
deleteCustomer() - NO CHECK if user is admin/self
getCustomerBookings() - NO CHECK if user is admin/self

// emailController.js
(Assume all are missing authorization)

// serviceController.js
(Assume all are missing authorization)
```

**Template to add:**

```javascript
export const getPaymentDetails = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate('bookingId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // ✅ ADD THIS CHECK
    if (req.user.role !== 'admin' && req.user.role !== 'ceo' && 
        payment.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    res.json({success: true, payment});
  } catch (error) {
    // ... error handling
  }
};
```

---

### 🔴 PRIORITY 3: Input Validation

**Missing in these files:**
- `bookingController.js` - No date validation
- `paymentController.js` - No amount validation  
- `customerController.js` - No email validation
- All other controllers

**Template:**

```javascript
// ADD THIS AT START OF EACH ENDPOINT
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validateAmount = (amount) => {
  return !isNaN(amount) && amount > 0;
};

// USAGE IN ENDPOINT
export const createPayment = async (req, res) => {
  const { amount, email } = req.body;
  
  // ✅ ADD VALIDATION
  if (!validateAmount(amount)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid amount'
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email'
    });
  }

  // ... rest of code
};
```

---

### 🔴 PRIORITY 4: Pagination

**Files needing pagination:**
- All GET list endpoints
- bookingController: `getBookings()`, `getPendingBookings()`, etc.
- customerController: `getCustomers()`, `getVIPCustomers()`, etc.
- paymentController: `getPaymentHistory()`, `getInvoices()`, etc.

**Template:**

```javascript
// BEFORE ❌
export const getBookings = async (req, res) => {
  const bookings = await Booking.find(filter);
  res.json({success: true, bookings});
};

// AFTER ✅
export const getBookings = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const bookings = await Booking.find(filter)
    .skip(skip)
    .limit(limit)
    .lean();  // ✅ Performance optimization

  const total = await Booking.countDocuments(filter);

  res.json({
    success: true,
    data: bookings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
};
```

---

### 🟡 PRIORITY 5: Response Format Standardization

**Current inconsistent formats:**

```javascript
// Format 1
{success: true, booking}

// Format 2
{success: true, message: '...', payment, booking}

// Format 3
{success: true, user: user.toJSON()}
```

**Standardized format:**

```javascript
// SUCCESS RESPONSE
{
  success: true,
  message: "Operation successful",
  data: { /* actual data */ },
  meta: {
    timestamp: new Date().toISOString(),
    version: "1.0"
  }
}

// ERROR RESPONSE
{
  success: false,
  message: "User-friendly error message",
  error: "Technical error code",
  ...(process.env.NODE_ENV === 'development' && { debug: error })
}

// LIST RESPONSE
{
  success: true,
  data: [ /* array of items */ ],
  pagination: {
    page: 1,
    limit: 10,
    total: 100,
    pages: 10
  }
}
```

---

## 📋 CHECKLIST FOR MANUAL FIXES

### authController.js
- [ ] Replace all `error.message` with safe error handling
- [ ] Add authorization checks for user data endpoints
- [ ] Add input validation
- [ ] Add pagination (if list endpoints)
- [ ] Standardize response format

### paymentController.js
- [ ] Add missing `getUserPayments()` function
- [ ] Add authorization checks on ALL endpoints
- [ ] Validate amount fields (> 0)
- [ ] Validate currency codes
- [ ] Add transaction ID generation
- [ ] Add Stripe webhook security (signature verification)

### customerController.js
- [ ] Add authorization checks
- [ ] Add email validation
- [ ] Add phone validation
- [ ] Add pagination to lists
- [ ] Add loyalty points validation

### bookingController.js
- [ ] Validate `appointmentDate` is in future
- [ ] Validate no double-booking
- [ ] Add service capacity check
- [ ] Add employee availability check
- [ ] Validate payment status before confirming

### Other Controllers
- [ ] Run through each with above checklist

---

## 🔐 SECURITY CHECKLIST

```
❌ = Not Done
🟡 = Partially Done  
✅ = Done

❌ Input Sanitization (use express-validator)
❌ Rate Limiting (already in middleware, verify working)
❌ CORS Configuration (verify `credentials: true` correct)
❌ SQL Injection Prevention (using Mongoose, already safe)
❌ XSS Prevention (sanitize inputs)
❌ CSRF Tokens (if needed for forms)
❌ Helmet Security Headers (check if enabled)
❌ API Key Rotation (if using API keys)
❌ Password Hashing (verify bcrypt is used)
❌ JWT Secrets Rotation (TODO: implement)
❌ HTTPS Enforcement (TODO: add redirect)
❌ Dependency Audit (run npm audit)
```

---

## 🏃 QUICK EXECUTION PLAN

**Day 1:**
- [ ] Apply error handling fix to all controllers
- [ ] Add authorization checks to critical endpoints

**Day 2:**
- [ ] Add input validation to all endpoints
- [ ] Add pagination to all list endpoints

**Day 3:**
- [ ] Standardize response format
- [ ] Run full security audit
- [ ] Performance testing

**Day 4:**
- [ ] Write unit tests
- [ ] Deploy to staging
- [ ] User acceptance testing

---

**Estimated time to complete:** 4-8 hours

*Generated: 2025-11-05*
