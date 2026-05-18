# Waitlist Add Form Implementation

## Changes Made

### Backend (`backend/routes/waitlistRoutes.js`)
- Modified POST `/api/waitlist` endpoint to accept EITHER:
  - `customerId` (for registered users)
  - `customerName` + `customerPhone` (for walk-in customers)
- Added E.164 phone validation
- Added duplicate check by phone OR customerId
- Added support for `serviceId` field (in addition to legacy `preferredService`)

### Frontend (`frontend/src/pages/dashboard/Waitlist.jsx`)
- Added state for form: `addForm`, `services`, `submittingAdd`
- Added `fetchServices()` function to load available services
- Implemented full Add Form modal with fields:
  - Customer Name (required)
  - Phone (required, E.164 format)
  - Email (optional)
  - Service Selection (required, dropdown)
  - Preferred Date (optional)
  - Notes (optional)
- Added `handleAddSubmit()` function with validation and API call
- Form resets after successful submission

## Test Checklist
- [ ] Open Waitlist page
- [ ] Click "+ Kunde hinzufügen"
- [ ] Fill form with valid data
- [ ] Submit → Should add to waitlist
- [ ] Verify entry appears in table
- [ ] Test phone validation (must start with +)
