# 📋 MVP REMAINING WORK - Exact Action Plan

## 🎯 PHASE 2: FRONTEND (5-7 Days)

### 1. i18n Setup (Day 1)

**Install i18n:**
```bash
npm install i18next i18next-browser-languagedetector i18next-react-http-backend react-i18next
```

**Create structure:**
```
frontend/src/
├── locales/
│   ├── de/
│   │   ├── common.json
│   │   ├── booking.json
│   │   ├── emails.json
│   │   └── dashboard.json
│   └── en/
│       ├── common.json
│       ├── booking.json
│       ├── emails.json
│       └── dashboard.json
├── i18n.js (config)
```

**Priority translations:**
- [ ] Login/Register flows (DE/EN)
- [ ] Public booking page (DE/EN) ← CRITICAL
- [ ] Salon dashboard (DE/EN)
- [ ] Email templates (DE/EN) ← CRITICAL
- [ ] CEO dashboard (DE/EN)

### 2. Public Booking Page (Days 1-2)

**URL Structure:**
```
https://meinsalon.de/booking/salon-slug
```

**Components needed:**
```
PublicBooking/
├── index.jsx
├── ServiceSelection.jsx
├── DateTimePicker.jsx
├── CustomerForm.jsx
├── ConfirmationModal.jsx
├── SuccessPage.jsx
└── styles.css
```

**API Calls:**
```javascript
POST /api/bookings/public/check-availability
  Body: { salonId, serviceId, date }
  Response: { availableSlots: [] }

POST /api/bookings/public/create
  Body: { 
    salonId, 
    serviceId, 
    employeeId,
    dateTime, 
    customerName, 
    customerEmail, 
    customerPhone,
    notes
  }
  Response: { bookingId, confirmation }
```

**Critical UX:**
- Mobile-first responsive
- 1-click checkout (minimal fields)
- Instant confirmation message
- Email sent confirmation visible

### 3. Salon Owner Dashboard (Days 2-4)

**Main Pages:**
```
/salon/dashboard
├── DashboardHome (quick stats)
├── Calendar (appointments view)
├── BookingsList (list view)
├── Customers (customer database)
├── Services (manage services)
├── Hours (business hours)
├── EmailTemplates (customize emails)
├── Settings (Google review link, booking link)
└── Analytics (week stats, revenue, top services)
```

**Key Components:**

**Calendar View:**
```javascript
Features:
- Week/Day view of appointments
- Color-coded by status (pending, confirmed, completed)
- Click to see appointment details
- Quick actions: Confirm, Complete, Cancel
- Shows employee assigned
```

**Quick Stats Dashboard:**
```javascript
Display:
- This week bookings (count)
- This week revenue (sum)
- Top services (bar chart)
- Upcoming appointments (today)
- Review emails sent (count)
- Google review link (button to open)
```

**Email Template Editor:**
```javascript
Templates editable:
1. Booking Confirmation
   - Variables: {customerName}, {serviceType}, {appointmentTime}, {salonName}
   
2. Appointment Reminder (24h before)
   - Variables: {customerName}, {serviceType}, {appointmentTime}, {employeeName}
   
3. Review Request (2h after appointment) ← CRITICAL
   - Variables: {customerName}, {salonName}, {googleReviewLink}
   - MUST include: Direct Google review link

4. Weekly Summary
   - Variables: {weekBookings}, {weekRevenue}, {topService}
```

**Google Review Link Config:**
```javascript
Component: ReviewLinkSettings
- Input field for Google review link (salon-specific)
- Test button to preview review email
- Shows in review email template
```

**Booking Link & Embed:**
```javascript
Component: BookingLinkGenerator
- Display: https://meinsalon.de/booking/salon-slug
- Copy button for link
- Embed code generator for website
  Code: <iframe src="...booking/salon-slug" style="width:100%;height:600px;border:none;"></iframe>
```

### 4. CEO Dashboard (Day 5)

**Ultra-Simple:**
```
/ceo/dashboard
├── Total Active Salons (count)
├── Total Bookings This Month (count)
├── Platform Revenue (sum)
├── Recent Salons (list)
└── Salon Management Table
    ├── Salon Name
    ├── Status (Active/Suspended/Trial)
    ├── Bookings Count
    ├── Actions (Activate/Suspend)
```

---

## 🎯 PHASE 3: BACKEND AUTOMATION (2-3 Days)

### 1. Email Templates as Editable Content

**New Model: EmailTemplate** (optional, or store in BusinessSettings)

