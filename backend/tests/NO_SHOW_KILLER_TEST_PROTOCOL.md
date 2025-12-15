# NO-SHOW-KILLER: Test-Protokoll für Julius

**Datum:** 2025-12-15  
**System:** NO-SHOW-KILLER v1.0  
**Tester:** Julius Wagenfeldt

---

## ⚙️ Vorbereitung

### 1. MessageBird Account Setup
- [ ] Account erstellt auf https://dashboard.messagebird.com
- [ ] Email verifiziert
- [ ] **Test API Key** kopiert (Dashboard → Developers → API Keys)
- [ ] In `.env` eingetragen: `MESSAGEBIRD_API_KEY=test_YOUR_KEY`

### 2. Webhook Setup (Optional für Delivery-Status)
- [ ] Railway URL notiert: `https://jn-automation-production.up.railway.app`
- [ ] MessageBird Dashboard → Webhooks → Add Webhook
  - **URL:** `https://jn-automation-production.up.railway.app/api/webhooks/messagebird`
  - **Events:** `message.sent`, `message.delivered`, `message.failed`
  - **Secret:** Generieren und in Railway setzen: `MESSAGEBIRD_WEBHOOK_SECRET=...`

### 3. Backend starten
```bash
cd backend
npm run dev
```
**Expected:** Server läuft auf http://localhost:5000

### 4. Test-Datenbank vorbereiten
- [ ] MongoDB Atlas verbunden
- [ ] Test-Salon existiert (ID notieren)
- [ ] Test-Customer existiert (ID notieren, **deutsche Handynummer!**)
- [ ] Test-Service existiert (ID notieren)

---

## 📋 TEST 1: SMS-Service Basic

**Ziel:** SMS wird versendet und empfangen

### Setup
```bash
# .env check
MESSAGEBIRD_API_KEY=test_xxxxx  # ✅ Set
```

### Test-Endpoint erstellen (Quick-Add)
```javascript
// backend/routes/systemRoutes.js (oder neues testRoutes.js)
router.post('/test/sms', async (req, res) => {
  const { phoneNumber, message } = req.body;
  
  try {
    const result = await sendSMS(
      phoneNumber,
      message || 'Test SMS von JN Automation 🚀',
      'test-salon-id',
      'custom'
    );
    
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Actions
```bash
curl -X POST http://localhost:5000/api/test/sms \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+4917612345678",
    "message": "TEST: NO-SHOW-KILLER funktioniert! 🎉"
  }'
```

### Expected Results
- [ ] **Response:** `{ "success": true, "messageId": "..." }`
- [ ] **SMS empfangen:** In < 10 Sekunden auf Handy
- [ ] **SMSLog DB:** Neuer Eintrag mit `status: 'sent'`
- [ ] **Console Log:** `✅ SMS sent successfully: { messageId, phoneNumber, template }`

### Verify
```bash
# Check SMSLog in MongoDB
db.smslogs.findOne({ phoneNumber: "+4917612345678" })

# Expected:
{
  _id: ObjectId("..."),
  phoneNumber: "+4917612345678",
  message: "TEST: NO-SHOW-KILLER funktioniert! 🎉",
  template: "custom",
  status: "sent",
  messageId: "...",
  cost: 7,  // 7 cents
  sentAt: ISODate("2025-12-15T...")
}
```

**Status:** ⬜ Pass / ⬜ Fail  
**Notes:**

---

## 📋 TEST 2: Booking Confirmation Flow

**Ziel:** 48h Confirmation SMS wird automatisch versendet

### Setup
```javascript
// Create test booking (via MongoDB Compass or API)
{
  customer: ObjectId("YOUR_CUSTOMER_ID"),
  salon: ObjectId("YOUR_SALON_ID"),
  service: ObjectId("YOUR_SERVICE_ID"),
  startTime: new Date(Date.now() + 50 * 60 * 60 * 1000), // +50 hours
  status: "confirmed"
}
```

### Actions
```bash
# 1. Create confirmation
curl -X POST http://localhost:5000/api/confirmations/YOUR_BOOKING_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Expected Response:
{
  "success": true,
  "message": "Booking confirmation created and SMS sent",
  "confirmation": {
    "id": "675...",
    "bookingId": "675...",
    "status": "pending",
    "confirmationDeadline": "2025-12-17T...",
    "confirmationToken": "abc123..."
  }
}
```

### Expected Results
- [ ] **BookingConfirmation** erstellt in DB
- [ ] **SMS versendet** mit deutschem Text (siehe Template)
- [ ] **confirmationToken** generiert (24 Zeichen)
- [ ] **confirmationDeadline** = now + 48h

### SMS Template Check
```
Hallo {firstName}! 👋

