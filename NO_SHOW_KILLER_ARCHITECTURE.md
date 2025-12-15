# 🎯 NO-SHOW-KILLER System Architecture

**Status**: Design Phase  
**Priority**: 🔥🔥🔥🔥🔥 (10/10)  
**Timeline**: 2-3 Wochen  
**Impact**: Direkt messbarer ROI, #1 Pain-Point Lösung

---

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     NO-SHOW-KILLER SYSTEM                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   48h SMS    │───▶│ Confirmation │───▶│ Auto-Cancel  │  │
│  │   Reminder   │    │   Tracking   │    │   Logic      │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                                        │           │
│         ▼                                        ▼           │
│  ┌──────────────┐                      ┌──────────────┐    │
│  │  Twilio/MB   │                      │  Waitlist    │    │
│  │  SMS Gateway │                      │  Matching    │    │
│  └──────────────┘                      └──────────────┘    │
│                                                │             │
│                                                ▼             │
│                                       ┌──────────────┐      │
│                                       │ Lücken-Agent │      │
│                                       │ (ML Ranking) │      │
│                                       └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### 1. BookingConfirmation Model

```javascript
{
  bookingId: ObjectId,              // Ref: Booking
  salonId: ObjectId,                // Ref: Salon
  customerPhone: String,            // +49... format
  
  // Confirmation Status
  confirmationRequired: Boolean,     // default: true
  confirmationSentAt: Date,         // 48h before appointment
  confirmedAt: Date,                // when customer confirmed
  confirmationMethod: String,       // 'sms', 'whatsapp', 'email'
  confirmationToken: String,        // unique token for link
  
  // SMS Tracking
  smsMessageId: String,             // Twilio/MessageBird ID
  smsStatus: String,                // 'queued', 'sent', 'delivered', 'failed'
  smsDeliveredAt: Date,
  smsFailureReason: String,
  
  // Auto-Cancel
  autoCancelScheduledAt: Date,      // 48h - 2h = 46h mark
  autoCancelled: Boolean,
  autoCancelReason: String,         // 'no_confirmation', 'expired'
  
  // Reminders
  remindersSent: [{
    sentAt: Date,
    type: String,                   // 'first', 'second', 'final'
    status: String
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Waitlist Model

```javascript
{
  customerId: ObjectId,             // Ref: User (or embedded customer data)
  salonId: ObjectId,                // Ref: Salon
  serviceId: ObjectId,              // Ref: Service
  
  // Customer Preferences
  customerName: String,
  customerPhone: String,
  customerEmail: String,
  
  // Preferred Slots
  preferredDates: [Date],           // flexible dates
  preferredTimeRanges: [{
    dayOfWeek: Number,              // 0=Sunday, 1=Monday...
    startTime: String,              // "09:00"
    endTime: String                 // "18:00"
  }],
  
  // Matching Criteria
  maxDistanceKm: Number,            // optional: geo-based
  minAdvanceNoticeHours: Number,    // default: 24h
  
  // Status
  status: String,                   // 'active', 'matched', 'expired', 'cancelled'
  matchedBookingId: ObjectId,       // wenn slot gefunden
  notifiedAt: Date,                 // when customer was notified
  expiresAt: Date,                  // auto-expire after 30 days
  
  // Priority Score (ML)
  reliabilityScore: Number,         // 0-100 (based on history)
  priorityScore: Number,            // calculated by ML agent
  
  // History
  timesNotified: Number,
  timesAccepted: Number,
  timesDeclined: Number,
  
  createdAt: Date,
  updatedAt: Date
}
```

### 3. SlotSuggestion Model (ML Agent Output)

```javascript
{
  salonId: ObjectId,
  slotStartTime: Date,
  slotEndTime: Date,
  serviceId: ObjectId,
  
  // Ranked Customers
  suggestedCustomers: [{
    waitlistId: ObjectId,
    customerId: ObjectId,
    customerName: String,
    customerPhone: String,
    matchScore: Number,             // 0-100
    reasonCode: String,             // 'high_reliability', 'perfect_time_match', 'previous_service'
    reasonText: String
  }],
  
  // Slot Value
  estimatedRevenue: Number,
  urgencyScore: Number,             // how soon is the slot
  
  status: String,                   // 'pending', 'sent', 'filled', 'expired'
  sentAt: Date,
  filledAt: Date,
  
  createdAt: Date
}
```

### 4. NoShowAnalytics Model (Aggregated Stats)

```javascript
{
  salonId: ObjectId,
  period: String,                   // 'daily', 'weekly', 'monthly'
  periodStart: Date,
  periodEnd: Date,
  
  // No-Show Metrics
  totalBookings: Number,
  totalConfirmed: Number,
  totalNoShows: Number,
  noShowRate: Number,               // %
  
  // Revenue Impact
  revenueAtRisk: Number,            // total € of unconfirmed bookings
  revenueSaved: Number,             // € saved durch Warteliste-Filling
  
  // Confirmation Stats
  confirmationsSent: Number,
  confirmationsReceived: Number,
  confirmationRate: Number,         // %
  avgConfirmationTime: Number,      // minutes from sent to confirmed
  
  // Waitlist Performance
  waitlistMatches: Number,
  waitlistAcceptanceRate: Number,
  waitlistRevenue: Number,
  
  // Customer Reliability
  topReliableCustomers: [{
    customerId: ObjectId,
    reliabilityScore: Number,
    totalBookings: Number,
    noShowCount: Number
  }],
  
  createdAt: Date
}
```

---

## 🔌 API Endpoints

### Confirmation Endpoints

```
POST   /api/bookings/:id/send-confirmation
  → Trigger 48h reminder SMS
  → Body: { method: 'sms' | 'whatsapp' | 'both' }