```javascript
// In BusinessSettings or new collection
emailTemplates: {
  bookingConfirmation: {
    subject: "Buchungsbestätigung - {salonName}",
    body: "..."
  },
  appointmentReminder: {
    subject: "Erinnerung: Termin morgen bei {salonName}",
    body: "..."
  },
  reviewRequest: {
    subject: "Wie war dein Termin bei {salonName}?",
    body: "Bewerte uns auf Google: {googleReviewLink}"
  }
}
```

### 2. Automated Cronjobs

**File: services/cronService.js** (already exists, needs updates)

```javascript
import cron from 'node-cron';
import { sendBookingConfirmation } from './emailService.js';
import { sendAppointmentReminder } from './emailService.js';
import { sendReviewRequest } from './emailService.js';

export async function initializeCronJobs() {
  
  // 1. BOOKING CONFIRMATION (immediate, handled in controller)
  // → Already in bookingController.createPublicBooking
  
  // 2. APPOINTMENT REMINDER (24h before)
  cron.schedule('0 10 * * *', async () => {
    console.log('⏰ Running appointment reminders...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);
    
    const appointments = await Appointment.find({
      appointmentDateTime: {
        $gte: tomorrow,
        $lte: endOfTomorrow
      },
      status: { $in: ['pending', 'confirmed'] },
      reminderSent: false
    }).populate('booking customer service');
    
    for (const appointment of appointments) {
      try {
        await sendAppointmentReminder(appointment);
        appointment.reminderSent = true;
        await appointment.save();
      } catch (error) {
        console.error('Reminder failed:', error);
      }
    }
  });
  
  // 3. REVIEW REQUEST (2h after appointment ends) ← CRITICAL
  cron.schedule('*/5 * * * *', async () => { // Every 5 minutes
    console.log('⭐ Checking for appointments that ended 2h ago...');
    
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    const completedAppointments = await Appointment.find({
      appointmentDateTime: { $lte: twoHoursAgo },
      status: 'completed',
      reviewEmailSent: false
    }).populate('booking customer service business');
    
    for (const appointment of completedAppointments) {
      try {
        const googleReviewLink = appointment.business?.googleReviewLink;
        if (googleReviewLink) {
          await sendReviewRequest(appointment, googleReviewLink);
          appointment.reviewEmailSent = true;
          await appointment.save();
        }
      } catch (error) {
        console.error('Review email failed:', error);
      }
    }
  });
  
  // 4. WEEKLY SUMMARY (every Monday at 09:00)
  cron.schedule('0 9 * * 1', async () => {
    console.log('📊 Sending weekly summaries...');
    // Implementation for weekly emails
  });
  
  console.log('✅ Cron jobs initialized');
}
```

### 3. Email Service Updates

**File: services/emailService.js** (update/extend)

```javascript
// BOOKING CONFIRMATION (called immediately after booking)
export async function sendBookingConfirmation(booking, salon) {
  const emailTemplate = salon.businessSettings?.emailTemplates?.bookingConfirmation 
    || DEFAULT_BOOKING_CONFIRMATION;
  
  const subject = emailTemplate.subject
    .replace('{salonName}', salon.name);
  
  const body = emailTemplate.body
    .replace('{customerName}', booking.customerName)
    .replace('{serviceType}', booking.service.name)
    .replace('{appointmentTime}', formatDateTime(booking.appointmentDateTime))
    .replace('{salonName}', salon.name);
  
  await nodemailer.transporter.sendMail({
    to: booking.customerEmail,
    subject,
    html: body
  });
}

// APPOINTMENT REMINDER (24h before)
export async function sendAppointmentReminder(appointment) {
  const emailTemplate = appointment.business?.businessSettings?.emailTemplates?.appointmentReminder
    || DEFAULT_REMINDER;
  
  const subject = emailTemplate.subject
    .replace('{salonName}', appointment.business.name);
  
  const body = emailTemplate.body
    .replace('{customerName}', appointment.booking.customerName)
    .replace('{serviceType}', appointment.service.name)
    .replace('{appointmentTime}', formatDateTime(appointment.appointmentDateTime))
    .replace('{employeeName}', appointment.employee?.name || '')
    .replace('{salonName}', appointment.business.name);
  
  await nodemailer.transporter.sendMail({
    to: appointment.booking.customerEmail,
    subject,
    html: body
  });
}

// REVIEW REQUEST (2h after appointment)
export async function sendReviewRequest(appointment, googleReviewLink) {
  const emailTemplate = appointment.business?.businessSettings?.emailTemplates?.reviewRequest
    || DEFAULT_REVIEW_REQUEST;
  
  const subject = emailTemplate.subject
    .replace('{salonName}', appointment.business.name);
  
  const body = emailTemplate.body
    .replace('{customerName}', appointment.booking.customerName)
    .replace('{salonName}', appointment.business.name)
    .replace('{googleReviewLink}', googleReviewLink)
    .replace('{serviceType}', appointment.service.name);
  
  await nodemailer.transporter.sendMail({
    to: appointment.booking.customerEmail,
    subject,
    html: body,
    clickTracking: true // Track if review link clicked
  });
}
```