Ihr Termin bei {businessName}:
📅 {date} um {time}
✂️ {serviceName}

⚠️ WICHTIG: Bitte bestätigen Sie Ihren Termin innerhalb von 48h:
https://jn-automation.app/confirm/{token}

Ohne Bestätigung wird der Termin automatisch storniert.

Bei Fragen: {phone}

Abmelden: Antworten Sie mit STOP
```

### Verify
```bash
# Check BookingConfirmation
GET http://localhost:5000/api/confirmations/YOUR_BOOKING_ID
```

**Expected Response:**
```json
{
  "success": true,
  "confirmation": {
    "id": "675...",
    "bookingId": "675...",
    "status": "pending",
    "confirmationDeadline": "2025-12-17T14:00:00Z",
    "remindersSent": 1,
    "lastReminderSent": "2025-12-15T14:00:00Z"
  }
}
```

**Status:** ⬜ Pass / ⬜ Fail  
**Notes:**

---

## 📋 TEST 3: Confirmation-Link Click (Customer Action)

**Ziel:** Kunde bestätigt Termin via SMS-Link

### Setup
- Use `confirmationToken` from TEST 2
- Open browser (inkognito mode, no auth needed)

### Actions
```
1. Open URL: http://localhost:5000/api/confirmations/confirm/{token}
   (Replace {token} with actual token from TEST 2)

2. Expected: Success page with booking details
```

### Expected Results
- [ ] **HTTP 200** Response
- [ ] **Success message:** "Booking confirmed successfully! ✅"
- [ ] **Booking details** angezeigt (customer name, salon, service, time)
- [ ] **Confirmation status** → `confirmed`
- [ ] **Booking status** bleibt `confirmed` (not cancelled)
- [ ] **confirmedAt** timestamp gesetzt

### Response Example
```json
{
  "success": true,
  "message": "Booking confirmed successfully! ✅",
  "confirmation": {
    "status": "confirmed",
    "confirmedAt": "2025-12-15T14:30:00Z",
    "booking": {
      "id": "675...",
      "customer": { "firstName": "Max", "lastName": "Mustermann" },
      "salon": { "businessName": "Salon Test" },
      "service": { "name": "Herrenhaarschnitt" },
      "startTime": "2025-12-17T10:00:00Z"
    }
  }
}
```

### Verify
```bash
# Check confirmation status
GET http://localhost:5000/api/confirmations/YOUR_BOOKING_ID

# Expected: status = "confirmed"
```

### Edge Case: Double Confirmation
```
1. Click link again
2. Expected: "Booking already confirmed" (200 OK, not error)
```

**Status:** ⬜ Pass / ⬜ Fail  
**Notes:**

---

## 📋 TEST 4: Auto-Cancel Worker

**Ziel:** Unbestätigte Bookings werden nach 48h automatisch storniert

### Setup
```javascript
// Option A: Create expired confirmation manually
db.bookingconfirmations.updateOne(
  { bookingId: ObjectId("YOUR_BOOKING_ID") },
  { 
    $set: { 
      confirmationDeadline: new Date(Date.now() - 1000), // 1 second ago
      status: "pending"
    }
  }
);

// Option B: Wait 48 hours (not practical for testing)
```

### Actions
```bash
# Manually trigger auto-cancel worker
# Add this to backend/routes/systemRoutes.js:
router.post('/test/trigger-autocancel', async (req, res) => {
  const { processAutoCancellations } = await import('../workers/autoCancelWorker.js');
  await processAutoCancellations();
  res.json({ success: true, message: 'Auto-cancel worker triggered' });
});

