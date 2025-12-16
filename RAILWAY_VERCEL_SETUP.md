# 🔧 RAILWAY & VERCEL SETUP GUIDE

## 🚂 RAILWAY BACKEND SETUP

### Step 1: Get Railway Domain
1. Go to: https://railway.app/
2. Login → Your Projects
3. Find: **jn-business-system-backend**
4. Click on service → **Settings** tab
5. Scroll to **Domains** section
6. Copy the domain (format: `*.up.railway.app`)

**Example:** `jn-business-system-production.up.railway.app`

---

### Step 2: Set Environment Variables
1. In Railway Dashboard → **Variables** tab
2. Click **+ New Variable**
3. Add the following (one by one):

```bash
# REQUIRED CHANGES:
NODE_ENV=production
FRONTEND_URL=https://jn-automation.vercel.app
CORS_ORIGIN=https://jn-automation.vercel.app

# OPTIONAL BUT RECOMMENDED:
REDIS_URL=redis://default:password@containers-us-west-123.railway.app:6379
SENTRY_DSN=https://your-sentry-key@o123456.ingest.us.sentry.io/7654321
```

**⚠️ Important:**
- Keep existing variables (MONGODB_URI, JWT_SECRET, STRIPE_*, TWILIO_*)
- Only ADD or UPDATE the above variables
- Click **Save** after each variable

---

### Step 3: Get Redis (Optional but Recommended)
**Why?** Rate limiting protection (prevents API abuse)

1. In Railway Dashboard → **+ New** button
2. Search: **Redis**
3. Click **Deploy Redis**
4. Wait 30 seconds for deployment
5. Click on Redis service → **Variables** tab
6. Copy **REDIS_URL** value
7. Go back to backend service → **Variables** tab
8. Add variable: `REDIS_URL=[paste value]`

**Cost:** Free on Railway (included in trial)

---

### Step 4: Get Sentry DSN (Optional)
**Why?** Error tracking and monitoring

1. Go to: https://sentry.io/signup/
2. Create free account (100k events/month free)
3. Create new project: **Node.js/Express**
4. Name: **jn-business-system-backend**
5. Copy **DSN** (format: `https://abc123@o456.ingest.us.sentry.io/789`)
6. In Railway → Backend Variables
7. Add: `SENTRY_DSN=[paste DSN]`

---

### Step 5: Verify Deployment
After setting variables, Railway auto-redeploys.

**Check:**
```bash
# Replace [domain] with your Railway domain
curl https://[domain].up.railway.app/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": {"status": "healthy"},
    "stripe": {"status": "healthy"},
    "emailQueue": {"status": "healthy"}
  }
}
```

---

## ☁️ VERCEL FRONTEND SETUP

### Step 1: Get Vercel Domain
1. Go to: https://vercel.com/
2. Login → Your Projects
3. Find: **jn-automation**
4. Click on project
5. Check **Production Deployment** domain
6. Should be: `jn-automation.vercel.app`

---

### Step 2: Set Environment Variables
1. In Vercel Dashboard → Project → **Settings** tab
2. Sidebar → **Environment Variables**
3. Add the following:

**VITE_API_URL** (REQUIRED)
- Key: `VITE_API_URL`
- Value: `https://[your-railway-domain].up.railway.app/api`
- Environment: **Production** (check only Production)
- Click **Save**

**Example:** `https://jn-business-system-production.up.railway.app/api`

**VITE_SENTRY_DSN** (Optional)
- Key: `VITE_SENTRY_DSN`
- Value: `https://your-sentry-key@o123.ingest.us.sentry.io/456`
- Environment: **Production**
- Click **Save**

---

### Step 3: Create Sentry Frontend Project (Optional)
1. Go to: https://sentry.io/
2. Create new project: **React**
3. Name: **jn-business-system-frontend**
4. Copy **DSN**
5. Add to Vercel as `VITE_SENTRY_DSN`

---

### Step 4: Trigger Redeploy
After adding variables:

1. Go to **Deployments** tab
2. Find latest deployment
3. Click **⋯** (three dots) → **Redeploy**
4. Check **Use existing Build Cache** → **Redeploy**
5. Wait 2-3 minutes

