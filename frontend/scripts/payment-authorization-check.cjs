const { request } = require('@playwright/test');

const API_BASE = 'http://localhost:3000/api/v1';
const SALON_SLUG = 'demo-barber-starter';

async function createStarterBooking(api) {
  const email = `qa-payment-auth-${Date.now()}@example.com`;
  const future = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
  const date = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;

  const salonRes = await api.get(`bookings/public/s/${SALON_SLUG}`);
  const salonJson = await salonRes.json();
  const service = (salonJson.services || [])[0];
  if (!service) {
    throw new Error('No service for starter salon booking setup');
  }

  const slotsRes = await api.post(`bookings/public/s/${SALON_SLUG}/available-slots`, {
    data: { date, serviceId: service._id },
    headers: { 'Content-Type': 'application/json' }
  });
  const slotsJson = await slotsRes.json().catch(() => ({}));
  const slot = (slotsJson.slots || [])[0] || '10:00';

  const bookingRes = await api.post(`bookings/public/s/${SALON_SLUG}/book`, {
    data: {
      serviceId: service._id,
      bookingDate: { date, time: slot },
      customerName: 'QA Payment Auth Check',
      customerEmail: email,
      customerPhone: '+491701234567'
    },
    headers: { 'Content-Type': 'application/json' }
  });

  const bookingJson = await bookingRes.json().catch(() => ({}));
  if (bookingRes.status() !== 201 || !bookingJson.success) {
    throw new Error(`Booking setup failed: HTTP ${bookingRes.status()} body=${JSON.stringify(bookingJson).slice(0, 240)}`);
  }

  return bookingJson.booking.id;
}

async function loginAndCsrf(authCtx, email, password) {
  const res = await authCtx.post('auth/login', {
    data: { email, password },
    headers: { 'Content-Type': 'application/json' }
  });
  const body = await res.json().catch(() => ({}));
  if (res.status() !== 200 || !body.success) {
    throw new Error(`Login failed for ${email}: HTTP ${res.status()} body=${JSON.stringify(body).slice(0, 200)}`);
  }
  const state = await authCtx.storageState();
  const token = state.cookies.find((c) => c.name === 'XSRF-TOKEN')?.value;
  if (!token) {
    throw new Error(`Missing XSRF token for ${email}`);
  }
  return token;
}

(async () => {
  const api = await request.newContext({ baseURL: API_BASE });
  const wrongOwner = await request.newContext({ baseURL: API_BASE });

  try {
    const bookingId = await createStarterBooking(api);
    const csrf = await loginAndCsrf(wrongOwner, 'barber.professional@demo.jn-business-system.de', 'Demo@12345');

    const intentRes = await wrongOwner.post('payments/intent', {
      data: { bookingId, amount: 29.99 },
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf
      }
    });

    const intentBody = await intentRes.json().catch(() => ({}));

    console.log(JSON.stringify({
      bookingId,
      status: intentRes.status(),
      body: intentBody
    }, null, 2));

    const pass = intentRes.status() === 403;
    process.exit(pass ? 0 : 1);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  } finally {
    await api.dispose();
    await wrongOwner.dispose();
  }
})();