GET    /api/bookings/confirm/:token
  → Public confirmation page (mobile-optimized)
  → Returns: booking details + confirm button

POST   /api/bookings/confirm/:token
  → Customer confirms booking
  → Updates BookingConfirmation.confirmedAt

GET    /api/bookings/:id/confirmation-status
  → Check if booking is confirmed
  → Returns: { confirmed, sentAt, confirmedAt, remainingTime }
```

### Waitlist Endpoints

```
POST   /api/waitlist
  → Customer adds self to waitlist
  → Body: { serviceId, preferredDates, preferredTimeRanges, phone, email }

GET    /api/waitlist/:salonId
  → Salon views their waitlist
  → Returns: paginated waitlist entries with priority scores

POST   /api/waitlist/:id/notify
  → Manually notify waitlist customer about slot
  → Body: { slotStartTime, message }

DELETE /api/waitlist/:id
  → Remove from waitlist
```

### Slot Matching Endpoints

```
GET    /api/slots/available/:salonId
  → Get all unfilled slots (cancelled/no-show)
  → Returns: slots with suggested waitlist customers

POST   /api/slots/auto-fill
  → Trigger ML agent to find best matches
  → Body: { slotId } or automatic via cron

GET    /api/slots/suggestions/:salonId
  → View AI-generated slot filling suggestions
  → Returns: ranked customer matches for empty slots
```

### Analytics Endpoints

```
GET    /api/analytics/no-show/:salonId
  → No-show rate, revenue impact, trends
  → Query: ?period=weekly&startDate=...

GET    /api/analytics/waitlist-performance/:salonId
  → Waitlist acceptance rate, revenue saved

GET    /api/analytics/customer-reliability/:salonId
  → Top/bottom customers by reliability score
```

---

## 📱 SMS/WhatsApp Message Templates

### 1. Initial 48h Confirmation Request

```
DE:
Hallo {customerName}! 👋

Erinnerung an deinen Termin:
📅 {date} um {time}
💇 {serviceName} bei {salonName}

Bitte bestätige bis {deadline}:
✅ {confirmLink}

Ohne Bestätigung wird der Termin storniert.

──────────────
EN:
Hi {customerName}! 👋

Your appointment reminder:
📅 {date} at {time}
💇 {serviceName} at {salonName}

Please confirm by {deadline}:
✅ {confirmLink}

Without confirmation, the appointment will be cancelled.
```

### 2. Second Reminder (24h before deadline)

```
DE:
⏰ Letzte Chance, {customerName}!

Dein Termin am {date} um {time} wird in {hoursLeft} Stunden automatisch storniert.

