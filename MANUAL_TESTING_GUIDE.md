# Manual Testing Guide

## 🧪 Schritt-für-Schritt Anleitung für manuelle Tests

### Voraussetzungen

1. **Backend starten:**
   ```bash
   cd backend
   npm start
   ```
   Backend sollte auf `http://localhost:5000` laufen

2. **Frontend starten:**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend sollte auf `http://localhost:5173` laufen

3. **Browser Developer Tools öffnen:**
   - Chrome/Edge: `F12` oder `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Firefox: `F12` oder `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Safari: `Cmd+Option+I` (Mac)

---

## Test 1: Login Flow

### 1.1 Standard Login (Business Owner)

1. **Öffne Browser Developer Tools**
   - Gehe zu **Application** Tab (Chrome) oder **Storage** Tab (Firefox)
   - Gehe zu **Cookies** → `http://localhost:5000`

2. **Navigiere zur Login-Seite**
   - Öffne `http://localhost:5173/login` oder `/business-login`
   - Fülle Login-Formular aus:
     - Email: `test@example.com` (oder dein Test-User)
     - Password: `password123` (oder dein Test-Password)

3. **Führe Login durch**
   - Klicke auf "Login"
   - Beobachte Network Tab für API-Request

4. **Prüfe Response:**
   - ✅ **Status Code:** `200 OK`
   - ✅ **Response Body:** Enthält `token` (Access Token)
   - ✅ **Response Body:** Enthält `refreshToken` (für mobile Apps)
   - ✅ **Response Body:** Enthält `user` Objekt

5. **Prüfe Cookies:**
   - Gehe zu **Application** → **Cookies** → `http://localhost:5000`
   - ✅ **refreshToken Cookie vorhanden**
   - ✅ **HttpOnly:** `true` (nicht über JavaScript zugänglich)
   - ✅ **SameSite:** `Strict`
   - ✅ **Secure:** `false` (Development) oder `true` (Production)
   - ✅ **Path:** `/api/auth`
   - ✅ **Max-Age:** `604800` (7 Tage)

6. **Prüfe localStorage:**
   - Gehe zu **Application** → **Local Storage** → `http://localhost:5173`
   - ✅ **token:** Vorhanden (temporär, wird entfernt)
   - ✅ **refreshToken:** NICHT vorhanden (sollte in Cookie sein)
   - ✅ **user:** Vorhanden (für Display-Zwecke)

7. **Prüfe Redirect:**
   - ✅ Nach erfolgreichem Login: Redirect zu Dashboard
   - ✅ Dashboard lädt korrekt

### 1.2 CEO Login

1. **Navigiere zu CEO Login**
   - Öffne `http://localhost:5173/ceo-login`
   - Fülle Login-Formular aus

2. **2FA Flow (falls aktiviert)**
   - ✅ 2FA-Code wird angefordert
   - ✅ Nach korrektem Code: Login erfolgreich

3. **Prüfe Cookie:**
   - ✅ `refreshToken` Cookie wird gesetzt
   - ✅ Cookie-Flags sind korrekt

4. **Prüfe Session:**
   - ✅ CEO hat längere Session (1 Tag statt 15 Minuten)

### 1.3 Employee Login

1. **Navigiere zu Employee Login**
   - Öffne `http://localhost:5173/employee-login`
   - Fülle Login-Formular aus (inkl. Company ID)

2. **Prüfe Cookie:**
   - ✅ `refreshToken` Cookie wird gesetzt
   - ✅ Cookie-Flags sind korrekt

---

## Test 2: Token Refresh Flow

### 2.1 Automatischer Token Refresh

1. **Login durchführen** (siehe Test 1)

2. **Warte 15 Minuten** (oder setze Token manuell abgelaufen)
   - Alternativ: Setze Access Token in localStorage auf abgelaufenen Wert

3. **Führe API-Request aus**
   - Öffne Dashboard oder führe eine Aktion aus, die API-Request triggert
   - Beobachte Network Tab

