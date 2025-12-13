# Stripe Setup Guide - JN Automation

Complete guide for setting up Stripe payment integration for subscription management.

---

## 📋 Prerequisites

- Stripe Account ([Register here](https://dashboard.stripe.com/register))
- Access to Stripe Dashboard
- Backend environment variables configured

---

## 🎯 Step 1: Create Products in Stripe Dashboard

### 1.1 Navigate to Products

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **Products** in the left sidebar
3. Click **+ Add product**

### 1.2 Create Starter Plan

**Product Information:**
- **Name:** `JN Automation - Starter`
- **Description:** `Starter plan for small salons with basic booking features`
- **Statement descriptor:** `JN Auto Starter`

**Pricing:**
- **Type:** Recurring
- **Billing period:** Monthly
- Click **Add another price**
- **Billing period:** Yearly (set custom price with 17% discount)

**Prices:**
- Monthly: `€29.00` per month
- Yearly: `€289.00` per year (17% discount: €29 × 12 × 0.83 = €289)

**Metadata (Important):**
```
tier: starter
billingCycle: monthly (or yearly for yearly price)
salonType: hair_salon
features: booking,sms,calendar
```

### 1.3 Create Professional Plan

**Product Information:**
- **Name:** `JN Automation - Professional`
- **Description:** `Professional plan with advanced features for growing salons`
- **Statement descriptor:** `JN Auto Pro`

**Prices:**
- Monthly: `€79.00` per month
- Yearly: `€789.00` per year (17% discount)

**Metadata:**
```
tier: professional
billingCycle: monthly (or yearly)
salonType: multi_industry
features: booking,sms,calendar,analytics,team,api
```

### 1.4 Create Enterprise Plan

**Product Information:**
- **Name:** `JN Automation - Enterprise`
- **Description:** `Enterprise plan with SEPA, invoices, and priority support`
- **Statement descriptor:** `JN Auto Ent`

**Prices:**
- Monthly: `€199.00` per month
- Yearly: `€1,989.00` per year (17% discount)

**Metadata:**
```
tier: enterprise
billingCycle: monthly (or yearly)
salonType: multi_industry
features: all
paymentMethods: card,sepa,invoice
trial: 14_days
```

---

## 🔑 Step 2: Copy Price IDs

After creating products, copy the **Price IDs** from Stripe Dashboard:

1. Go to **Products** → Click on each product
2. In the **Pricing** section, click **︙** (three dots) → **Copy price ID**
3. Price IDs look like: `price_1AbCdEfGhIjKlMnO`

**Price IDs to Copy:**
```
STRIPE_PRICE_STARTER_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_STARTER_YEARLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE_YEARLY=price_xxxxxxxxxxxxx
```

---

## 🔔 Step 3: Configure Webhooks

### 3.1 Create Webhook Endpoint

1. Go to **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL:**
   - **Development:** `https://your-dev-domain.com/api/subscriptions/webhook`
   - **Production:** `https://your-production-domain.com/api/subscriptions/webhook`
3. **Description:** `JN Automation Subscription Events`
4. **API version:** Latest (2023-10-16 or newer)

### 3.2 Select Events to Listen For

**Subscription Events:**
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `customer.subscription.trial_will_end`

**Invoice Events:**
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`
- ✅ `invoice.payment_action_required`

**Payment Method Events:**
- ✅ `payment_method.attached`
- ✅ `payment_method.detached`

### 3.3 Copy Webhook Signing Secret

After creating the webhook:
1. Click on the webhook endpoint
2. Click **Reveal** under **Signing secret**
3. Copy the secret: `whsec_xxxxxxxxxxxxx`
4. Add to environment variables as `STRIPE_WEBHOOK_SECRET`

---

## 🔐 Step 4: Configure Environment Variables

Add these variables to your `.env` file:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx  # Test key (starts with sk_test_)
# STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx  # Live key (starts with sk_live_)

# Stripe Webhook
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Price IDs - Starter
STRIPE_PRICE_STARTER_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_STARTER_YEARLY=price_xxxxxxxxxxxxx

# Price IDs - Professional
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_xxxxxxxxxxxxx

# Price IDs - Enterprise
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE_YEARLY=price_xxxxxxxxxxxxx
```

### 4.1 Get API Keys

1. Go to **Developers** → **API keys**
2. **Test mode:** Use `sk_test_...` for development
3. **Live mode:** Use `sk_live_...` for production
4. **⚠️ Never commit API keys to Git!**

---

## 🧪 Step 5: Test Integration

### 5.1 Install Stripe CLI (Optional but Recommended)

```bash
# Windows (using Scoop)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Mac (using Homebrew)
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login
```

### 5.2 Test Webhooks Locally

```bash
# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/subscriptions/webhook

# In another terminal, trigger test events
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_succeeded
```

### 5.3 Test Card Numbers

Use Stripe test cards for development:

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Payment Requires Authentication (3D Secure):**
- Card: `4000 0025 0000 3155`

**Payment Fails:**
- Card: `4000 0000 0000 9995`

**SEPA Testing:**
- IBAN: `DE89370400440532013000`
- Account holder: Any name

---

## 🚀 Step 6: Enable SEPA Direct Debit (Enterprise Only)

### 6.1 Enable Payment Method

1. Go to **Settings** → **Payment methods**
2. Find **SEPA Direct Debit**
3. Click **Turn on**
4. Complete setup wizard

**Requirements:**
- European bank account
- Business verification (for live mode)
- SEPA mandate agreement

### 6.2 Configure SEPA Settings

**Settlement:**
- **Default:** 5 business days
- **Fees:** 0.8% per transaction

**Mandate:**
- **Type:** Recurring
- **Statement descriptor:** `JN Automation`
- **Customer notification:** Email

---

## 📄 Step 7: Configure Invoicing (Enterprise Only)

### 7.1 Enable Invoice Payments

1. Go to **Settings** → **Billing**
2. **Invoice settings:**
   - ✅ Allow customers to pay invoices online
   - ✅ Send invoice reminder emails
   - ✅ Automatically finalize invoices

### 7.2 Payment Terms

**Default terms:** Net 14 (payment due in 14 days)

**Late fees:**
- Percentage: 2% after 14 days
- Fixed fee: €10 after 30 days

### 7.3 Invoice Template

Customize invoice template:
1. Go to **Settings** → **Branding**
2. Upload **Company logo**
3. Set **Brand color:** `#4f46e5` (JN Automation brand)
4. Add **Support email:** support@jn-automation.com

---

## 🔒 Step 8: Security Best Practices

### 8.1 API Key Security

✅ **DO:**
- Store keys in environment variables
- Use `.env` file (add to `.gitignore`)
- Rotate keys every 90 days
- Use separate keys for dev/staging/prod

❌ **DON'T:**
- Commit keys to Git
- Share keys via email/Slack
- Use live keys in development
- Log API keys in console

### 8.2 Webhook Security

**Always verify webhook signatures:**
```javascript
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  req.body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### 8.3 PCI Compliance

- ✅ Use Stripe Elements for card input (never collect raw card data)
- ✅ Use Stripe Checkout for hosted payment pages
- ✅ Never log full card numbers or CVV
- ✅ Use HTTPS for all payment-related requests

---

## 📊 Step 9: Monitor and Alerts

### 9.1 Enable Email Alerts

1. Go to **Settings** → **Emails**
2. Enable alerts for:
   - ✅ Failed payments
   - ✅ Disputed payments
   - ✅ Successful refunds
   - ✅ Payout failures

### 9.2 Dashboard Monitoring

**Check daily:**
- Revenue graphs (MRR/ARR)
- Failed payment rate
- Churn rate
- Active subscriptions

### 9.3 Set Up Radar (Fraud Prevention)

1. Go to **Radar** → **Rules**
2. Enable recommended rules:
   - ✅ Block if CVC check fails
   - ✅ Block if AVS check fails
   - ✅ Block high-risk cards
   - ✅ Block if velocity is abnormal

---

## 🧩 Step 10: Integration Checklist

**Backend:**
- ✅ Stripe package installed (`npm install stripe`)
- ✅ Environment variables configured
- ✅ Webhook endpoint created
- ✅ Webhook signature verification enabled
- ✅ Error handling implemented
- ✅ Logging configured

**Frontend:**
- ⏳ Stripe.js loaded (`@stripe/stripe-js`)
- ⏳ Payment Elements integrated
- ⏳ Upgrade/downgrade UI created
- ⏳ Feature comparison shown
- ⏳ Trial conversion flow

**Testing:**
- ⏳ Create subscription (monthly/yearly)
- ⏳ Upgrade subscription
- ⏳ Downgrade subscription
- ⏳ Cancel subscription
- ⏳ Start trial
- ⏳ Convert trial to paid
- ⏳ Test SEPA setup
- ⏳ Create invoice
- ⏳ Webhook events (use Stripe CLI)

---

## 🆘 Troubleshooting

### Issue: Webhook not receiving events

**Solution:**
1. Check endpoint URL is correct
2. Verify webhook is active in dashboard
3. Check signing secret matches `.env`
4. Test with Stripe CLI: `stripe trigger <event>`

### Issue: Price ID not found

**Solution:**
1. Verify price ID is correct in Stripe Dashboard
2. Check environment variable is set
3. Ensure price is active (not archived)
4. Test with correct API key (test/live)

### Issue: SEPA setup fails

**Solution:**
1. Verify SEPA is enabled in Settings → Payment methods
2. Check IBAN is valid (use test IBAN for development)
3. Ensure customer is in SEPA-supported country
4. Check Stripe account is verified

### Issue: Invoice payment fails

**Solution:**
1. Verify invoicing is enabled in Settings → Billing
2. Check payment terms are configured
3. Ensure customer has valid payment method
4. Check invoice is finalized (not draft)

---

## 📚 Resources

**Stripe Documentation:**
- [Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)
- [SEPA Direct Debit](https://stripe.com/docs/payments/sepa-debit)
- [Invoicing](https://stripe.com/docs/invoicing)
- [Webhooks](https://stripe.com/docs/webhooks)

**Testing:**
- [Test Cards](https://stripe.com/docs/testing#cards)
- [Test IBANs](https://stripe.com/docs/testing#sepa-direct-debit)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)

**API Reference:**
- [Subscription API](https://stripe.com/docs/api/subscriptions)
- [Customer API](https://stripe.com/docs/api/customers)
- [Invoice API](https://stripe.com/docs/api/invoices)

---

## ✅ Next Steps

After completing Stripe setup:

1. **Test payment flows** (create, upgrade, downgrade, cancel)
2. **Implement frontend UI** for subscription management
3. **Create downgrade warning modal** showing lost features
4. **Test webhook events** using Stripe CLI
5. **Deploy to production** with live API keys
6. **Monitor first transactions** for any issues

---

**Last Updated:** December 13, 2025  
**Version:** 1.0.0  
**Author:** JN Automation Team