# Then call:
curl -X POST http://localhost:5000/api/test/trigger-autocancel
```

### Expected Results
- [ ] **Worker runs** successfully (check console logs)
- [ ] **Booking status** → `cancelled`
- [ ] **Booking.cancelledAt** timestamp gesetzt
- [ ] **Booking.cancellationReason** = `'auto_cancelled_no_confirmation'`
- [ ] **BookingConfirmation status** → `expired`
- [ ] **autoCancelledAt** timestamp gesetzt
- [ ] **Console log:** `✅ Auto-cancelled booking {id} (no confirmation)`

### Verify
```bash
# Check booking
GET http://localhost:5000/api/bookings/YOUR_BOOKING_ID

# Expected:
{
  "status": "cancelled",
  "cancelledAt": "2025-12-15T14:45:00Z",
  "cancellationReason": "auto_cancelled_no_confirmation"
}

# Check confirmation
GET http://localhost:5000/api/confirmations/YOUR_BOOKING_ID

# Expected:
{
  "status": "expired",
  "autoCancelledAt": "2025-12-15T14:45:00Z"
}
```

### Bonus: Waitlist Trigger
- [ ] **Waitlist matcher** wird getriggert (wenn Waitlist-Einträge existieren)
- [ ] **SlotSuggestion** erstellt für Top-Candidate
- [ ] **SMS sent** zu nächstem Kunden in Warteliste

**Status:** ⬜ Pass / ⬜ Fail  
**Notes:**

---

## 📋 TEST 5: Waitlist + Matcher

**Ziel:** Cancelled Slot wird automatisch mit Warteliste gematcht

### Setup
```javascript
// 1. Create waitlist entry
POST http://localhost:5000/api/waitlist
{
  "customerId": "675...",
  "salonId": "675...",
  "preferredService": "675...",  // SAME as cancelled booking
  "preferredDate": "2025-12-17",
  "preferredTime": "10:00",
  "flexibleTimes": ["09:00", "10:00", "11:00"]
}

// 2. Cancel a booking (creates free slot)
// Use booking from TEST 4 (already cancelled)
// OR create new booking and cancel it:
PATCH http://localhost:5000/api/bookings/YOUR_BOOKING_ID
{
  "status": "cancelled"
}
```

### Actions
```bash
# Manually trigger waitlist matcher
router.post('/test/trigger-matcher', async (req, res) => {
  const { processWaitlistMatching } = await import('../workers/waitlistMatcherWorker.js');
  await processWaitlistMatching();
  res.json({ success: true });
});

curl -X POST http://localhost:5000/api/test/trigger-matcher
```

### Expected Results
- [ ] **Worker finds** cancelled booking from last hour
- [ ] **Worker finds** waitlist entries for same service
- [ ] **Priority score calculated** (50-100 range)
- [ ] **Match score calculated** (time proximity bonus)
- [ ] **SlotSuggestion created** with highest match score
- [ ] **SMS sent** to top candidate
- [ ] **Waitlist.notificationsSent** incremented
- [ ] **Console log:** `✅ Matched slot {bookingId} to customer {customerId} (score: {matchScore})`

### Verify SlotSuggestion
```bash
GET http://localhost:5000/api/slot-suggestions/YOUR_SALON_ID

# Expected response:
{
  "success": true,
  "suggestions": [
    {
      "id": "675...",
      "customerId": {...},
      "serviceId": {...},
      "suggestedSlot": "2025-12-17T10:00:00Z",
      "matchScore": 85,
      "status": "pending",
      "rankedCustomers": [
        { "customerId": "...", "priorityScore": 75, "matchScore": 85, "rank": 1 },
        { "customerId": "...", "priorityScore": 60, "matchScore": 70, "rank": 2 }
      ]
    }
  ],
  "stats": {
    "total": 1,
    "pending": 1,
    "accepted": 0,
    "rejected": 0
  }
}
```

### SMS Template Check
```
Gute Nachricht, {firstName}! 🎉

