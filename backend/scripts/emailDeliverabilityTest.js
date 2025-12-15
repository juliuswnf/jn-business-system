/**
 * Email Deliverability Test Script
 *
 * Tests:
 * 1. SMTP connection
 * 2. SPF/DKIM/DMARC DNS record checks
 * 3. Send test emails to major providers
 * 4. Generate mail-tester.com test email
 *
 * Usage: node scripts/emailDeliverabilityTest.js [test-email@example.com]
 *
 * KRITISCH: Ohne korrekte SPF/DKIM/DMARC landen 60-70% der E-Mails im Spam!
 */

import nodemailer from 'nodemailer';
import dns from 'dns';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const resolveTxt = promisify(dns.resolveTxt);
const resolveMx = promisify(dns.resolveMx);

// ==================== COLORS ====================
const c = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

// ==================== CONFIG ====================
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || process.env.SMTP_HOST,
  port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587'),
  secure: (process.env.EMAIL_SECURE || process.env.SMTP_SECURE) === 'true',
  user: process.env.EMAIL_USER || process.env.SMTP_USER,
  pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || process.env.SMTP_PASS,
  from: process.env.EMAIL_FROM || process.env.SMTP_FROM || 'noreply@jn-business-system.de'
};

// Extract domain from FROM address
const FROM_DOMAIN = EMAIL_CONFIG.from.includes('@')
  ? EMAIL_CONFIG.from.split('@')[1].replace('>', '')
  : 'jn-business-system.de';

// ==================== RESULTS TRACKING ====================
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function addResult(category, test, status, details = '') {
  results.tests.push({ category, test, status, details });
  if (status === 'pass') results.passed++;
  else if (status === 'fail') results.failed++;
  else results.warnings++;
}

// ==================== DNS CHECKS ====================

async function checkSPF() {
  console.log(`\n${c.cyan}═══ SPF Record Check ═══${c.reset}`);
  console.log(`Domain: ${FROM_DOMAIN}`);

  try {
    const records = await resolveTxt(FROM_DOMAIN);
    const spfRecord = records.flat().find(r => r.startsWith('v=spf1'));

    if (spfRecord) {
      console.log(`${c.green}✓ SPF Record found:${c.reset}`);
      console.log(`  ${c.dim}${spfRecord}${c.reset}`);

      // Check for common issues
      if (spfRecord.includes('-all')) {
        addResult('DNS', 'SPF Record', 'pass', 'Strict policy (-all)');
        console.log(`  ${c.green}✓ Strict policy (-all) - Excellent!${c.reset}`);
      } else if (spfRecord.includes('~all')) {
        addResult('DNS', 'SPF Record', 'pass', 'Soft fail policy (~all)');
        console.log(`  ${c.yellow}⚠ Soft fail policy (~all) - OK but consider -all${c.reset}`);
      } else if (spfRecord.includes('?all')) {
        addResult('DNS', 'SPF Record', 'warn', 'Neutral policy (?all)');
        console.log(`  ${c.yellow}⚠ Neutral policy (?all) - Should use ~all or -all${c.reset}`);
      } else if (spfRecord.includes('+all')) {
        addResult('DNS', 'SPF Record', 'fail', 'Permissive policy (+all)');
        console.log(`  ${c.red}✗ Permissive policy (+all) - INSECURE!${c.reset}`);
      }

      // Check if includes your SMTP provider
      if (EMAIL_CONFIG.host && spfRecord.toLowerCase().includes(EMAIL_CONFIG.host.split('.').slice(-2).join('.'))) {
        console.log(`  ${c.green}✓ SMTP provider likely included in SPF${c.reset}`);
      }

      return true;
    } else {
      addResult('DNS', 'SPF Record', 'fail', 'No SPF record found');
      console.log(`${c.red}✗ No SPF record found!${c.reset}`);
      console.log(`\n${c.yellow}To fix, add this TXT record to your DNS:${c.reset}`);
      console.log(`  v=spf1 include:_spf.google.com include:spf.protection.outlook.com ~all`);
      return false;
    }
  } catch (error) {
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      addResult('DNS', 'SPF Record', 'fail', 'Domain not found or no TXT records');
      console.log(`${c.red}✗ No TXT records found for domain${c.reset}`);
    } else {
      addResult('DNS', 'SPF Record', 'fail', error.message);
      console.log(`${c.red}✗ Error: ${error.message}${c.reset}`);
    }
    return false;
  }
}

