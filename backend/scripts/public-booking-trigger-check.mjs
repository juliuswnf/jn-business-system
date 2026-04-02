import 'dotenv/config';
import mongoose from 'mongoose';

const slug = 'demo-barber-starter';
const base = `http://localhost:3000/api/v1/bookings/public/s/${slug}`;
const email = `qa-booking-${Date.now()}@example.com`;

const target = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
const dateStr = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;

const salonRes = await fetch(base);
const salonJson = await salonRes.json();
const service = (salonJson.services || [])[0];

if (!service) {
  throw new Error('No public booking service found for test salon');
}

const slotsRes = await fetch(`${base}/available-slots`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ date: dateStr, serviceId: service._id })
});
const slotsJson = await slotsRes.json().catch(() => ({}));
const slot = (slotsJson.slots || [])[0] || '10:00';

const createRes = await fetch(`${base}/book`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    serviceId: service._id,
    bookingDate: { date: dateStr, time: slot },
    customerName: 'QA Booking Worker Check',
    customerEmail: email,
    customerPhone: '+491701234567'
  })
});

const createBody = await createRes.json().catch(() => ({}));

await new Promise((resolve) => setTimeout(resolve, 1500));

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const booking = await db.collection('bookings').findOne({ customerEmail: email });
const queueCountByBookingId = booking
  ? await db.collection('emailqueues').countDocuments({ bookingId: booking._id })
  : 0;
const queueCountByBooking = booking
  ? await db.collection('emailqueues').countDocuments({ booking: booking._id })
  : 0;
const queueSamples = booking
  ? await db.collection('emailqueues')
      .find({ $or: [{ bookingId: booking._id }, { booking: booking._id }] })
      .project({
        _id: 1,
        bookingId: 1,
        booking: 1,
        type: 1,
        status: 1,
        to: 1,
        recipient: 1,
        scheduledFor: 1,
        subject: 1
      })
      .limit(10)
      .toArray()
  : [];
await mongoose.disconnect();

console.log(JSON.stringify({
  email,
  createStatus: createRes.status,
  createBody,
  bookingFound: Boolean(booking),
  bookingId: booking?._id || null,
  bookingIdempotencyKey: booking?.idempotencyKey,
  queueCountByBookingId,
  queueCountByBooking,
  queueSamples
}, null, 2));