---

### Step 5: Verify Frontend
**Check:**
```bash
curl https://jn-automation.vercel.app
```

**Expected:** HTML response with `<title>JN Business System</title>`

**Open in Browser:**
- Homepage loads without errors
- Open DevTools Console (F12)
- **Zero errors** (0 red messages)

---

## 🧪 QUICK TEST COMMANDS

### Backend Health Check
```bash
# Basic
curl https://[railway-domain].up.railway.app/health

# Detailed
curl https://[railway-domain].up.railway.app/health/detailed

# Check version
curl https://[railway-domain].up.railway.app/api/system/version
```

### Frontend API Connection
```bash
# Open browser console on homepage:
fetch('https://[railway-domain].up.railway.app/api/system/version')
  .then(r => r.json())
  .then(d => console.log('Backend Version:', d))
```

**Expected:** Backend version logged (no CORS error)

---

## ⚠️ COMMON ISSUES & FIXES

### Issue 1: CORS Error
**Error:** `Access to fetch at 'https://railway.app' from origin 'https://vercel.app' has been blocked by CORS`

**Fix:**
1. Railway → Backend → Variables
2. Update: `CORS_ORIGIN=https://jn-automation.vercel.app`
3. Wait for redeploy (1-2 minutes)

---

### Issue 2: API 404 Errors
**Error:** Frontend shows "Failed to fetch" or 404 errors

**Fix:**
1. Vercel → Settings → Environment Variables
2. Check `VITE_API_URL` ends with `/api`
3. Correct format: `https://[domain].up.railway.app/api`
4. Redeploy frontend

---

### Issue 3: Railway Build Failed
**Error:** Red status in Railway dashboard

**Fix:**
1. Check Railway logs: Click on service → **Logs** tab
2. Look for error message
3. Common issue: Missing environment variable
4. Add missing variable in **Variables** tab

---

### Issue 4: Database Connection Failed
**Error:** Health check shows `"database": "ERROR"`

**Fix:**
1. Railway → Backend → Variables
2. Check `MONGODB_URI` is set correctly
3. MongoDB Atlas: Check IP whitelist (allow `0.0.0.0/0` for Railway)
4. MongoDB Atlas → Database Access → Check user permissions

---

## 📊 MONITORING SETUP

### Railway Logs (Real-time)
```bash
# Install Railway CLI (optional)
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Stream logs
railway logs
```

**Or via Dashboard:**
- Railway → Service → **Logs** tab
- Filter: Error/Warning
- Search: "error", "failed", "exception"

---

### Sentry Dashboard
**What to Monitor:**
1. **Issues** → Filter by: Unresolved
2. **Performance** → Check: Response time (should be <500ms)
3. **Releases** → Track: Deploy versions

**Alerts (Recommended):**
- Error rate > 10/minute
- Response time > 2000ms
- Memory usage > 90%

---

## 🎯 SUCCESS CRITERIA

### Backend
- ✅ Health check returns 200
- ✅ Database connected (readyState = 1)
- ✅ Stripe API works (test payment)
- ✅ Email queue active (confirmation sent)
- ✅ No errors in Railway logs (first 10 minutes)

### Frontend
- ✅ Homepage loads in <2 seconds
- ✅ Zero console errors
- ✅ API calls work (no CORS)
- ✅ Login/Register functional
- ✅ Lighthouse score: 95+ Performance

---

## 🚀 FINAL DEPLOYMENT COMMAND

After all variables are set:

```bash
# From your local machine:
cd "C:\Users\juliu\Documents\JN Automation\jn-automation"

# Make sure you're on main branch
git branch

# Check git status (should be clean)
git status

# If you made any changes, commit them:
git add .
git commit -m "chore: final production config"
git push origin main
```

**This triggers:**
- Railway: Auto-redeploy backend (2-3 minutes)
- Vercel: Auto-redeploy frontend (1-2 minutes)

**Then run checklist:** See `PRODUCTION_CHECKLIST.md`

---

**Need help?** julius.wagenfeldt@gmail.com
