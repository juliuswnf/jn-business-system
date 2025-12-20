# AXIOS IMPORT FIX - Systematische Behebung

## Problem
13 Komponenten importieren `axios` direkt statt die zentrale `api.js` zu nutzen.
Dies führt zu:
- ❌ Kein automatisches Token-Handling
- ❌ Kein automatisches Token-Refresh bei 401
- ❌ Keine einheitliche Error-Behandlung
- ❌ Manuelles Setzen von Authorization-Header in jeder Komponente

## Lösung
Alle Komponenten auf zentrale API umstellen:

```javascript
// ❌ FALSCH
import axios from 'axios';
const token = localStorage.getItem('token');
axios.get(`${API_URL}/endpoint`, { headers: { Authorization: `Bearer ${token}` } });

// ✅ RICHTIG
import { api } from '../../utils/api';
api.get('/endpoint'); // Token wird automatisch injiziert
```

## Betroffene Dateien (13)
1. ✅ Marketing.jsx - GEFIXT
2. ⚠️ Waitlist.jsx - GEFIXT (localStorage)
3. ❌ WorkflowProjectDetail.jsx
4. ❌ CampaignAnalytics.jsx
5. ❌ SubscriptionManagement.jsx
6. ❌ WorkflowProjects.jsx
7. ❌ WorkflowProjectEditor.jsx
8. ❌ Workflows.jsx
9. ❌ PackagesMemberships.jsx
10. ❌ CampaignEditor.jsx
11. ❌ TattooProjects.jsx
12. ❌ SubscriptionCheckout.jsx
13. ❌ DowngradeWarningModal.jsx
14. ❌ SubscriptionUpgrade.jsx

## Priority Fix (Kritische Komponenten)
Diese 5 Komponenten werden JETZT gefixt:

### 1. Waitlist.jsx
Bereits localStorage-Fix - jetzt API-Fix nötig

### 2. SubscriptionManagement.jsx
Kritisch für Zahlungen

### 3. CampaignAnalytics.jsx + CampaignEditor.jsx
Marketing-Features

### 4. SubscriptionCheckout.jsx
Bezahlprozess

## Nächste Schritte
1. Fix Waitlist.jsx axios import
2. Fix alle Subscription-Komponenten
3. Fix alle Workflow-Komponenten (batch)
4. Testing
5. Commit mit Message: "Fix: Replace direct axios imports with central api instance for auto token handling"