### 4. BookingController Updates

**File: controllers/bookingController.js** (createPublicBooking)

```javascript
export async function createPublicBooking(req, res) {
  try {
    const { salonId, serviceId, employeeId, dateTime, customerName, customerEmail, customerPhone } = req.body;
    
    // Validate input
    
    // Create customer (if new)
    let customer = await Customer.findOne({ email: customerEmail, salon: salonId });
    if (!customer) {
      customer = new Customer({
        email: customerEmail,
        name: customerName,
        phone: customerPhone,
        salon: salonId
      });
      await customer.save();
    }
    
    // Create booking
    const booking = new Booking({
      salon: salonId,
      customer: customer._id,
      service: serviceId,
      employee: employeeId,
      customerName,
      customerEmail,
      customerPhone,
      status: 'pending'
    });
    await booking.save();
    
    // Create appointment
    const appointment = new Appointment({
      booking: booking._id,
      salon: salonId,
      service: serviceId,
      employee: employeeId,
      customer: customer._id,
      appointmentDateTime: new Date(dateTime),
      status: 'pending'
    });
    await appointment.save();
    
    // SEND CONFIRMATION EMAIL IMMEDIATELY
    const salon = await Salon.findById(salonId).populate('businessSettings');
    await sendBookingConfirmation(booking, salon);
    
    res.status(201).json({
      success: true,
      message: 'Booking confirmed! Check your email.',
      bookingId: booking._id
    });
  } catch (error) {
    handleError(error, res);
  }
}
```

---

## 🎯 PHASE 4: INTEGRATION & TESTING (2 Days)

### 1. End-to-End Testing

**Test Scenarios:**
- [ ] Customer books without login → Email sent
- [ ] Salon receives booking notification
- [ ] 24h before: Reminder email sent
- [ ] 2h after: Review request email with Google link sent
- [ ] Salon can customize email templates
- [ ] Salon can update Google review link
- [ ] CEO can see all salons and bookings

### 2. Mobile Responsiveness

- [ ] Public booking page works on mobile
- [ ] Salon dashboard responsive
- [ ] Calendar/lists optimized for mobile

### 3. Performance

- [ ] Page load < 2 seconds
- [ ] Email delivery < 1 second
- [ ] Database queries optimized

---

## 📊 ESTIMATED TIMELINE

| Phase | Task | Days | Status |
|-------|------|------|--------|
| 1 | Code Cleanup | 1 | ✅ DONE |
| 2 | i18n Setup | 1 | ⏳ TODO |
| 2 | Public Booking Page | 1.5 | ⏳ TODO |
| 2 | Salon Dashboard | 2 | ⏳ TODO |
| 2 | CEO Dashboard | 0.5 | ⏳ TODO |
| 3 | Email Automation | 2 | ⏳ TODO |
| 4 | Testing & Polish | 2 | ⏳ TODO |
| **TOTAL** | | **10 days** | |

---

## ✅ MVP LAUNCH CHECKLIST

**Core User Journey:**
- [ ] Customer visits salon's custom URL
- [ ] Selects service, date, time
- [ ] Enters name, email, phone
- [ ] Books appointment
- [ ] Gets confirmation email
- [ ] 24h before: Gets reminder email
- [ ] 2h after appointment: Gets review request email with Google link

**Salon Owner Journey:**
- [ ] Creates account / subscribes
- [ ] Configures business hours
- [ ] Adds services & employees
- [ ] Sets Google review link
- [ ] Gets unique booking URL
- [ ] Embeds booking form on website
- [ ] Views calendar of bookings
- [ ] Customizes email templates
- [ ] Sees analytics (bookings, revenue, top services)

**CEO Journey:**
- [ ] Dashboard shows all salons
- [ ] Can activate/suspend salons
- [ ] Sees total platform bookings & revenue
- [ ] Manages subscriptions

---

## 🚀 "READY TO SELL" = When Above is 100% Complete

After this, you can:
✅ Launch with 2-3 beta salons
✅ Get real feedback on value
✅ Refine based on usage
✅ Add premium features later

