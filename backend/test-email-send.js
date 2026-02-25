/**
 * Test Email Send - Verify SMTP Connection and Email Templates
 * Run: node test-email-send.js
 */

import 'dotenv/config';
import emailService from './services/emailService.js';

const testEmail = async () => {
  try {
    console.log('🧪 Testing Email Service...\n');

    // Test recipient (change this to your email)
    const testRecipient = process.env.TEST_EMAIL || 'julius.wagenfeldt@gmail.com';

    console.log(`📧 Sending test email to: ${testRecipient}`);
    console.log(`📤 SMTP Host: ${process.env.EMAIL_HOST}`);
    console.log(`🔑 SMTP User: ${process.env.EMAIL_USER}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}\n`);

    // Test 1: Simple Text Email
    console.log('✅ Test 1: Simple Text Email');
    const result1 = await emailService.sendEmail({
      to: testRecipient,
      subject: '✅ Test Email - JN Business System',
      body: 'Dies ist eine Test-Email aus dem JN Business System.\n\nSMTP funktioniert! 🎉',
      type: 'test'
    });
    console.log(`   Message ID: ${result1.messageId}`);
    console.log('   ✅ SUCCESS\n');

    // Test 2: HTML Email (Welcome Template)
    console.log('✅ Test 2: HTML Welcome Email');
    const result2 = await emailService.sendWelcomeEmail(
      {
        email: testRecipient,
        name: 'Julius Test'
      },
      {
        name: 'Test Salon'
      }
    );
    console.log(`   Success: ${result2.success}`);
    console.log('   ✅ SUCCESS\n');

    // Test 3: Password Reset Email (from authController pattern)
    console.log('✅ Test 3: Password Reset Email');
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=TEST_TOKEN_12345`;
    const firstName = 'Julius';

    const result3 = await emailService.sendEmail({
      to: testRecipient,
      subject: '🔒 Passwort zurücksetzen - JN Business System',
      body: `Hallo ${firstName},\n\nSie haben eine Passwort-Zurücksetzung angefordert.\n\nKlicken Sie auf den folgenden Link:\n${resetUrl}\n\nDer Link ist 10 Minuten gültig.\n\nBei Fragen: support@jn-business-system.de`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8fafc;">
  <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px 30px; text-align: center;">
    <div style="font-size: 48px; margin-bottom: 10px;">🔒</div>
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Passwort zurücksetzen</h1>
  </div>
  <div style="background: white; padding: 40px 30px;">
    <p style="font-size: 16px; color: #1f2937; margin: 0 0 20px 0;">
      Hallo ${firstName},
    </p>
    <p style="color: #4b5563; margin: 0 0 30px 0;">
      Sie haben eine Passwort-Zurücksetzung für Ihr JN Business System Konto angefordert.
    </p>
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 600; font-size: 16px;">
        Passwort jetzt zurücksetzen
      </a>
    </div>
    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 30px;">
      <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 13px;">
        Falls der Button nicht funktioniert, kopieren Sie diesen Link:
      </p>
      <p style="color: #3b82f6; margin: 0; font-size: 12px; word-break: break-all;">
        ${resetUrl}
      </p>
    </div>
  </div>
  <div style="background: #1f2937; padding: 30px; text-align: center;">
    <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">
      Bei Fragen: <a href="mailto:support@jn-business-system.de" style="color: #60a5fa; text-decoration: none;">support@jn-business-system.de</a>
    </p>
    <p style="color: #6b7280; margin: 0; font-size: 12px;">
      JN Business System • Das Buchungssystem für Salons & Studios
    </p>
  </div>
</body>
</html>
      `,
      type: 'password_reset'
    });
    console.log(`   Message ID: ${result3.messageId}`);
    console.log('   ✅ SUCCESS\n');

    console.log('🎉 ALL EMAIL TESTS PASSED!');
    console.log('\n📬 Check your inbox:', testRecipient);
    console.log('   (Don\'t forget to check spam folder)\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ EMAIL TEST FAILED:', error.message);
    console.error('\n🔍 Debug Info:');
    console.error(`   SMTP Host: ${process.env.EMAIL_HOST}`);
    console.error(`   SMTP Port: ${process.env.EMAIL_PORT}`);
    console.error(`   SMTP User: ${process.env.EMAIL_USER}`);
    console.error(`   EMAIL_PASS set: ${process.env.EMAIL_PASS ? 'YES' : 'NO'}`);
    console.error('\n📋 Full Error:');
    console.error(error);
    process.exit(1);
  }
};

testEmail();
