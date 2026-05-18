# Production Smoke Test Plan (Go-Live)

Status: Active
Owner: Engineering
Ziel: In 45 bis 60 Minuten belastbar entscheiden, ob der aktuelle Release live bleiben darf.

## 1. Scope

Diese Smoke-Tests decken nur die kritischsten Revenue- und Stability-Pfade ab:
- Authentifizierung
- Subscription und Checkout
- Public Booking
- Kern-Dashboard
- System Health und Worker-Lebenszeichen
- Failover-Verhalten
- Rollback-Fähigkeit

## 2. Voraussetzungen

- Deploy ist bereits auf Railway (Backend) und Vercel (Frontend) live.
- CEO-Account vorhanden.
- Ein Test-Salon mit mindestens einem Service und einem Mitarbeiter vorhanden.
- BACKEND_URL und FRONTEND_URL bekannt.
- Browser mit DevTools verfügbar.

Beispiel:
- BACKEND_URL=https://<railway-domain>
- FRONTEND_URL=https://<vercel-domain>

## 3. Phase A: Technische Gates (10 Minuten)

### A1. Lokale Release-Gates vor Go-Live

- [ ] Backend Unit Tests
  - Befehl: cd backend && npm test -- --testTimeout=15000 --forceExit
- [ ] Backend Integration Tests
  - Befehl: cd backend && node --no-warnings --experimental-vm-modules scripts/jestRunner.cjs --config jest.integration.config.js --testTimeout=20000 --forceExit
- [ ] Frontend Build
  - Befehl: cd frontend && npm run build

Pass-Kriterium:
- Alle Tests und Build grün.

### A2. Post-Deploy Health

- [ ] Simple LB Health
  - curl -fsS "$BACKEND_URL/health"
- [ ] System Ping
  - curl -fsS "$BACKEND_URL/api/system/ping"
- [ ] Detailed Health
  - curl -fsS "$BACKEND_URL/api/system/health"
- [ ] Frontend erreichbar
  - curl -fsSI "$FRONTEND_URL"

Pass-Kriterium:
- 200er Antworten.
- Datenbankstatus healthy/connected.
- Keine Crash-Loops in Railway Logs.

## 4. Phase B: Happy Path (20 Minuten)

### B1. Auth und Session

- [ ] Login als Salon Owner funktioniert.
- [ ] Logout funktioniert.
- [ ] Reload auf geschützten Seiten bleibt stabil (keine Loop zu Login).

Pass-Kriterium:
- Keine 401/403 Schleifen in der UI.

### B2. Pricing bis Checkout

- [ ] Preisplan auswählen.
- [ ] Checkout startet korrekt.
- [ ] Rückkehr nach erfolgreicher Zahlung auf Success/Dashboard.
- [ ] Subscription-Status im Account konsistent.

Pass-Kriterium:
- End-to-end ohne manuelle DB-Korrektur.

### B3. Public Booking End-to-End

- [ ] Öffentliche Buchungsseite laden.
- [ ] Service + Mitarbeiter + Timeslot auswählen.
- [ ] Buchung erstellen.
- [ ] Buchung erscheint im Dashboard.

Pass-Kriterium:
- Keine Tenant-Verwechslung, keine 500er.

### B4. Kern-Dashboard

- [ ] Dashboard lädt KPIs/Listen.
- [ ] Buchungsliste lädt.
- [ ] CRM/Customer-Liste lädt.
- [ ] CEO-Dashboard öffnet.

Pass-Kriterium:
- Kritische Views laden innerhalb akzeptabler Zeit ohne Error-Banner.

### B5. Benachrichtigungen

- [ ] Mindestens eine Email-basierte Systemaktion erfolgreich.
- [ ] Falls SMS aktiviert: Test-SMS erfolgreich.

Pass-Kriterium:
- Keine Queue-Stalls, kein Deadletter-Spike.

## 5. Phase C: Failover und Degradation (15 Minuten)

### C1. Backend-Restart-Resilienz

- [ ] Während geöffneter Dashboard-Session Railway-Service neu deployen/restarten.
- [ ] Nach Wiederanlauf Seite neu laden und Kernaktionen erneut testen.

Pass-Kriterium:
- Service erholt sich sauber, Session-Flow bleibt funktional.

### C2. Netzwerk-Degradation (Client-seitig)

- [ ] Browser kurz offline setzen (10 bis 20 Sekunden), dann online.
- [ ] Erneut Kernaktionen ausführen.

Pass-Kriterium:
- UI zeigt kontrollierte Fehler und erholt sich nach Reconnect.

### C3. Unauthorized-Schutz

- [ ] Geschützten CEO-Endpunkt ohne gültige Session aufrufen.

Pass-Kriterium:
- 401/403 statt 500.

## 6. Phase D: Rollback-Readiness (10 Minuten)

### D1. Rollback-Trigger definieren

Rollback sofort, wenn eines davon eintritt:
- Health Endpoint länger als 5 Minuten nicht healthy.
- Checkout oder Public Booking reproduzierbar defekt.
- Datenintegrität verletzt (falsche Tenant-Daten sichtbar).
- Kritische Error-Rate über vereinbartem Schwellwert.

### D2. Rollback-Prozedur

- [ ] Backend auf vorheriges Railway Deployment zurücksetzen.
- [ ] Frontend auf vorheriges Vercel Deployment promoten.
- [ ] Health erneut prüfen:
  - curl -fsS "$BACKEND_URL/health"
  - curl -fsS "$BACKEND_URL/api/system/health"

### D3. Daten-Restore-Notfallpfad

Nur wenn Datenfehler nachgewiesen ist:
- [ ] Aktuellen Zustand sichern (Backup erstellen).
- [ ] Restore mit Admin-Freigabe durchführen.
- [ ] Nach Restore vollständigen Smoke-Test erneut ausführen.

## 7. Go/No-Go Gate

Go nur wenn alle Bedingungen erfüllt sind:
- [ ] Phase A vollständig grün
- [ ] Phase B vollständig grün
- [ ] Phase C mindestens C1 und C2 grün
- [ ] Rollback-Pfad ist dokumentiert und ausführbar

No-Go wenn eine dieser Bedingungen nicht erfüllt ist.

## 8. Evidence (Pflicht)

Für jede Phase speichern:
- Screenshot oder kurze Notiz pro Checkpunkt
- Zeitstempel
- Name der testenden Person
- Ergebnis (PASS/FAIL)
- Falls FAIL: Ticket-ID + Owner + ETA

## 9. Ergebnisprotokoll

Release-Version:
Datum/Uhrzeit:
Tester:

Zusammenfassung:
- Phase A: PASS/FAIL
- Phase B: PASS/FAIL
- Phase C: PASS/FAIL
- Rollback Readiness: PASS/FAIL

Entscheidung:
- GO
- NO-GO

Offene Punkte:
- Punkt 1
- Punkt 2

