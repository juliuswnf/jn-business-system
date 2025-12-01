# MVP Cleanup Documentation

## Phase 3: Feature Cleanup Strategy

This document tracks the cleanup of non-MVP features to create a focused, launchable product.

## MVP Core Features (KEEP)

### 1. Public Booking System
- Slug-based salon pages (`/s/:slug`)
- Service selection
- Available time slots
- Book appointments without login
- Confirmation emails

### 2. Email Automation
- Confirmation emails (instant)
- Reminder emails (24h before)
- Review request emails (2h after)
- Email queue worker

### 3. Stripe Subscriptions
- 14-day free trial
- Subscription management
- Webhook handling
- Auto-status updates

### 4. CEO Dashboard
- View all salons
- Subscription status
- Activate/deactivate salons
- Basic statistics

### 5. Authentication
- JWT-based auth
- Role-based access (CEO/Salon Owner/Customer)
- Password reset

---

## Files to REMOVE (Non-MVP)

### Controllers (Delete)
- ❌ `adminController.js` - Not needed for MVP
- ❌ `appointmentController.js` - Duplicate of booking
- ❌ `customerController.js` - Over-engineered
- ❌ `dashboardController.js` - Too complex
- ❌ `emailController.js` - Have email service
- ❌ `employeeController.js` - Not MVP
- ❌ `errorController.js` - Over-engineering
- ❌ `reviewController.js` - Use Google Reviews
- ❌ `serviceController.js` - Too complex
- ❌ `settingsController.js` - Over-engineered

### Routes (Delete)
- ❌ `adminRoutes.js`
- ❌ `appointmentRoutes.js`
- ❌ `customerRoutes.js`
- ❌ `dashboardRoutes.js`
- ❌ `emailRoutes.js`
- ❌ `employeeRoutes.js`
- ❌ `errorRoutes.js`
- ❌ `reviewRoutes.js`
- ❌ `serviceRoutes.js`
- ❌ `settingsRoutes.js`

### Models (Simplify/Delete)
- ❌ `Appointment.js` - Use Booking instead
- ❌ `Employee.js` - Not MVP
- ❌ `Review.js` - Use Google Reviews
- ❌ `Invoice.js` - Not MVP
- ❌ `Receipt.js` - Not MVP
- ❌ `Settings.js` - Over-complex
- ❌ `SystemError.js` - Use error logs
- ❌ `SystemLog.js` - Use console
- ❌ `AuditLog.js` - Not MVP
- ❌ `BackupJob.js` - Not MVP
- ❌ `Transaction.js` - Duplicate of Payment
- ❌ `Webhook.js` - Not needed

---

## Files to KEEP & SIMPLIFY

### Core Models (Keep)
- ✅ `User.js`
- ✅ `Salon.js`
- ✅ `Booking.js`
- ✅ `Service.js`
- ✅ `Customer.js`
- ✅ `Payment.js`
- ✅ `EmailQueue.js`
- ✅ `EmailLog.js`
- ✅ `ErrorLog.js`

### Core Controllers (Keep)
- ✅ `authController.js`
- ✅ `publicBookingController.js`
- ✅ `ceoSubscriptionController.js`
- ✅ `ceoController.js` (simplified)
- ✅ `stripeWebhookController.js`
- ✅ `bookingController.js` (simplified)
- ✅ `paymentController.js` (simplified)

### Core Routes (Keep)
- ✅ `authRoutes.js`
- ✅ `publicBookingRoutes.js`
- ✅ `ceoRoutes.js`
- ✅ `bookingRoutes.js` (simplified)
- ✅ `paymentRoutes.js` (simplified)
- ✅ `salonRoutes.js` (create new, simple)

---

## Simplification Strategy

### 1. Booking Controller
**Remove:**
- Bulk operations
- Complex filtering
- Export/Import
- Advanced analytics
- VIP tracking
- Reconciliation

**Keep:**
- Create booking
- Get bookings (with pagination)
- Cancel booking
- Update booking status

### 2. Payment Controller
**Remove:**
- Invoice generation
- Receipt management
- Coupons
- Settlement processing
- Tax reports
- Reconciliation
- Test payment data

**Keep:**
- Create payment intent
- Process payment
- Refund payment
- Get payment history
- Revenue analytics (basic)

### 3. CEO Controller
**Remove:**
- Advanced system metrics
- Complex reporting
- Email template management
- System settings

**Keep:**
- Dashboard overview
- List salons
- Subscription management (via ceoSubscriptionController)

---

## Implementation Order

1. ✅ Delete non-MVP controller files
2. ✅ Delete non-MVP route files
3. ✅ Delete non-MVP model files
4. ✅ Simplify booking controller
5. ✅ Simplify payment controller
6. ✅ Simplify CEO controller
7. ✅ Create simple salon controller
8. ✅ Update server.js imports
9. ✅ Test all MVP endpoints
10. ✅ Document final MVP API

---

## Expected Results

- **50-70% reduction** in codebase size
- **Faster development** - less code to maintain
- **Clear focus** on core features
- **Easier testing** - fewer edge cases
- **Faster deployment** - simpler architecture

---

## Post-Cleanup Checklist

- [ ] All non-MVP files deleted
- [ ] Server starts without errors
- [ ] Public booking works
- [ ] Email queue processes
- [ ] Stripe webhooks work
- [ ] CEO dashboard loads
- [ ] Authentication works
- [ ] All MVP API endpoints tested