4. **Prüfe Token Refresh:**
   - ✅ Bei 401-Error: Automatischer Refresh-Versuch
   - ✅ Refresh-Request an `/api/auth/refresh-token`
   - ✅ Refresh-Request sendet Cookie (mitCredentials: true)
   - ✅ Neuer Access Token wird erhalten
   - ✅ Original Request wird wiederholt
   - ✅ Request erfolgreich (kein 401 mehr)

5. **Prüfe Token Rotation:**
   - ✅ Neuer `refreshToken` Cookie wird gesetzt
   - ✅ Alter Refresh-Token ist invalidiert (kann nicht mehr verwendet werden)

### 2.2 Manueller Token Refresh Test

1. **Öffne Browser Console**
   - Drücke `F12` → **Console** Tab

2. **Führe Refresh manuell aus:**
   ```javascript
   fetch('http://localhost:5000/api/auth/refresh-token', {
     method: 'POST',
     credentials: 'include', // Wichtig: Sendet Cookies
     headers: {
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({})
   })
   .then(res => res.json())
   .then(data => console.log('Refresh Response:', data));
   ```

3. **Prüfe Response:**
   - ✅ `success: true`
   - ✅ `token:` Neuer Access Token
   - ✅ `refreshToken:` Neuer Refresh Token

4. **Prüfe Cookie:**
   - ✅ Neuer `refreshToken` Cookie wird gesetzt
   - ✅ Cookie-Flags sind korrekt

---

## Test 3: Logout Flow

### 3.1 Standard Logout

1. **Login durchführen** (siehe Test 1)

2. **Klicke auf Logout**
   - Im Dashboard oder Navbar

3. **Prüfe Logout-Request:**
   - ✅ Request an `/api/auth/logout`
   - ✅ Status Code: `200 OK`
   - ✅ Response: `{ success: true }`

4. **Prüfe Cookie-Löschung:**
   - Gehe zu **Application** → **Cookies** → `http://localhost:5000`
   - ✅ `refreshToken` Cookie ist gelöscht (oder `Max-Age=0`)

5. **Prüfe localStorage:**
   - ✅ `token` ist entfernt
   - ✅ `refreshToken` ist entfernt (falls vorhanden)
   - ✅ `user` ist entfernt

6. **Prüfe Redirect:**
   - ✅ Redirect zu Login-Seite
   - ✅ Kein Zugriff auf geschützte Routen mehr möglich

### 3.2 Logout from All Devices

1. **Login auf mehreren Geräten/Browsern**

2. **Führe "Logout from All Devices" aus**

3. **Prüfe:**
   - ✅ Alle Refresh-Tokens sind invalidiert
   - ✅ Andere Geräte werden ausgeloggt

---

## Test 4: API Requests mit Cookies

### 4.1 Cookie Transmission

1. **Login durchführen** (siehe Test 1)

2. **Öffne Network Tab**
   - Filter: `XHR` oder `Fetch`

3. **Führe API-Request aus**
   - Z.B. Dashboard laden, Bookings laden, etc.

4. **Prüfe Request Headers:**
   - ✅ **Cookie Header:** Enthält `refreshToken=...`
   - ✅ **Authorization Header:** Enthält `Bearer <access_token>`
   - ✅ **withCredentials:** `true` (in Request Details)

5. **Prüfe Response:**
   - ✅ Status Code: `200 OK`
   - ✅ Daten werden korrekt zurückgegeben

### 4.2 CORS mit Credentials

1. **Prüfe CORS Headers in Response:**
   - ✅ `Access-Control-Allow-Credentials: true`
   - ✅ `Access-Control-Allow-Origin: http://localhost:5173` (oder deine Frontend-URL)

2. **Prüfe Preflight Request (OPTIONS):**
   - ✅ Preflight Request wird gesendet
   - ✅ Response enthält `Access-Control-Allow-Credentials: true`

