# Production Testing Checklist

## STEP 3: Production Testing

### ✅ Test 1: Authentication Flow Testing

#### 1.1 Login Flow
- [ ] **Standard Login (Business Owner)**
  - [ ] Login mit Email/Password funktioniert
  - [ ] HTTP-only Cookie `refreshToken` wird gesetzt
  - [ ] Access Token wird im Response Body zurückgegeben
  - [ ] Access Token wird temporär in localStorage gespeichert (Migration)
  - [ ] User wird korrekt eingeloggt
  - [ ] Redirect nach erfolgreichem Login funktioniert

- [ ] **CEO Login**
  - [ ] 2FA-Flow funktioniert
  - [ ] HTTP-only Cookie wird gesetzt
  - [ ] Längere Session (1 Tag) für CEO

- [ ] **Employee Login**
  - [ ] Login mit Company ID funktioniert
  - [ ] HTTP-only Cookie wird gesetzt
  - [ ] Employee-Dashboard wird korrekt geladen

- [ ] **Customer Login**
  - [ ] Public Login funktioniert
  - [ ] HTTP-only Cookie wird gesetzt
  - [ ] Customer-Dashboard wird korrekt geladen

#### 1.2 Token Refresh Flow
- [ ] **Automatic Token Refresh**
  - [ ] Bei 401-Error wird automatisch Refresh-Token verwendet
  - [ ] Refresh-Token wird aus HTTP-only Cookie gelesen
  - [ ] Neuer Access Token wird erhalten
  - [ ] Original Request wird mit neuem Token wiederholt
  - [ ] Token Rotation: Alter Refresh-Token wird invalidiert
  - [ ] Neuer Refresh-Token wird in Cookie gesetzt

- [ ] **Refresh Token Expiry**
  - [ ] Bei abgelaufenem Refresh-Token wird User ausgeloggt
  - [ ] Redirect zu Login-Seite funktioniert
  - [ ] localStorage wird korrekt geleert

#### 1.3 Logout Flow
- [ ] **Standard Logout**
  - [ ] Logout-Endpoint wird aufgerufen
  - [ ] Refresh-Token wird invalidiert
  - [ ] HTTP-only Cookie wird gelöscht
  - [ ] localStorage wird geleert
  - [ ] Redirect zu Login-Seite funktioniert

- [ ] **Logout from All Devices**
  - [ ] Alle Refresh-Tokens werden invalidiert
  - [ ] User wird auf allen Geräten ausgeloggt

### ✅ Test 2: API Request Testing

#### 2.1 Cookie Transmission
- [ ] **withCredentials Configuration**
  - [ ] Alle API-Requests senden Cookies (`withCredentials: true`)
  - [ ] CORS-Konfiguration erlaubt Credentials
  - [ ] Cookies werden bei Cross-Origin-Requests gesendet

#### 2.2 Authorization Headers
- [ ] **Access Token in Header**
  - [ ] Access Token wird im `Authorization: Bearer <token>` Header gesendet
  - [ ] Token wird aus localStorage gelesen (temporär)
  - [ ] Bei fehlendem Token wird Refresh-Flow ausgelöst

#### 2.3 Error Handling
- [ ] **401 Unauthorized**
  - [ ] Automatischer Refresh-Versuch
  - [ ] Bei Refresh-Failure: Logout und Redirect
  - [ ] Keine Endlosschleife bei wiederholten 401-Fehlern

- [ ] **403 Forbidden**
  - [ ] Fehlermeldung wird korrekt angezeigt
  - [ ] Kein automatischer Refresh-Versuch

- [ ] **Network Errors**
  - [ ] Fehlerbehandlung bei Netzwerkproblemen
  - [ ] Retry-Logik funktioniert korrekt

### ✅ Test 3: Dashboard Testing

#### 3.1 Business Owner Dashboard
- [ ] **Dashboard Load**
  - [ ] Dashboard lädt mit korrekten Credentials
  - [ ] Alle API-Calls verwenden zentrale `api`-Instanz
  - [ ] Keine direkten `localStorage`-Zugriffe für Tokens
  - [ ] Daten werden korrekt angezeigt