Ein Termin ist frei geworden bei {businessName}:
📅 {date} um {time}
✂️ {serviceName}

⏰ Schnell sein lohnt sich! Jetzt buchen:
https://jn-automation.app/waitlist/accept/{suggestionId}

Angebot gültig für 2 Stunden.

Abmelden: Antworten Sie mit STOP
```

**Status:** ⬜ Pass / ⬜ Fail  
**Notes:**

---

## 📋 TEST 6: Slot-Suggestion Accept

**Ziel:** Kunde akzeptiert Waitlist-Angebot, Booking wird erstellt

### Setup
- Use SlotSuggestion ID from TEST 5
- Verify suggestion status is still `pending`
- Verify offer hasn't expired (< 2 hours old)

### Actions
```bash
# Customer clicks SMS link (no auth required)
curl -X POST http://localhost:5000/api/slot-suggestions/accept/YOUR_SUGGESTION_ID
```

### Expected Results
- [ ] **HTTP 201** Created
- [ ] **New Booking** erstellt
- [ ] **Booking.source** = `'waitlist'`
- [ ] **Booking.status** = `'confirmed'`
- [ ] **Booking.startTime** matches `suggestedSlot`
- [ ] **SlotSuggestion.status** → `'filled'`
- [ ] **SlotSuggestion.filledAt** timestamp gesetzt
- [ ] **SlotSuggestion.filledBookingId** set to new booking ID
- [ ] **Waitlist.status** → `'fulfilled'`
- [ ] **Waitlist.fulfilledAt** timestamp gesetzt

### Response Example
```json
{
  "success": true,
  "message": "🎉 Booking confirmed! Slot successfully reserved from waitlist.",
  "booking": {
    "id": "675...",
    "customer": "675...",
    "salon": {...},
    "service": {...},
    "startTime": "2025-12-17T10:00:00Z",
    "endTime": "2025-12-17T10:30:00Z",
    "status": "confirmed",
    "source": "waitlist"
  }
}
```

### Verify
```bash
# 1. Check new booking exists
GET http://localhost:5000/api/bookings/NEW_BOOKING_ID

# 2. Check SlotSuggestion updated
GET http://localhost:5000/api/slot-suggestions/YOUR_SALON_ID
# Expected: status = "filled"

# 3. Check Waitlist updated
GET http://localhost:5000/api/waitlist/YOUR_SALON_ID
# Expected: status = "fulfilled"
```

### Edge Cases
```bash
# A) Accept expired suggestion (> 2 hours old)
# Expected: HTTP 410 Gone, "Slot offer has expired"

# B) Accept already-filled suggestion
# Expected: HTTP 409 Conflict, "Slot was just booked by someone else"

# C) Slot no longer available (someone else booked it)
# Expected: HTTP 409 Conflict with message
```

**Status:** ⬜ Pass / ⬜ Fail  
**Notes:**

---

## 📋 TEST 7: SMS-Consent Opt-out (GDPR)

**Ziel:** Kunde kann SMS abbestellen, weitere SMS werden blockiert

### Setup
```javascript
// Create SMS consent (usually done during booking)
POST http://localhost:5000/api/sms-consent/opt-in
{
  "customerId": "YOUR_CUSTOMER_ID",
  "salonId": "YOUR_SALON_ID",
  "phoneNumber": "+4917612345678"
}

// Verify consent active
GET http://localhost:5000/api/sms-consent/YOUR_CUSTOMER_ID/YOUR_SALON_ID
// Expected: { "active": true }
```

### Actions
```bash
# 1. Customer opts out
curl -X POST http://localhost:5000/api/sms-consent/opt-out \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "YOUR_CUSTOMER_ID",
    "salonId": "YOUR_SALON_ID"
  }'

# Expected Response:
{
  "success": true,
  "message": "Successfully opted out of SMS notifications",
  "consent": {
    "active": false,
    "optOutDate": "2025-12-15T15:00:00Z"
  }
}
```

### Expected Results
- [ ] **SMSConsent.active** → `false`
- [ ] **SMSConsent.optOutDate** timestamp gesetzt
- [ ] **Console log:** `📵 Customer opted out: +4917612345678`

### Verify: SMS Blocking
```bash
# 2. Try to send SMS after opt-out
POST http://localhost:5000/api/test/sms
{
  "phoneNumber": "+4917612345678",
  "message": "This should be blocked!"
}

