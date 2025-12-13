# ⚡ QUICK TESTING GUIDE - 5 MINUTEN

## 🎯 PRIORITY TESTS (Must Complete)

### 1️⃣ Homepage Test (30 Sek)
- ✅ Öffne: http://localhost:3000
- Check: "Unternehmen" statt "Salons" sichtbar
- Check: CTA Buttons funktionieren
- Check: Navigation lädt

### 2️⃣ Login Flow (1 Min)
**Option A: Neuer Account**
```
http://localhost:3000/register
- Email: test@test.de
- Password: Test1234!
- Submit → Dashboard redirect
```

**Option B: Existing Account**
```
http://localhost:3000/login
- Deine Email/Password
- Submit → Dashboard
```

### 3️⃣ Dashboard Test (1 Min)
- ✅ Dashboard lädt ohne Errors
- Check: Widgets rendern (Stats, Charts)
- Check: Sidebar Navigation funktioniert
- Check: "Mein Dashboard" statt "Mein Salon Dashboard"

### 4️⃣ Subscription Check (1 Min)
```
Dashboard → Einstellungen → Abonnement
oder: http://localhost:3000/pricing
```
- Check: Free Trial Badge sichtbar
- Check: "Upgrade" Button da
- Check: Pläne laden

### 5️⃣ Stripe Test (1.5 Min)
```
Pricing → Professional Plan → "Jetzt starten"
```
- Stripe Checkout öffnet sich
- Test Card: **4242 4242 4242 4242**
- Expiry: 12/34 | CVC: 123
- Submit → Success Redirect

---

## 🔍 VISUAL CHECKS (While Testing)

In jeder Seite prüfen:
- ✅ Keine "Salon/Friseur" Wörter sichtbar
- ✅ "Unternehmen/Dienstleister/Anbieter" überall
- ✅ Services: "Beratung/Behandlung/Termin" (neutral)

---

## 🚨 CRITICAL ERRORS TO WATCH

❌ **Stop if you see:**
- Console Error: 500 / Network Failed
- Blank white page
- "Cannot connect to server"
- Stripe not loading

✅ **OK to ignore:**
- Console warnings (React DevTools)
- Cloudinary warnings
- ESLint warnings

---

## 📱 QUICK TEST SEQUENCE

```bash
1. Open http://localhost:3000
2. Click "Für Unternehmen" in Nav
3. Scroll → Check all text neutral
4. Click "Anmelden"
5. Login → Dashboard loads
6. Click "Upgrade" → Stripe loads
7. Use test card → Success page
```

**Total Time: 5 Minuten**

---

## ✅ SUCCESS CRITERIA

- [x] Backend: Port 5000 active
- [x] Frontend: Port 3000 active
- [ ] Homepage loads < 2s
- [ ] Login works
- [ ] Dashboard renders
- [ ] Stripe checkout loads
- [ ] No critical errors in console

**If all ✅ → Ready for Railway Deploy!** 🚀

---

## 🔗 QUICK LINKS

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5000
- **Backend API:** http://localhost:5000/api
- **Stripe Test Cards:** https://stripe.com/docs/testing

---

## 🐛 QUICK FIXES

**Frontend not loading?**
```powershell
cd frontend
npm run dev
```

**Backend error?**
```powershell
cd backend
npm start
```

**Database issue?**
- Check `.env` has `MONGO_URI`
- Check MongoDB Atlas allows IP

**Stripe not working?**
- Check `.env` has all STRIPE keys
- Use test card: 4242 4242 4242 4242

---

**Status:** Ready to test! ⚡
**Time:** ~5 minutes  
**Start Testing:** NOW 🎯