async function checkDKIM() {
  console.log(`\n${c.cyan}═══ DKIM Record Check ═══${c.reset}`);

  // Common DKIM selectors to check
  const selectors = ['google', 'default', 'selector1', 'selector2', 'mail', 'dkim', 's1', 's2', 'k1'];
  let foundDKIM = false;

  for (const selector of selectors) {
    const dkimDomain = `${selector}._domainkey.${FROM_DOMAIN}`;
    try {
      const records = await resolveTxt(dkimDomain);
      const dkimRecord = records.flat().join('');

      if (dkimRecord.includes('v=DKIM1') || dkimRecord.includes('p=')) {
        console.log(`${c.green}✓ DKIM Record found (selector: ${selector}):${c.reset}`);
        console.log(`  ${c.dim}${dkimRecord.substring(0, 80)}...${c.reset}`);
        addResult('DNS', 'DKIM Record', 'pass', `Selector: ${selector}`);
        foundDKIM = true;
        break;
      }
    } catch (error) {
      // Continue checking other selectors
    }
  }

  if (!foundDKIM) {
    addResult('DNS', 'DKIM Record', 'warn', 'No common DKIM selectors found');
    console.log(`${c.yellow}⚠ No DKIM record found with common selectors${c.reset}`);
    console.log(`  ${c.dim}Checked: ${selectors.join(', ')}${c.reset}`);
    console.log(`\n${c.yellow}Note: DKIM is usually configured by your email provider (Gmail, Outlook, etc.)${c.reset}`);
    console.log(`  If using Gmail Workspace: Admin Console → Apps → Google Workspace → Gmail → Authenticate email`);
  }

  return foundDKIM;
}

async function checkDMARC() {
  console.log(`\n${c.cyan}═══ DMARC Record Check ═══${c.reset}`);

  const dmarcDomain = `_dmarc.${FROM_DOMAIN}`;

  try {
    const records = await resolveTxt(dmarcDomain);
    const dmarcRecord = records.flat().find(r => r.startsWith('v=DMARC1'));

    if (dmarcRecord) {
      console.log(`${c.green}✓ DMARC Record found:${c.reset}`);
      console.log(`  ${c.dim}${dmarcRecord}${c.reset}`);

      // Parse DMARC policy
      const policyMatch = dmarcRecord.match(/p=(\w+)/);
      if (policyMatch) {
        const policy = policyMatch[1];
        if (policy === 'reject') {
          addResult('DNS', 'DMARC Record', 'pass', 'Policy: reject (strictest)');
          console.log(`  ${c.green}✓ Policy: reject - Maximum protection${c.reset}`);
        } else if (policy === 'quarantine') {
          addResult('DNS', 'DMARC Record', 'pass', 'Policy: quarantine');
          console.log(`  ${c.green}✓ Policy: quarantine - Good protection${c.reset}`);
        } else if (policy === 'none') {
          addResult('DNS', 'DMARC Record', 'warn', 'Policy: none (monitoring only)');
          console.log(`  ${c.yellow}⚠ Policy: none - Monitoring only, no protection${c.reset}`);
        }
      }

      // Check for reporting
      if (dmarcRecord.includes('rua=')) {
        console.log(`  ${c.green}✓ Aggregate reporting configured${c.reset}`);
      }

      return true;
    } else {
      addResult('DNS', 'DMARC Record', 'fail', 'No DMARC record found');
      console.log(`${c.red}✗ No DMARC record found!${c.reset}`);
      console.log(`\n${c.yellow}To fix, add this TXT record to _dmarc.${FROM_DOMAIN}:${c.reset}`);
      console.log(`  v=DMARC1; p=quarantine; rua=mailto:dmarc@${FROM_DOMAIN}`);
      return false;
    }
  } catch (error) {
    addResult('DNS', 'DMARC Record', 'fail', 'No DMARC record');
    console.log(`${c.red}✗ No DMARC record found${c.reset}`);
    console.log(`\n${c.yellow}Recommended DMARC record for _dmarc.${FROM_DOMAIN}:${c.reset}`);
    console.log(`  v=DMARC1; p=quarantine; rua=mailto:dmarc@${FROM_DOMAIN}`);
    return false;
  }
}

