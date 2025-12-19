/**
 * Test Error Handling in Email Queue Worker
 * Creates an email that will fail and verifies error logging
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
  maxAttempts: Number,
  error: Object
}, { timestamps: true });

const EmailQueue = mongoose.model('EmailQueue', emailQueueSchema);

const testErrorHandling = async () => {
  try {
    console.log('\n🧪 ERROR HANDLING TEST\n');
    console.log('=' .repeat(50));

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Create email with missing required fields (will cause validation error)
    console.log('📧 Creating email with intentional error trigger...');
    const testEmail = await EmailQueue.create({
      to: 'error-test@example.com',
      subject: 'Error Test - Should Fail on Send',
      body: null, // Missing body will cause email service to fail
      html: null, // Missing html too
      type: 'notification',
      scheduledFor: new Date(), // Send now
      status: 'pending',
      maxAttempts: 2 // Limit retries for faster testing
    });
    console.log(`✅ Created error test email: ${testEmail._id}`);

    console.log('\n⏳ Wait 60 seconds for worker to process...\n');
    console.log('Expected behavior:');
    console.log('  1. Worker picks up email');
    console.log('  2. Attempt to send fails (invalid email format)');
    console.log('  3. Error is logged with full stack trace');
    console.log('  4. Email is retried with exponential backoff');
    console.log('  5. After maxAttempts (2), status → failed');
    console.log('  6. Worker continues processing (no crash)');

    console.log('\n💡 Check backend logs for:');
    console.log('  - "❌ Failed to send email..."');
    console.log('  - "Error stack: ..." (full stack trace)');
    console.log('  - "🔄 Scheduled retry #1..." (exponential backoff)');
    console.log('  - "💀 Email ... failed after 2 attempts - PERMANENT FAILURE"');
    console.log('  - Next tick continues without crash');

    console.log('\n🔍 To verify results:');
    console.log('  Run: node backend/test-email-queue-status.cjs\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testErrorHandling();
