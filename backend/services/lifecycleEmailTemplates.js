/**
 * Lifecycle Email Templates
 * Automated trial nurturing emails for conversion optimization
 *
 * Based on SaaS best practices:
 * - Day 1: Welcome + Quick Start
 * - Day 3: Engagement check
 * - Day 7: Value demonstration
 * - Day 23: Urgency reminder
 * - Day 30: Final call
 * - Day 31: Post-expiry discount
 * - Day 45: Win-back campaign
 */

// Company info for footer
const COMPANY_INFO = {
  name: 'JN Automation',
  email: 'support@jn-automation.de',
  website: 'https://jn-automation.de',
  address: 'Deutschland'
};

/**
 * Email template factory
 */
const createEmailTemplate = (subject, body) => ({
  subject,
  body,
  html: generateHtmlEmail(subject, body)
});

/**
 * Generate responsive HTML email
 */
const generateHtmlEmail = (subject, body) => {
  const bodyHtml = body
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/✅/g, '<span style="color: #10B981;">✅</span>')
    .replace(/🎯/g, '<span>🎯</span>')
    .replace(/💡/g, '<span>💡</span>')
    .replace(/⏰/g, '<span>⏰</span>')
    .replace(/🚀/g, '<span>🚀</span>')
    .replace(/🎁/g, '<span>🎁</span>')
    .replace(/👋/g, '<span>👋</span>');

  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">JN Automation</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px; color: #374151;">
              <p style="margin: 0 0 20px 0; font-size: 16px;">${bodyHtml}</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; text-align: center;">
                ${COMPANY_INFO.name} | <a href="mailto:${COMPANY_INFO.email}" style="color: #3B82F6; text-decoration: none;">${COMPANY_INFO.email}</a>
                <br>
                <a href="${COMPANY_INFO.website}" style="color: #3B82F6; text-decoration: none;">${COMPANY_INFO.website}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * CTA Button HTML
 */
const ctaButton = (text, url) => `
<div style="text-align: center; margin: 30px 0;">
  <a href="${url}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">${text}</a>
</div>`;

/**
 * Get lifecycle email template by type
 */