---

## Test 5: Security Checks

### 5.1 XSS Protection

1. **Versuche Cookie über JavaScript zu lesen:**
   ```javascript
   // In Browser Console
   document.cookie
   ```
   - ✅ `refreshToken` ist NICHT in `document.cookie` sichtbar
   - ✅ Nur andere Cookies (falls vorhanden) sind sichtbar

2. **Versuche Cookie über localStorage zu lesen:**
   ```javascript
   localStorage.getItem('refreshToken')
   ```
   - ✅ `null` (Refresh-Token ist nicht in localStorage)

### 5.2 CSRF Protection

1. **Prüfe SameSite Flag:**
   - ✅ Cookie hat `SameSite=Strict`
   - ✅ Cookie wird nur bei Same-Site-Requests gesendet

2. **Test Cross-Site Request:**
   - Öffne andere Domain (z.B. `http://example.com`)
   - Versuche Request zu Backend zu senden
   - ✅ Cookie wird NICHT gesendet (SameSite=Strict)

### 5.3 Token Security

1. **Prüfe Token Expiry:**
   - ✅ Access Token: 15 Minuten (kurzlebig)
   - ✅ Refresh Token: 7 Tage (längerlebig)

2. **Prüfe Token Rotation:**
   - ✅ Bei jedem Refresh wird neuer Token generiert
   - ✅ Alter Token ist invalidiert

---

## Test 6: Dashboard Loading

### 6.1 Business Owner Dashboard

1. **Login als Business Owner**

2. **Navigiere zu Dashboard**
   - `http://localhost:5173/dashboard`

3. **Prüfe Dashboard Load:**
   - ✅ Dashboard lädt ohne Fehler
   - ✅ Alle API-Requests verwenden zentrale `api`-Instanz
   - ✅ Keine direkten `localStorage`-Zugriffe für Tokens
   - ✅ Daten werden korrekt angezeigt

4. **Prüfe API-Requests:**
   - ✅ Bookings werden geladen
   - ✅ Services werden geladen
   - ✅ Employees werden geladen
   - ✅ Analytics werden geladen

### 6.2 Customer Dashboard

1. **Login als Customer**

2. **Navigiere zu Customer Dashboard**

3. **Prüfe:**
   - ✅ Dashboard lädt korrekt
   - ✅ Bookings werden geladen
   - ✅ Profile wird geladen

### 6.3 Employee Dashboard

1. **Login als Employee**

2. **Navigiere zu Employee Dashboard**

3. **Prüfe:**
   - ✅ Dashboard lädt korrekt
   - ✅ Shifts werden geladen
   - ✅ Appointments werden geladen

---

## Test 7: Error Handling

### 7.1 401 Unauthorized

1. **Setze abgelaufenen Token:**
   ```javascript
   localStorage.setItem('token', 'expired_token_12345');
   ```

2. **Führe API-Request aus**

3. **Prüfe:**
   - ✅ Automatischer Refresh-Versuch
   - ✅ Bei Refresh-Failure: Logout und Redirect zu Login

### 7.2 403 Forbidden

1. **Versuche unerlaubte Aktion**

2. **Prüfe:**
   - ✅ Fehlermeldung wird angezeigt
   - ✅ Kein automatischer Refresh-Versuch

### 7.3 Network Errors

1. **Stoppe Backend temporär**

2. **Führe API-Request aus**

3. **Prüfe:**
   - ✅ Fehlerbehandlung funktioniert
   - ✅ User-freundliche Fehlermeldung

---

## Test 8: Browser Compatibility

### 8.1 Chrome/Edge

1. **Teste alle Flows in Chrome/Edge**
   - ✅ Login funktioniert
   - ✅ Cookies funktionieren
   - ✅ Token Refresh funktioniert

### 8.2 Firefox

1. **Teste alle Flows in Firefox**
   - ✅ Login funktioniert
   - ✅ Cookies funktionieren
   - ✅ Token Refresh funktioniert

