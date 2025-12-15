# NO-SHOW-KILLER: MessageBird Setup Guide

## 🎯 Complete Implementation (2025-12-15)

✅ **Implemented Components:**
- [x] MessageBird SDK installed (`npm install messagebird`)
- [x] SMS Service with 4 templates (confirmation, waitlist, reminder, followup)
- [x] 6 Database Models (BookingConfirmation, Waitlist, SlotSuggestion, SMSConsent, NoShowAnalytics, SMSLog)
- [x] 4 API Route Files (12 endpoints total)
  - smsConsentRoutes.js (opt-in, opt-out, check consent)
  - confirmationRoutes.js (create, confirm via link, check status)
  - waitlistRoutes.js (join, list, update, remove)
  - slotSuggestionRoutes.js (accept, reject, admin dashboard)
- [x] 4 Background Workers
  - confirmationSenderWorker.js (every 5 min)
  - autoCancelWorker.js (every 15 min)
  - waitlistMatcherWorker.js (every 15 min)
  - reminderWorker.js (every 30 min)
- [x] server.js integration (routes + workers registered)

---

## 📋 MessageBird Account Setup (Required Before Testing)

### Step 1: Create MessageBird Account
1. Go to https://dashboard.messagebird.com/sign-up
2. Sign up with business email
3. Verify email address
4. Complete KYC verification (for production SMS)

### Step 2: Get API Keys
1. Login to https://dashboard.messagebird.com
2. Go to **Developers** → **API Keys**
3. Copy your **Test API Key** (starts with `test_`)
4. Copy your **Live API Key** (starts with `live_`) - **ONLY for production**

### Step 3: Add to Local Environment
```bash
# Edit backend/.env
MESSAGEBIRD_API_KEY=test_YOUR_TEST_KEY_HERE
MESSAGEBIRD_ORIGINATOR=JN_Business
MESSAGEBIRD_RATE_LIMIT_PER_SECOND=10
```

### Step 4: Add to Railway (Production)
```bash
railway login
railway link
railway variables set MESSAGEBIRD_API_KEY="live_YOUR_LIVE_KEY_HERE"
railway variables set MESSAGEBIRD_ORIGINATOR="JN_Business"
railway variables set MESSAGEBIRD_RATE_LIMIT_PER_SECOND="10"
```

---

## 🧪 Testing the NO-SHOW-KILLER System

### Test 1: SMS Consent (GDPR)
```bash
# Opt-in a customer
curl -X POST http://localhost:5000/api/sms-consent/opt-in \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "6759...",
    "salonId": "6759...",
    "phoneNumber": "+4917612345678"
  }'

# Check consent status
curl http://localhost:5000/api/sms-consent/6759.../6759... \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test 2: Booking Confirmation (48h)
```bash
# Worker will automatically:
# 1. Find bookings 48-72h away
# 2. Create BookingConfirmation
# 3. Send SMS with confirmation link
# 4. Track confirmation deadline

# Check worker logs:
tail -f backend/logs/combined.log | grep ConfirmationSender
```

### Test 3: Confirm Booking (Customer)
```bash
# Customer clicks SMS link (no auth required):
# GET /api/confirmations/confirm/abc123token
# → Marks booking as confirmed
# → Cancels auto-cancel timer

# Test manually:
curl http://localhost:5000/api/confirmations/confirm/abc123token
```

### Test 4: Auto-Cancel Unconfirmed Bookings
```bash
# Worker runs every 15 min:
# 1. Find expired confirmations (48h passed, not confirmed)
# 2. Cancel booking
# 3. Trigger waitlist matcher
# 4. Send SMS to next customer

# Check worker logs:
tail -f backend/logs/combined.log | grep AutoCancel
```

### Test 5: Waitlist Matching
```bash
# Join waitlist
curl -X POST http://localhost:5000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "6759...",
    "salonId": "6759...",
    "preferredService": "6759...",
    "preferredDate": "2025-12-20",
    "preferredTime": "14:00"
  }'

# When slot becomes available:
# 1. waitlistMatcherWorker calculates priority scores
# 2. Creates SlotSuggestion for top candidate
# 3. Sends SMS with accept link
# 4. Offer expires after 2 hours

# Check worker logs:
tail -f backend/logs/combined.log | grep WaitlistMatcher
```

### Test 6: Accept Waitlist Offer (Customer)
```bash
# Customer clicks SMS link (no auth required):
# GET /api/slot-suggestions/accept/6759...
# → Creates Booking
# → Marks SlotSuggestion as filled
# → Marks Waitlist as fulfilled

# Test manually:
curl -X POST http://localhost:5000/api/slot-suggestions/accept/6759...
```

### Test 7: 24h Reminder SMS
```bash
# Worker runs every 30 min:
# 1. Find confirmed bookings 23-25h away
# 2. Send reminder SMS
# 3. Track reminder sent in BookingConfirmation

# Check worker logs:
tail -f backend/logs/combined.log | grep Reminder
```

---

## 📊 Cost Estimates (MessageBird Germany)

**SMS Cost:** €0.0675 per SMS

| Bookings/Month | Confirmations | Reminders | Waitlist | Total SMS | Cost/Month |
|----------------|---------------|-----------|----------|-----------|------------|
| 50             | 50            | 50        | 10       | 110       | €7-10      |
| 150            | 150           | 150       | 30       | 330       | €20-25     |
| 500            | 500           | 500       | 100      | 1,100     | €65-80     |

**Expected ROI:**
- 50 bookings: **10-20% reduction in no-shows** → 5-10 saved bookings → €200-500 revenue saved
- 150 bookings: **15-25% reduction** → 20-40 saved bookings → €800-1,600 saved
- 500 bookings: **20-30% reduction** → 100-150 saved bookings → €4,000-6,000 saved

**Break-even:** First saved booking pays for entire month.

---

## 🔧 System Configuration

### Rate Limiting
```javascript
// smsService.js
const RATE_LIMIT = 10; // 10 SMS per second (MessageBird limit: 100/sec)
```

### Worker Intervals
```javascript
// confirmationSenderWorker.js: Every 5 minutes
cron.schedule('*/5 * * * *', processConfirmations);