async function checkMX() {
  console.log(`\n${c.cyan}═══ MX Record Check ═══${c.reset}`);

  try {
    const records = await resolveMx(FROM_DOMAIN);

    if (records && records.length > 0) {
      console.log(`${c.green}✓ MX Records found:${c.reset}`);
      records.sort((a, b) => a.priority - b.priority);
      records.forEach(r => {
        console.log(`  ${c.dim}Priority ${r.priority}: ${r.exchange}${c.reset}`);
      });
      addResult('DNS', 'MX Records', 'pass', `${records.length} records found`);
      return true;
    } else {
      addResult('DNS', 'MX Records', 'fail', 'No MX records');
      console.log(`${c.red}✗ No MX records found${c.reset}`);
      return false;
    }
  } catch (error) {
    addResult('DNS', 'MX Records', 'fail', error.message);
    console.log(`${c.red}✗ Error: ${error.message}${c.reset}`);
    return false;
  }
}

// ==================== SMTP CONNECTION TEST ====================

async function testSMTPConnection() {
  console.log(`\n${c.cyan}═══ SMTP Connection Test ═══${c.reset}`);
  console.log(`Host: ${EMAIL_CONFIG.host || 'NOT SET'}`);
  console.log(`Port: ${EMAIL_CONFIG.port}`);
  console.log(`User: ${EMAIL_CONFIG.user || 'NOT SET'}`);
  console.log(`From: ${EMAIL_CONFIG.from}`);

  if (!EMAIL_CONFIG.host || !EMAIL_CONFIG.user || !EMAIL_CONFIG.pass) {
    addResult('SMTP', 'Configuration', 'fail', 'Missing credentials');
    console.log(`\n${c.red}✗ SMTP not fully configured!${c.reset}`);
    console.log(`${c.yellow}Required environment variables:${c.reset}`);
    console.log('  EMAIL_HOST (or SMTP_HOST)');
    console.log('  EMAIL_USER (or SMTP_USER)');
    console.log('  EMAIL_PASS (or SMTP_PASS)');
    console.log('  EMAIL_FROM (or SMTP_FROM)');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      secure: EMAIL_CONFIG.secure,
      auth: {
        user: EMAIL_CONFIG.user,
        pass: EMAIL_CONFIG.pass
      }
    });

    await transporter.verify();
    addResult('SMTP', 'Connection', 'pass', 'Connected successfully');
    console.log(`${c.green}✓ SMTP connection successful!${c.reset}`);
    return transporter;
  } catch (error) {
    addResult('SMTP', 'Connection', 'fail', error.message);
    console.log(`${c.red}✗ SMTP connection failed: ${error.message}${c.reset}`);

    // Common fixes
    if (error.message.includes('auth')) {
      console.log(`\n${c.yellow}Possible fixes:${c.reset}`);
      console.log('  1. Check username/password');
      console.log('  2. Enable "Less secure apps" for Gmail (not recommended)');
      console.log('  3. Use App Password for Gmail (recommended)');
      console.log('  4. Check 2FA settings');
    }

    return false;
  }
}

// ==================== SEND TEST EMAIL ====================