- [ ] **Dashboard Features**
  - [ ] Bookings werden geladen
  - [ ] Services werden geladen
  - [ ] Employees werden geladen
  - [ ] Analytics werden geladen

#### 3.2 Customer Dashboard
- [ ] **Customer Features**
  - [ ] Bookings werden geladen
  - [ ] Profile wird geladen
  - [ ] Settings funktionieren

#### 3.3 Employee Dashboard
- [ ] **Employee Features**
  - [ ] Shifts werden geladen
  - [ ] Appointments werden geladen
  - [ ] Stats werden geladen

#### 3.4 CEO Dashboard
- [ ] **CEO Features**
  - [ ] System-Übersicht wird geladen
  - [ ] User-Management funktioniert
  - [ ] Analytics werden geladen

### ✅ Test 4: Booking Flow Testing

#### 4.1 Create Booking
- [ ] **Public Booking**
  - [ ] Booking-Erstellung ohne Login funktioniert
  - [ ] Booking-Erstellung mit Login funktioniert
  - [ ] Payment-Integration funktioniert

#### 4.2 Manage Booking
- [ ] **Booking Management**
  - [ ] Booking-Liste wird geladen
  - [ ] Booking-Details werden geladen
  - [ ] Booking-Bearbeitung funktioniert
  - [ ] Booking-Stornierung funktioniert

### ✅ Test 5: Security Testing

#### 5.1 Cookie Security
- [ ] **HTTP-only Flag**
  - [ ] Refresh-Token Cookie ist `httpOnly: true`
  - [ ] Cookie ist nicht über JavaScript zugänglich
  - [ ] XSS-Angriffe können Token nicht stehlen

- [ ] **Secure Flag**
  - [ ] In Production: `secure: true` (HTTPS only)
  - [ ] In Development: `secure: false` (HTTP allowed)

- [ ] **SameSite Flag**
  - [ ] `sameSite: 'strict'` verhindert CSRF-Angriffe
  - [ ] Cookies werden nur bei Same-Site-Requests gesendet

#### 5.2 Token Security
- [ ] **Token Rotation**
  - [ ] Bei jedem Refresh wird neuer Token generiert
  - [ ] Alter Token wird invalidiert
  - [ ] Token-Reuse wird verhindert

- [ ] **Token Expiry**
  - [ ] Access Token: 15 Minuten (kurzlebig)
  - [ ] Refresh Token: 7 Tage (längerlebig)
  - [ ] Abgelaufene Tokens werden korrekt behandelt

#### 5.3 XSS Protection
- [ ] **No Token in localStorage**
  - [ ] Refresh-Token ist NIE in localStorage
  - [ ] Access Token nur temporär (wird entfernt)
  - [ ] Keine sensiblen Daten in localStorage

#### 5.4 CSRF Protection
- [ ] **SameSite Cookies**
  - [ ] `sameSite: 'strict'` verhindert CSRF
  - [ ] Cookies werden nicht bei Cross-Site-Requests gesendet

### ✅ Test 6: Multi-Tenant Testing

#### 6.1 Tenant Isolation
- [ ] **Data Isolation**
  - [ ] Jeder Tenant sieht nur eigene Daten
  - [ ] Keine Daten-Leaks zwischen Tenants
  - [ ] Tenant-ID wird korrekt aus Token/Profile gelesen

#### 6.2 Multi-Location
- [ ] **Location Switching**
  - [ ] Location-Wechsel funktioniert
  - [ ] Daten werden korrekt gefiltert
  - [ ] Permissions werden korrekt geprüft

### ✅ Test 7: Edge Cases & Error Handling

#### 7.1 Network Issues
- [ ] **Offline Handling**
  - [ ] Fehlermeldung bei Offline-Status
  - [ ] Retry-Logik bei Netzwerkfehlern

#### 7.2 Token Edge Cases
- [ ] **Concurrent Requests**
  - [ ] Mehrere 401-Errors gleichzeitig
  - [ ] Nur ein Refresh-Versuch gleichzeitig
  - [ ] Andere Requests warten auf Refresh