export const getLifecycleEmailTemplate = (emailType, data) => {
  const {
    userName = 'Geschätzter Kunde',
    salonName = 'Ihr Studio',
    dashboardUrl = 'https://app.jn-automation.de/admin',
    pricingUrl = 'https://jn-automation.de/pricing',
    supportEmail = 'support@jn-automation.de'
  } = data || {};

  const templates = {
    // ==================== DAY 1: WELCOME ====================
    welcome_day1: createEmailTemplate(
      `🚀 Willkommen bei JN Automation, ${userName}!`,
      `Hallo ${userName},

herzlich willkommen bei JN Automation! 👋

Dein 30-Tage-Test für **${salonName}** ist jetzt aktiv. Hier sind deine nächsten Schritte:

**In 5 Minuten startklar:**

✅ **Schritt 1:** Services anlegen
Erstelle deine Behandlungen mit Preisen und Dauer.

✅ **Schritt 2:** Öffnungszeiten festlegen
Definiere wann dein Studio Termine annimmt.

✅ **Schritt 3:** Widget einbinden
Kopiere den Code und füge ihn auf deiner Website ein.

✅ **Schritt 4:** Erster Test-Termin
Buche selbst einen Termin um alles zu testen.

${ctaButton('Jetzt zum Dashboard →', dashboardUrl)}

**Brauchst du Hilfe?**
Antworte einfach auf diese E-Mail oder schreibe an ${supportEmail}

Viel Erfolg mit deinem Studio!

Julius
Gründer, JN Automation`
    ),

    // ==================== DAY 3: ENGAGEMENT CHECK ====================
    engagement_day3: createEmailTemplate(
      `💡 ${userName}, hast du schon deinen ersten Termin erstellt?`,
      `Hallo ${userName},

du bist jetzt seit 3 Tagen bei JN Automation dabei. Wie läuft's? 🎯

**Schnelle Frage:** Hast du schon...

☐ Deine Services angelegt?
☐ Die Öffnungszeiten eingestellt?
☐ Das Buchungs-Widget getestet?

Falls nicht - kein Problem! Die Einrichtung dauert nur **5-10 Minuten**.

${ctaButton('Studio einrichten →', dashboardUrl)}

**Wusstest du?**
Studios, die in der ersten Woche aktiv sind, sparen durchschnittlich **8 Stunden pro Monat** bei der Terminverwaltung.

**Noch Fragen?**
Ich helfe dir gerne persönlich. Schreib mir an ${supportEmail}

Beste Grüße,
Julius`
    ),

    // ==================== DAY 7: MID-TRIAL ====================
    midtrial_day7: createEmailTemplate(
      `⏰ ${userName}, noch 23 Tage Trial – brauchst du Unterstützung?`,
      `Hallo ${userName},

eine Woche ist rum! Dein Test läuft noch **23 Tage**.

**Wie kann ich dir helfen?**

Ich möchte sicherstellen, dass du das Beste aus JN Automation herausholst. Hier sind die häufigsten Fragen:

🎯 **"Wie integriere ich das Widget auf meiner Website?"**
→ Kopiere einfach den Code aus Dashboard > Widget

🎯 **"Kann ich die Bestätigungsmail anpassen?"**
→ Ja! Unter Einstellungen > E-Mail-Templates

🎯 **"Was passiert wenn ein Kunde absagt?"**
→ Du bekommst sofort eine Benachrichtigung und der Termin wird freigegeben

${ctaButton('Alle Features entdecken →', dashboardUrl)}

**Pro-Tipp:**
Aktiviere automatische Erinnerungen! Studios mit aktivierten Erinnerungen haben **30% weniger No-Shows**.

Fragen? Einfach antworten!

Julius`
    ),

    // ==================== DAY 23: URGENCY ====================
    urgency_day23: createEmailTemplate(
      `⚠️ ${userName}, nur noch 7 Tage bis dein Test endet`,
      `Hallo ${userName},

dein 30-Tage-Test für **${salonName}** endet in **7 Tagen**.

**Hast du schon alle Features getestet?**

✅ Online-Buchungswidget
✅ Automatische Terminbestätigungen
✅ Erinnerungs-E-Mails an Kunden
✅ Google-Bewertungsanfragen
✅ Umsatz-Statistiken

**Jetzt upgraden und profitieren:**

🎁 **Starter** – €49/Monat
Für Solo-Studios mit bis zu 500 Buchungen

🎁 **Professional** – €99/Monat
Für wachsende Studios mit Team

🎁 **Enterprise** – €199/Monat
Für große Ketten mit mehreren Standorten

${ctaButton('Plan auswählen →', pricingUrl)}

**20% Rabatt bei Jahreszahlung!**

Fragen zum passenden Plan? Schreib mir!

Julius`
    ),

    // ==================== DAY 30: FINAL CALL ====================
    expiry_day30: createEmailTemplate(
      `🚨 ${userName}, dein Test endet HEUTE`,
      `Hallo ${userName},

dein 30-Tage-Test für **${salonName}** endet **heute um Mitternacht**.

**Ab morgen:**
❌ Kein Zugriff mehr auf dein Dashboard
❌ Buchungs-Widget funktioniert nicht mehr
❌ Bestehende Termine bleiben, aber keine neuen

**Jetzt upgraden und nahtlos weitermachen:**

${ctaButton('Jetzt upgraden →', pricingUrl)}

**Nicht bereit?**
Kein Problem! Deine Daten bleiben 30 Tage gespeichert. Du kannst jederzeit zurückkommen.

Danke, dass du JN Automation ausprobiert hast!

Julius`
    ),

    // ==================== DAY 31: POST-EXPIRY DISCOUNT ====================
    expired_day31: createEmailTemplate(
      `🎁 ${userName}, exklusiv für dich: 20% Rabatt`,
      `Hallo ${userName},

dein Test ist gestern abgelaufen. Schade, dass es nicht geklappt hat!

**Aber ich möchte dir eine letzte Chance geben:**

🎁 **20% Rabatt auf alle Pläne** – nur heute!

Nutze den Code **COMEBACK20** beim Checkout.

${ctaButton('Mit 20% Rabatt starten →', pricingUrl)}

**Deine Daten sind noch da!**
Alle deine Services, Einstellungen und Statistiken warten auf dich.

**War etwas nicht gut?**
Ich würde mich über ehrliches Feedback freuen. Was hat gefehlt? Was können wir besser machen?

Einfach auf diese E-Mail antworten.

Julius`
    ),

    // ==================== DAY 45: WIN-BACK ====================
    winback_day45: createEmailTemplate(
      `👋 ${userName}, wir vermissen dich!`,
      `Hallo ${userName},

es ist eine Weile her seit deinem Test bei JN Automation.

**Was ist passiert?**
- Nicht das Richtige für dich?
- Keine Zeit gehabt?
- Technische Probleme?

Ich würde mich freuen zu hören, was wir besser machen können.

**Neuer Start gefällig?**
Falls du es nochmal probieren möchtest, schenke ich dir **einen weiteren Monat kostenlos**.

${ctaButton('Kostenlosen Monat aktivieren →', `${pricingUrl}?promo=FREETRIAL`)}

Ansonsten: Alles Gute für dein Business!

Julius
JN Automation`
    )
  };

  return templates[emailType] || null;
};

/**
 * Get all email types in order
 */
export const getEmailSchedule = () => [
  { type: 'welcome_day1', day: 1, description: 'Welcome + Setup Guide' },
  { type: 'engagement_day3', day: 3, description: 'Engagement check' },
  { type: 'midtrial_day7', day: 7, description: 'Mid-trial support' },
  { type: 'urgency_day23', day: 23, description: 'Urgency reminder' },
  { type: 'expiry_day30', day: 30, description: 'Trial expiry' },
  { type: 'expired_day31', day: 31, description: 'Post-expiry discount' },
  { type: 'winback_day45', day: 45, description: 'Win-back campaign' }
];

export default {
  getLifecycleEmailTemplate,
  getEmailSchedule
};