// autoCancelWorker.js: Every 15 minutes
cron.schedule('*/15 * * * *', processAutoCancellations);

// waitlistMatcherWorker.js: Every 15 minutes
cron.schedule('*/15 * * * *', processWaitlistMatching);

// reminderWorker.js: Every 30 minutes
cron.schedule('*/30 * * * *', processReminders);
```

### Do-Not-Disturb Hours
```javascript
// SMSConsent model
canSendNow() {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 8 && hour < 22; // 08:00 - 22:00
}
```

---

## 🚀 Deployment Checklist

### Before Railway Deploy:
- [ ] MessageBird account created
- [ ] Test API key obtained
- [ ] Local testing completed (all 7 tests pass)
- [ ] SMS templates reviewed (German language, emojis work)
- [ ] Rate limiting tested (no throttling errors)

### Railway Variables Required:
```bash
MESSAGEBIRD_API_KEY=live_YOUR_LIVE_KEY_HERE
MESSAGEBIRD_ORIGINATOR=JN_Business
MESSAGEBIRD_RATE_LIMIT_PER_SECOND=10
```

### After Deploy:
- [ ] Check worker logs (Railway CLI: `railway logs`)
- [ ] Monitor SMS cost (MessageBird dashboard)
- [ ] Track no-show rate reduction (NoShowAnalytics model)
- [ ] Review customer feedback on SMS experience

---

## 📈 Monitoring & Analytics

### SMS Stats API
```bash
# Get SMS statistics for salon
GET /api/sms-consent/salon/6759...
# Returns: total sent, delivery rate, opt-out rate

# Get cost report
# SMSLog.getCostReport(salonId, startDate, endDate)
```

### No-Show Analytics
```javascript
// NoShowAnalytics model
const analytics = await NoShowAnalytics.generateForPeriod(
  salonId,
  'weekly',
  new Date()
);

console.log(analytics.confirmationRate); // % confirmed
console.log(analytics.noShowRate); // % no-shows
console.log(analytics.revenueProtected); // € saved
console.log(analytics.roi); // Return on Investment
```

### Health Check
```bash
GET /health
# Returns: workers status, SMS queue length, last SMS sent
```

---

## 🐛 Troubleshooting

### SMS Not Sending
1. Check MessageBird API key is valid (Test vs Live)
2. Verify phone number format: E.164 (`+4917612345678`)
3. Check SMS consent exists and is active
4. Review rate limiting (queue backed up?)
5. Check MessageBird balance (production only)

### Worker Not Running
1. Check server logs: `tail -f backend/logs/combined.log`
2. Verify cron schedule syntax
3. Check MongoDB connection (workers need DB)
4. Restart server: `npm run dev` or Railway redeploy

### Customer Not Receiving SMS
1. Check SMS consent: `GET /api/sms-consent/:customerId/:salonId`
2. Verify phone number is correct in User model
3. Check Do-Not-Disturb hours (22:00-08:00 blocked)
4. Review SMSLog for delivery failures

### Waitlist Not Matching
1. Check Waitlist has active entries
2. Verify preferredService matches cancelled booking
3. Review priority scores (should be 0-100)
4. Check SlotSuggestion expiry (2 hours)

---

## 🎓 Architecture Summary

**Master Cron Pattern:** All 4 workers run independently, no inter-dependencies.

**Flow 1: Booking Confirmation**
```
Booking Created → confirmationSenderWorker (48-72h before)
  → SMS sent with token → Customer clicks link
  → BookingConfirmation.markConfirmed() → Done
```

**Flow 2: Auto-Cancel + Waitlist**
```
Confirmation Deadline Passed → autoCancelWorker
  → Cancel Booking → Find Waitlist
  → waitlistMatcherWorker → Create SlotSuggestion
  → SMS sent with token → Customer accepts
  → Booking created → Waitlist fulfilled
```

**Flow 3: 24h Reminder**
```
Confirmed Booking (23-25h away) → reminderWorker
  → SMS sent → Customer reminded → Done
```

**GDPR Compliance:**
- Explicit opt-in required (POST /api/sms-consent/opt-in)
- STOP reply handling (handleStopReply)
- Opt-out anytime (POST /api/sms-consent/opt-out)
- Data deletion after 7 years (SMSConsent.processScheduledDeletions)

---

## ✅ Next Steps

1. **Get MessageBird API Keys** (Test + Live)
2. **Test Locally** (all 7 test cases)
3. **Deploy to Railway** (set env variables)
4. **Monitor First Week** (SMS costs, no-show rate)
5. **Iterate on Templates** (A/B test wording, emojis)
6. **Track ROI** (NoShowAnalytics dashboard)

---

## 📞 Support

**MessageBird Support:** support@messagebird.com  
**Documentation:** https://developers.messagebird.com/api/sms-messaging/

**JN Automation Team:**
- Backend: Julius Wagenfeldt
- System Architecture: GitHub Copilot + Claude Sonnet 4.5

**Last Updated:** 2025-12-15 16:45 CET