### 8.3 Safari

1. **Teste alle Flows in Safari**
   - ✅ Login funktioniert
   - ✅ Cookies funktionieren
   - ✅ SameSite-Cookies funktionieren
   - ✅ Token Refresh funktioniert

---

## Test 9: Performance

### 9.1 API Request Speed

1. **Messe Request-Zeit:**
   - Öffne Network Tab
   - Führe verschiedene API-Requests aus
   - ✅ Requests sind schnell genug (< 500ms)

### 9.2 Token Refresh Performance

1. **Messe Refresh-Zeit:**
   - ✅ Token Refresh verursacht keine merkliche Verzögerung
   - ✅ User merkt keinen Unterschied

---

## Test 10: Edge Cases

### 10.1 Concurrent Requests

1. **Führe mehrere API-Requests gleichzeitig aus**

2. **Prüfe:**
   - ✅ Nur ein Refresh-Versuch gleichzeitig
   - ✅ Andere Requests warten auf Refresh
   - ✅ Keine Race Conditions

### 10.2 Missing Cookies

1. **Lösche Cookie manuell:**
   ```javascript
   // In Browser Console
   document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/api/auth;";
   ```

2. **Führe API-Request aus**

3. **Prüfe:**
   - ✅ Fehlende Cookies werden korrekt behandelt
   - ✅ User wird ausgeloggt bei fehlendem Refresh-Token

### 10.3 Cookie Expiry

1. **Warte bis Cookie abgelaufen ist** (7 Tage)

2. **Führe API-Request aus**

3. **Prüfe:**
   - ✅ Abgelaufene Cookies werden korrekt behandelt
   - ✅ User wird ausgeloggt

---

## ✅ Test Checklist

### Authentication Flow
- [ ] Login funktioniert (alle User-Typen)
- [ ] HTTP-only Cookie wird gesetzt
- [ ] Cookie-Flags sind korrekt (HttpOnly, SameSite, Secure)
- [ ] Access Token wird im Response Body zurückgegeben
- [ ] Token Refresh funktioniert automatisch
- [ ] Token Rotation funktioniert
- [ ] Logout löscht Cookie

### API Requests
- [ ] Cookies werden mit Requests gesendet
- [ ] Authorization Header wird gesetzt
- [ ] CORS funktioniert mit Credentials
- [ ] Alle API-Requests verwenden zentrale `api`-Instanz

### Security
- [ ] XSS Protection (Cookie nicht über JavaScript zugänglich)
- [ ] CSRF Protection (SameSite=Strict)
- [ ] Token Rotation funktioniert
- [ ] Token Expiry funktioniert

### Error Handling
- [ ] 401 wird korrekt behandelt
- [ ] Automatischer Refresh funktioniert
- [ ] Logout bei Refresh-Failure

### Browser Compatibility
- [ ] Chrome/Edge funktioniert
- [ ] Firefox funktioniert
- [ ] Safari funktioniert

---

## 🐛 Bekannte Probleme / Troubleshooting

### Problem: Cookie wird nicht gesetzt

**Lösung:**
- Prüfe CORS-Konfiguration (`credentials: true`)
- Prüfe Cookie-Path (`/api/auth`)
- Prüfe SameSite-Flag (kann in manchen Browsern Probleme verursachen)

### Problem: Cookie wird nicht gesendet

**Lösung:**
- Prüfe `withCredentials: true` in Axios-Konfiguration
- Prüfe CORS-Headers (`Access-Control-Allow-Credentials: true`)
- Prüfe Cookie-Path (muss mit Request-Path übereinstimmen)

### Problem: Token Refresh funktioniert nicht

**Lösung:**
- Prüfe Cookie ist vorhanden
- Prüfe Refresh-Token ist nicht abgelaufen
- Prüfe Backend-Logs für Fehler

---

**Status:** ✅ Test-Guide erstellt
**Last Updated:** $(date)