- [ ] **Token Race Conditions**
  - [ ] Keine Race Conditions bei Token-Refresh
  - [ ] `_retry` Flag verhindert Endlosschleifen

#### 7.3 Cookie Edge Cases
- [ ] **Missing Cookies**
  - [ ] Fehlende Cookies werden korrekt behandelt
  - [ ] User wird ausgeloggt bei fehlendem Refresh-Token

- [ ] **Cookie Expiry**
  - [ ] Abgelaufene Cookies werden korrekt behandelt
  - [ ] User wird ausgeloggt bei abgelaufenem Refresh-Token

### ✅ Test 8: Performance Testing

#### 8.1 API Performance
- [ ] **Request Speed**
  - [ ] API-Requests sind schnell genug
  - [ ] Token-Refresh verursacht keine merkliche Verzögerung

#### 8.2 Caching
- [ ] **Service Caching**
  - [ ] Service-Liste wird gecacht
  - [ ] Cache-Invalidierung funktioniert

- [ ] **Salon Info Caching**
  - [ ] Salon-Info wird gecacht
  - [ ] Cache-Invalidierung funktioniert

### ✅ Test 9: Browser Compatibility

#### 9.1 Modern Browsers
- [ ] **Chrome/Edge**
  - [ ] HTTP-only Cookies funktionieren
  - [ ] `withCredentials` funktioniert

- [ ] **Firefox**
  - [ ] HTTP-only Cookies funktionieren
  - [ ] `withCredentials` funktioniert

- [ ] **Safari**
  - [ ] HTTP-only Cookies funktionieren
  - [ ] `withCredentials` funktioniert
  - [ ] SameSite-Cookies funktionieren

#### 9.2 Mobile Browsers
- [ ] **iOS Safari**
  - [ ] Cookies funktionieren
  - [ ] Login funktioniert

- [ ] **Android Chrome**
  - [ ] Cookies funktionieren
  - [ ] Login funktioniert

### ✅ Test 10: Integration Testing

#### 10.1 Sentry Integration
- [ ] **Error Tracking**
  - [ ] Fehler werden an Sentry gesendet
  - [ ] Sensible Daten werden redigiert
  - [ ] Performance-Monitoring funktioniert

#### 10.2 Logging
- [ ] **Backend Logging**
  - [ ] `logger` wird verwendet statt `console.log`
  - [ ] Fehler werden korrekt geloggt

- [ ] **Frontend Logging**
  - [ ] `errorTracking` wird verwendet statt `console.error`
  - [ ] Fehler werden korrekt getrackt

---

## Test Execution Notes

### Environment Setup
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`
- CORS: Konfiguriert für Credentials
- Cookies: HTTP-only, Secure (Production), SameSite: strict

### Test Data
- Test User: `test@example.com` / `password123`
- Test CEO: `ceo@example.com` / `password123`
- Test Employee: `employee@example.com` / `password123`

### Manual Testing Checklist
1. ✅ Login Flow (alle User-Typen)
2. ✅ Token Refresh Flow
3. ✅ Logout Flow
4. ✅ Dashboard Loading
5. ✅ API Requests mit Cookies
6. ✅ Security Checks (Cookie Flags)
7. ✅ Error Handling
8. ✅ Edge Cases

### Automated Testing (Future)
- Unit Tests für Auth-Flow
- Integration Tests für API-Calls
- E2E Tests für Login/Logout
- Security Tests für Cookie-Handling

---

## Known Issues & TODOs

### Current Limitations
- Access Token wird noch temporär in localStorage gespeichert
- Wird entfernt nach vollständiger Migration zu Cookies

### Future Improvements
- [ ] Access Token auch als HTTP-only Cookie
- [ ] CSRF-Token für zusätzliche Sicherheit
- [ ] Rate Limiting für Login-Endpoints
- [ ] Device Fingerprinting für zusätzliche Sicherheit

---

**Status:** 🟡 In Progress
**Last Updated:** $(date)
**Next Steps:** Manual Testing durchführen

