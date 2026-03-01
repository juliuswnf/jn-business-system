const mongoose = require('mongoose');

async function fix() {
  await mongoose.connect('mongodb://localhost:27017/jn-automation');

  // Direkter Update
  const result = await mongoose.connection.db.collection('users').updateOne(
    { email: 'julius@jn-automation.de' },
    { $set: { twoFactorSecret: 'JBSWY3DPEHPK3PXP', twoFactorEnabled: true } }
  );
  console.log('Updated:', result.modifiedCount);

  // Verifizieren
  const user = await mongoose.connection.db.collection('users').findOne({ email: 'julius@jn-automation.de' });
  console.log('New twoFactorSecret:', user.twoFactorSecret);
  console.log('twoFactorEnabled:', user.twoFactorEnabled);

  await mongoose.disconnect();
}

fix().catch(console.error);