# Expected: Error thrown
{
  "success": false,
  "error": "Customer has not opted in for SMS notifications"
}
```

### Verify: No SMSLog Entry
```javascript
// Check MongoDB
db.smslogs.find({ 
  phoneNumber: "+4917612345678",
  createdAt: { $gt: new Date("2025-12-15T15:00:00Z") }
})

// Expected: Empty result (no SMS sent after opt-out)
```

### Re-Opt-In Test
```bash
# 3. Customer opts back in
curl -X POST http://localhost:5000/api/sms-consent/opt-in \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "YOUR_CUSTOMER_ID",
    "salonId": "YOUR_SALON_ID",
    "phoneNumber": "+4917612345678"
  }'

# Expected: active = true again

# 4. Try sending SMS again
POST http://localhost:5000/api/test/sms
{
  "phoneNumber": "+4917612345678",
  "message": "Opt-in successful! 🎉"
}

# Expected: SMS delivered successfully
```

**Status:** ⬜ Pass / ⬜ Fail  
**Notes:**

---

## 🎯 TEST 8: 24h Reminder SMS (Bonus)

**Ziel:** Bestätigte Termine erhalten 24h Reminder

### Setup
```javascript
// Create booking 24h in future
{
  customer: ObjectId("..."),
  salon: ObjectId("..."),
  service: ObjectId("..."),
  startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24 hours
  status: "confirmed"
}

// Create confirmation (already confirmed)
{
  bookingId: ObjectId("..."),
  status: "confirmed",
  confirmedAt: new Date()
}
```

### Actions
```bash
# Manually trigger reminder worker
router.post('/test/trigger-reminder', async (req, res) => {
  const { processReminders } = await import('../workers/reminderWorker.js');
  await processReminders();
  res.json({ success: true });
});

curl -X POST http://localhost:5000/api/test/trigger-reminder
```

### Expected Results
- [ ] **Worker finds** bookings 23-25h away
- [ ] **Only confirmed** bookings get reminder
- [ ] **SMS sent** with reminder template
- [ ] **BookingConfirmation.remindersSent** incremented (should be 2: 48h + 24h)
- [ ] **lastReminderSent** timestamp updated

### SMS Template Check
```
Erinnerung: Ihr Termin ist morgen! ⏰

{businessName}
📅 {date} um {time}
✂️ {serviceName}

Adresse: {address}

Wir freuen uns auf Sie! 😊

Bei Änderungen: {phone}

Abmelden: Antworten Sie mit STOP
```

**Status:** ⬜ Pass / ⬜ Fail  
**Notes:**

---

## 📊 Final Summary

**Test Results:**
- ✅ TEST 1: SMS Service Basic
- ✅ TEST 2: Booking Confirmation Flow
- ✅ TEST 3: Confirmation Link Click
- ✅ TEST 4: Auto-Cancel Worker
- ✅ TEST 5: Waitlist + Matcher
- ✅ TEST 6: Slot-Suggestion Accept
- ✅ TEST 7: SMS-Consent Opt-out
- ✅ TEST 8: 24h Reminder SMS

**Total:** X / 8 Passed

---

## 🐛 Issues Found

| Issue | Severity | Description | Fix |
|-------|----------|-------------|-----|
| 1     | High     |             |     |
| 2     | Medium   |             |     |
| 3     | Low      |             |     |

---

## 🚀 Ready for Production?

- [ ] All 8 tests passed
- [ ] No critical bugs found
- [ ] MessageBird Live API Key added to Railway
- [ ] Webhook configured in MessageBird Dashboard
- [ ] SMS templates reviewed (German language, emojis)
- [ ] Rate limiting tested (no throttling)
- [ ] Cost monitoring setup (MessageBird Dashboard)

**Go-Live Date:** __________

**Signed:** Julius Wagenfeldt