async function sendTestEmail(transporter, recipientEmail) {
  console.log(`\n${c.cyan}═══ Sending Test Email ═══${c.reset}`);
  console.log(`To: ${recipientEmail}`);

  const timestamp = new Date().toISOString();
  const testId = Math.random().toString(36).substring(7);

  const mailOptions = {
    from: EMAIL_CONFIG.from,
    to: recipientEmail,
    subject: `[JN Business System] E-Mail Deliverability Test - ${testId}`,
    text: `
JN Business System - E-Mail Deliverability Test
==========================================

Test ID: ${testId}
Timestamp: ${timestamp}
From Domain: ${FROM_DOMAIN}

If you received this email in your INBOX (not Spam):
✓ Your email configuration is working correctly!

If this landed in SPAM:
1. Check SPF record for ${FROM_DOMAIN}
2. Check DKIM configuration
3. Check DMARC policy
4. Add the sender to your contacts

Technical Details:
- SMTP Host: ${EMAIL_CONFIG.host}
- From Address: ${EMAIL_CONFIG.from}
- Port: ${EMAIL_CONFIG.port}
- Secure: ${EMAIL_CONFIG.secure}

---
Gesendet von JN Business System
https://jn-business-system.de
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">JN Business System</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">E-Mail Deliverability Test</p>
  </div>

  <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #166534; font-weight: 600;">
        ✓ Diese E-Mail wurde erfolgreich zugestellt!
      </p>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Test ID:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-family: monospace;">${testId}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Zeitstempel:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${timestamp}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Absender-Domain:</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${FROM_DOMAIN}</td>
      </tr>
    </table>

    <h3 style="color: #1f2937; margin-top: 30px;">Wenn diese E-Mail im SPAM gelandet ist:</h3>
    <ol style="color: #4b5563;">
      <li>SPF Record für ${FROM_DOMAIN} prüfen</li>
      <li>DKIM Konfiguration überprüfen</li>
      <li>DMARC Policy checken</li>
      <li>Absender zu Kontakten hinzufügen</li>
    </ol>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      Gesendet von JN Business System<br>
      <a href="https://jn-business-system.de" style="color: #4f46e5;">jn-business-system.de</a>
    </p>
  </div>
</body>
</html>
    `,
    headers: {
      'X-Test-ID': testId,
      'X-Mailer': 'JN Business System Deliverability Test',
      'List-Unsubscribe': `<mailto:unsubscribe@${FROM_DOMAIN}?subject=unsubscribe>`
    }
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`${c.green}✓ Test email sent successfully!${c.reset}`);
    console.log(`  Message ID: ${info.messageId}`);
    console.log(`  Test ID: ${testId}`);
    addResult('Email', `Test to ${recipientEmail}`, 'pass', `Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.log(`${c.red}✗ Failed to send: ${error.message}${c.reset}`);
    addResult('Email', `Test to ${recipientEmail}`, 'fail', error.message);
    return false;
  }
}

// ==================== MAIL-TESTER INSTRUCTIONS ====================

function showMailTesterInstructions() {
  console.log(`\n${c.cyan}═══ mail-tester.com Spam Score Check ═══${c.reset}`);
  console.log(`
${c.bold}Schritt-für-Schritt Anleitung:${c.reset}

1. Öffne ${c.blue}https://www.mail-tester.com${c.reset}

2. Du siehst eine Test-E-Mail-Adresse wie:
   ${c.dim}test-xyz123@srv1.mail-tester.com${c.reset}

3. Führe dieses Skript erneut aus mit dieser Adresse:
   ${c.green}node scripts/emailDeliverabilityTest.js test-xyz123@srv1.mail-tester.com${c.reset}

4. Klicke auf "Then check your score" auf mail-tester.com

${c.bold}Bewertung verstehen:${c.reset}
  ${c.green}10/10${c.reset} - Perfekt! E-Mails landen im Inbox
  ${c.green}8-9/10${c.reset} - Sehr gut, minor improvements möglich
  ${c.yellow}6-7/10${c.reset} - OK, aber SPF/DKIM/DMARC prüfen
  ${c.red}< 6/10${c.reset} - Kritisch! Viele E-Mails landen im Spam

${c.bold}Häufige Probleme & Fixes:${c.reset}
  • Missing SPF → DNS TXT Record hinzufügen
  • Missing DKIM → Bei E-Mail Provider aktivieren
  • Missing DMARC → DNS TXT Record hinzufügen
  • Blacklisted IP → Anderen SMTP Provider nutzen
  • HTML Issues → Templates vereinfachen
`);
}

// ==================== SUMMARY ====================

function printSummary() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`${c.bold}               EMAIL DELIVERABILITY REPORT${c.reset}`);
  console.log(`${'═'.repeat(60)}\n`);

  // Group by category
  const categories = {};
  results.tests.forEach(t => {
    if (!categories[t.category]) categories[t.category] = [];
    categories[t.category].push(t);
  });

  Object.entries(categories).forEach(([category, tests]) => {
    console.log(`${c.bold}${category}:${c.reset}`);
    tests.forEach(t => {
      const icon = t.status === 'pass' ? `${c.green}✓` : t.status === 'fail' ? `${c.red}✗` : `${c.yellow}⚠`;
      console.log(`  ${icon} ${t.test}${c.reset} ${t.details ? `(${t.details})` : ''}`);
    });
    console.log();
  });

  // Score
  const total = results.passed + results.failed + results.warnings;
  const score = Math.round((results.passed / total) * 100);

  console.log(`${'─'.repeat(60)}`);
  console.log(`${c.bold}Score: ${score >= 80 ? c.green : score >= 60 ? c.yellow : c.red}${score}%${c.reset} (${results.passed}/${total} passed)`);

  if (results.failed > 0) {
    console.log(`\n${c.red}${c.bold}⚠ KRITISCHE PROBLEME GEFUNDEN!${c.reset}`);
    console.log(`${c.red}Ohne Fixes landen 60-70% der E-Mails im Spam.${c.reset}\n`);

    console.log(`${c.bold}Empfohlene DNS Records für ${FROM_DOMAIN}:${c.reset}`);
    console.log(`
${c.cyan}SPF (TXT Record @ oder ${FROM_DOMAIN}):${c.reset}
  v=spf1 include:_spf.google.com include:spf.protection.outlook.com ~all

${c.cyan}DMARC (TXT Record _dmarc.${FROM_DOMAIN}):${c.reset}
  v=DMARC1; p=quarantine; rua=mailto:dmarc@${FROM_DOMAIN}

${c.cyan}DKIM:${c.reset}
  → Wird vom E-Mail Provider konfiguriert (Gmail, Outlook, etc.)
  → Google Workspace: Admin → Apps → Gmail → Authenticate email
`);
  } else if (results.warnings > 0) {
    console.log(`\n${c.yellow}⚠ Einige Verbesserungen empfohlen, aber kein kritisches Problem.${c.reset}`);
  } else {
    console.log(`\n${c.green}✓ Alle Tests bestanden! E-Mail Deliverability sieht gut aus.${c.reset}`);
  }
}

// ==================== MAIN ====================

async function main() {
  console.log(`\n${c.bold}${c.blue}╔════════════════════════════════════════════════════════════╗${c.reset}`);
  console.log(`${c.bold}${c.blue}║        JN AUTOMATION - EMAIL DELIVERABILITY TEST           ║${c.reset}`);
  console.log(`${c.bold}${c.blue}╚════════════════════════════════════════════════════════════╝${c.reset}\n`);

  console.log(`${c.dim}Domain: ${FROM_DOMAIN}${c.reset}`);
  console.log(`${c.dim}Date: ${new Date().toLocaleString('de-DE')}${c.reset}`);

  // DNS Checks
  await checkMX();
  await checkSPF();
  await checkDKIM();
  await checkDMARC();

  // SMTP Connection Test
  const transporter = await testSMTPConnection();

  // Send test email if recipient provided
  const testEmail = process.argv[2];

  if (testEmail && transporter) {
    await sendTestEmail(transporter, testEmail);

    // Detect provider for specific advice
    if (testEmail.includes('@gmail')) {
      console.log(`\n${c.yellow}Gmail Hinweis:${c.reset} Prüfe den Spam-Ordner und klicke "Kein Spam", um zukünftige E-Mails im Inbox zu erhalten.`);
    } else if (testEmail.includes('@outlook') || testEmail.includes('@hotmail')) {
      console.log(`\n${c.yellow}Outlook Hinweis:${c.reset} Prüfe den Junk-Ordner und füge den Absender zu "Sichere Absender" hinzu.`);
    } else if (testEmail.includes('@web.de') || testEmail.includes('@gmx')) {
      console.log(`\n${c.yellow}Web.de/GMX Hinweis:${c.reset} Prüfe den Spam-Ordner und füge den Absender zum Adressbuch hinzu.`);
    }
  } else if (!testEmail) {
    console.log(`\n${c.yellow}Tipp: Führe mit E-Mail-Adresse aus, um eine Test-E-Mail zu senden:${c.reset}`);
    console.log(`  node scripts/emailDeliverabilityTest.js deine@email.de`);
  }

  // Show mail-tester instructions
  showMailTesterInstructions();

  // Print summary
  printSummary();
}

main().catch(console.error);