Jetzt bestätigen: {confirmLink}

──────────────
EN:
⏰ Last chance, {customerName}!

Your appointment on {date} at {time} will be auto-cancelled in {hoursLeft} hours.

Confirm now: {confirmLink}
```

### 3. Confirmation Success

```
DE:
✅ Termin bestätigt!

Wir freuen uns auf dich am {date} um {time}!
{salonName}

──────────────
EN:
✅ Appointment confirmed!

See you on {date} at {time}!
{salonName}
```

### 4. Auto-Cancel Notification

```
DE:
❌ Termin storniert

Dein Termin am {date} wurde aufgrund fehlender Bestätigung automatisch storniert.

Neuen Termin buchen: {bookingLink}

──────────────
EN:
❌ Appointment cancelled

Your appointment on {date} was auto-cancelled due to no confirmation.

Book new appointment: {bookingLink}
```

### 5. Waitlist Slot Available

```
DE:
🎉 Freier Termin für dich!

Ein Termin ist frei geworden:
📅 {date} um {time}
💇 {serviceName} bei {salonName}

Jetzt buchen (nur 2h gültig): {bookingLink}

──────────────
EN:
🎉 Slot available for you!

An appointment became available:
📅 {date} at {time}
💇 {serviceName} at {salonName}

Book now (valid 2h): {bookingLink}
```

---

## ⚙️ Cron Jobs & Workers

### 1. Confirmation Sender Worker

```javascript
// Runs every hour
Schedule: "0 * * * *"

Logic:
1. Find all bookings where:
   - bookingDate is exactly 48h from now
   - status = 'confirmed'
   - no BookingConfirmation exists yet

2. For each booking:
   - Create BookingConfirmation entry
   - Generate unique token
   - Send SMS via Twilio/MessageBird
   - Schedule auto-cancel job (46h from now)
```

### 2. Auto-Cancel Worker

```javascript
// Runs every 30 minutes
Schedule: "*/30 * * * *"

Logic:
1. Find all BookingConfirmation where:
   - autoCancelScheduledAt <= now
   - confirmedAt is null
   - autoCancelled = false

2. For each:
   - Cancel booking (status → 'cancelled', reason → 'no_confirmation')
   - Trigger waitlist matching
   - Send notification to salon owner
   - Mark as autoCancelled
```

### 3. Waitlist Matcher Worker

```javascript
// Runs every 15 minutes
Schedule: "*/15 * * * *"

Logic:
1. Find recently cancelled bookings
2. Find all active waitlist entries for same salon/service
3. Run ML ranking algorithm
4. Send SMS to top 3 matches
5. First to respond gets the slot
```

### 4. Reminder Follow-Up Worker

```javascript
// Runs every 6 hours
Schedule: "0 */6 * * *"

Logic:
1. Find BookingConfirmation where:
   - confirmedAt is null
   - autoCancelScheduledAt - now < 24h
   - remindersSent.length < 2

2. Send follow-up reminder SMS
```

---

## 🤖 ML Agent: Slot Matching Algorithm

### Input Data

```javascript
{
  slot: {
    startTime: Date,
    endTime: Date,
    serviceId: ObjectId,
    salonId: ObjectId,
    estimatedRevenue: Number
  },
  waitlistCustomers: [{
    customerId: ObjectId,
    preferredTimes: Array,
    reliabilityScore: Number,
    previousServices: Array,
    avgResponseTime: Number,
    lastBookingDate: Date
  }]
}
```

### Scoring Factors (Weighted)

```javascript
function calculateMatchScore(slot, customer) {
  let score = 0;
  
  // 1. Time Match (30%)
  if (isInPreferredTimeRange(slot.startTime, customer.preferredTimes)) {
    score += 30;
  }
  
  // 2. Reliability Score (25%)
  score += customer.reliabilityScore * 0.25;
  
  // 3. Service History (20%)
  if (hasBookedServiceBefore(customer, slot.serviceId)) {
    score += 20;
  }
  
  // 4. Recency Bonus (15%)
  const daysSinceLastBooking = getDaysSince(customer.lastBookingDate);
  if (daysSinceLastBooking > 30) {
    score += 15; // prioritize returning customers
  }
  
  // 5. Response Time (10%)
  if (customer.avgResponseTime < 3600) { // < 1 hour
    score += 10;
  }
  
  return Math.min(score, 100);
}
```

### Ranking Output

```javascript
[
  {
    customerId: "...",
    matchScore: 92,
    reasons: [
      "Perfect time match (preferred slot)",
      "High reliability (95% show-up rate)",
      "Previous customer (3 past bookings)"
    ]
  },
  {
    customerId: "...",
    matchScore: 78,
    reasons: [
      "Good time match",
      "Fast responder (avg 15 min)"
    ]
  }
]
```

---

## 🔐 Security & Privacy

### GDPR Compliance

```javascript
// Data Retention
- BookingConfirmation: Delete after 90 days
- Waitlist: Auto-expire after 30 days
- SMS logs: Pseudonymized after 7 days
- Analytics: Aggregated only, no PII

