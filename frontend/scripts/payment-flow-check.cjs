const { request } = require('@playwright/test');

const API_BASE = 'http://localhost:3000/api/v1';
const SALON_SLUG = 'demo-barber-starter';

async function createPublicBooking(api) {
  const email = `qa-payment-${Date.now()}@example.com`;
  const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const date = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;

  const salonRes = await api.get(`bookings/public/s/${SALON_SLUG}`);
  const salonJson = await salonRes.json();
  const service = (salonJson.services || [])[0];
  if (!service) {
    throw new Error('No service found for payment booking setup');
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
      customerName: 'QA Payment Flow',
      customerEmail: email,
      customerPhone: '+491701234567'
    },
    headers: { 'Content-Type': 'application/json' }
  });

  const bookingJson = await bookingRes.json().catch(() => ({}));
  if (bookingRes.status() !== 201 || !bookingJson.success) {
    throw new Error(`Booking setup failed: HTTP ${bookingRes.status()} body=${JSON.stringify(bookingJson).slice(0, 250)}`);
  }

  return {
    bookingId: bookingJson.booking.id,
    email,
    service: bookingJson.booking.service
  };
}

async function loginAndGetCsrf(authCtx) {
  const loginRes = await authCtx.post('auth/login', {
    data: {
      email: 'barber.starter@demo.jn-business-system.de',
      password: 'Demo@12345'
    },
    headers: { 'Content-Type': 'application/json' }
  });

  const loginJson = await loginRes.json().catch(() => ({}));
  if (loginRes.status() !== 200 || !loginJson.success) {
    throw new Error(`Owner login failed: HTTP ${loginRes.status()} body=${JSON.stringify(loginJson).slice(0, 220)}`);
  }

  const state = await authCtx.storageState();
  const tokenCookie = state.cookies.find((c) => c.name === 'XSRF-TOKEN');
  if (!tokenCookie || !tokenCookie.value) {
    throw new Error('Missing XSRF-TOKEN cookie after login');
  }

  return tokenCookie.value;
}

(async () => {
  const api = await request.newContext({ baseURL: API_BASE });
  const auth = await request.newContext({ baseURL: API_BASE });

  try {
    const booking = await createPublicBooking(api);

    const csrf1 = await loginAndGetCsrf(auth);
    const intentRes = await auth.post('payments/intent', {
      data: { bookingId: booking.bookingId, amount: 19.99 },
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf1
      }
    });
    const intentJson = await intentRes.json().catch(() => ({}));

    let processStatus = null;
    let processJson = null;

    if (intentRes.status() === 200 && intentJson.paymentIntentId) {
      const csrf2 = await loginAndGetCsrf(auth);
      const processRes = await auth.post('payments/process', {
        data: {
          bookingId: booking.bookingId,
          paymentIntentId: intentJson.paymentIntentId,
          amount: 19.99,
          paymentMethod: 'card'
        },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf2
        }
      });
      processStatus = processRes.status();
      processJson = await processRes.json().catch(() => ({}));
    }

    console.log(JSON.stringify({
      booking,
      intentStatus: intentRes.status(),
      intentBody: intentJson,
      processStatus,
      processBody: processJson
    }, null, 2));

    const passIntent = intentRes.status() === 200 && intentJson.success === true && Boolean(intentJson.paymentIntentId);
    const passFailurePath = processStatus === 400 && /Payment not successful/i.test(processJson?.message || '');

    process.exit(passIntent && passFailurePath ? 0 : 1);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  } finally {
    await api.dispose();
    await auth.dispose();
  }
})();
