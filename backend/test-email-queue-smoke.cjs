/**
 * Smoke Test für Email Queue Worker
 * Erstellt Test-Emails und prüft ob Worker sie verarbeitet
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const emailQueueSchema = new mongoose.Schema({
  to: String,
  subject: String,
  body: String,
  html: String,
  type: String,
  scheduledFor: Date,
  sentAt: Date,
  status: String,
  attempts: Number,
  error: String
}, { timestamps: true });

const EmailQueue = mongoose.model('EmailQueue', emailQueueSchema);

const runSmokeTest = async () => {
  try {
    console.log('\n🧪 EMAIL QUEUE WORKER SMOKE TEST\n');
    console.log('=' .repeat(50));

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Test 1: Create test email that should be sent immediately
    console.log('📧 TEST 1: Creating immediate test email...');
    const testEmail1 = await EmailQueue.create({
      to: 'test@example.com',
      subject: 'Smoke Test Email - Immediate',
      body: 'This is a smoke test email that should be processed immediately.',
      html: '<p>This is a smoke test email that should be processed immediately.</p>',
      type: 'notification',
      scheduledFor: new Date(), // Send now
      status: 'pending'
    });
    console.log(`✅ Created test email: ${testEmail1._id}`);

    // Test 2: Create email scheduled for future
    console.log('\n📧 TEST 2: Creating future scheduled email...');
    const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    const testEmail2 = await EmailQueue.create({
      to: 'future@example.com',
      subject: 'Smoke Test Email - Future',
      body: 'This email is scheduled for 1 hour from now.',
      html: '<p>This email is scheduled for 1 hour from now.</p>',
      type: 'reminder',
      scheduledFor: futureDate,
      status: 'pending'
    });
    console.log(`✅ Created scheduled email: ${testEmail2._id} (scheduled for ${futureDate.toISOString()})`);

    // Check pending emails
    console.log('\n📊 QUEUE STATUS:');
    const pendingCount = await EmailQueue.countDocuments({ status: 'pending' });
    const sentCount = await EmailQueue.countDocuments({ status: 'sent' });
    const failedCount = await EmailQueue.countDocuments({ status: 'failed' });

    console.log(`   Pending: ${pendingCount}`);
    console.log(`   Sent: ${sentCount}`);
    console.log(`   Failed: ${failedCount}`);

    console.log('\n✅ Smoke test emails created successfully!');
    console.log('\n⏳ Wait 60 seconds for worker to process...\n');
    console.log('Expected behavior:');
    console.log('  1. Email worker picks up testEmail1 (scheduled for now)');
    console.log('  2. Processes it (status → sending → sent or failed)');
    console.log('  3. Logs success/failure with details');
    console.log('  4. testEmail2 should stay pending (future scheduled)');
    console.log('\n💡 Check backend logs for:');
    console.log('  - "📧 Processing X pending emails..."');
    console.log('  - "✅ Email sent successfully" or "❌ Email send failed"');
    console.log('  - Error details if SMTP fails');

    console.log('\n🔍 To verify results after 60s:');
    console.log('  Run: node backend/test-email-queue-status.cjs\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Smoke test failed:', error);
    process.exit(1);
  }
};

runSmokeTest();