// Customer Rights
- DELETE /api/customer/:id/data → Full data deletion
- GET /api/customer/:id/export → GDPR export
- POST /api/customer/:id/opt-out → SMS opt-out
```

### SMS Rate Limiting

```javascript
// Per Customer
- Max 3 SMS per day
- Max 1 SMS per hour
- Blacklist after 5 undelivered

// Per Salon
- Max 1000 SMS/day (adjustable per plan)
- Alert at 80% quota
```

---

## 💰 Cost Estimation

### Twilio Pricing (Germany)

```
SMS (DE): ~0.075 EUR/SMS
WhatsApp: ~0.005 EUR/message (outbound)

Example Salon (100 appointments/month):
- 100 SMS confirmations: 7.50 EUR
- 20 reminders: 1.50 EUR
- 10 waitlist notifications: 0.75 EUR
Total: ~10 EUR/month
```

### MessageBird Pricing

```
SMS (DE): ~0.05 EUR/SMS (cheaper!)
WhatsApp: ~0.004 EUR/message

Same salon: ~6 EUR/month
```

**Recommendation**: Start with MessageBird (cheaper, EU-based, GDPR-friendly)

---

## 📈 Success Metrics (KPIs)

### Phase 1: MVP (Weeks 1-2)
- ✅ SMS confirmation system working
- ✅ Auto-cancel after 48h no confirmation
- ✅ Basic waitlist (manual matching)
- **Target**: 80% confirmation rate

### Phase 2: Automation (Week 3)
- ✅ Auto-matching algorithm
- ✅ ML ranking v1
- ✅ Analytics dashboard
- **Target**: 50% of cancellations auto-filled

### Phase 3: Optimization (Week 4+)
- ✅ WhatsApp support
- ✅ ML model training on real data
- ✅ Predictive no-show risk
- **Target**: <5% no-show rate

---

## 🚀 Implementation Plan

### Week 1: Foundation
- [ ] Create DB models (BookingConfirmation, Waitlist)
- [ ] MessageBird integration + test SMS
- [ ] Confirmation endpoint + public page
- [ ] 48h reminder cron job

### Week 2: Auto-Cancel + Waitlist
- [ ] Auto-cancel logic
- [ ] Waitlist CRUD endpoints
- [ ] Manual slot matching
- [ ] SMS templates (DE/EN)

### Week 3: ML Agent
- [ ] Matching algorithm v1 (rule-based)
- [ ] Auto-notification to waitlist
- [ ] Analytics models + endpoints
- [ ] Dashboard UI (basic)

### Week 4: Polish & Launch
- [ ] ML scoring refinement
- [ ] Customer reliability tracking
- [ ] Admin controls (enable/disable per salon)
- [ ] Beta testing with 3 salons
- [ ] Production rollout

---

## 🎯 Next Steps

1. **Approve Architecture** ✅
2. **Provider Decision**: MessageBird vs Twilio
3. **Create DB Models** (start coding)
4. **Setup MessageBird Account** (test credentials)
5. **Build Confirmation Flow** (backend + frontend)

---

**Status**: ✅ Architecture Complete  
**Ready to Code**: YES  
**Estimated Dev Time**: 2-3 weeks  
**Expected ROI**: 10-30% revenue increase per salon
