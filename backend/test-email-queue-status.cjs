/**
 * Check Email Queue Status
 * Zeigt aktuelle Queue Status an
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const emailQueueSchema = new mongoose.Schema({
  to: String,
  subject: String,
  type: String,
  scheduledFor: Date,
  sentAt: Date,
  status: String,
  attempts: Number,
  error: String
}, { timestamps: true });

const EmailQueue = mongoose.model('EmailQueue', emailQueueSchema);

const checkStatus = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('\n📊 EMAIL QUEUE STATUS\n');
    console.log('='.repeat(50));

    const allEmails = await EmailQueue.find({}).sort({ createdAt: -1 }).limit(10);
    
    console.log(`\n📧 Last 10 emails in queue:\n`);
    
    for (const email of allEmails) {
      const statusEmoji = 
        email.status === 'sent' ? '✅' :
        email.status === 'pending' ? '⏳' :
        email.status === 'failed' ? '❌' :
        email.status === 'sending' ? '📤' : '❓';
      
      console.log(`${statusEmoji} ${email.status.toUpperCase().padEnd(10)} | ${email.type.padEnd(12)} | ${email.to}`);
      console.log(`   Subject: ${email.subject}`);
      console.log(`   Scheduled: ${email.scheduledFor.toISOString()}`);
      if (email.sentAt) console.log(`   Sent: ${email.sentAt.toISOString()}`);
      if (email.error) console.log(`   Error: ${email.error}`);
      console.log(`   Attempts: ${email.attempts}`);
      console.log('');
    }

    // Summary
    const summary = await EmailQueue.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📈 SUMMARY:');
    summary.forEach(s => {
      console.log(`   ${s._id}: ${s.count}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkStatus();
