/* eslint-disable no-console */
// Drives the API with real HTTP calls to create at least 2 docs in every
// collection. Run this only after `npm run seed` (so an admin exists) and
// while the API is running on $PORT (default 4000).
require('dotenv').config();
const env = require('../src/config/env');

const BASE = `http://127.0.0.1:${env.port}/api`;
let adminToken = null;

async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Bad response from ${path}: ${text.slice(0, 200)}`);
  }
  if (!json?.ok) {
    throw new Error(
      `${method} ${path} → ${res.status} · ${json?.error?.message || text}`
    );
  }
  return json.data;
}

async function login(role, email, password) {
  const data = await call(`/auth/login/${role}`, {
    method: 'POST',
    body: { email, password },
  });
  return { token: data.tokens.accessToken, profile: data.profile };
}

async function main() {
  console.log('▶ Logging in as admin');
  const a = await login('admin', 'admin@cleanpro.in', 'admin@1234');
  adminToken = a.token;

  console.log('▶ Creating services');
  const services = [];
  for (const s of [
    { key: 'wash', name: 'Wash & Fold', description: 'Machine wash, dried and neatly folded.', icon: 'water-outline' },
    { key: 'dry', name: 'Dry Cleaning', description: 'Professional dry cleaning for delicate fabrics.', icon: 'shirt-outline' },
    { key: 'iron', name: 'Iron Only', description: 'Crisp ironing for ready-to-wear clothes.', icon: 'flame-outline' },
    { key: 'premium', name: 'Premium Care', description: 'Premium handling for special garments.', icon: 'sparkles-outline' },
  ]) {
    services.push(await call('/services', { method: 'POST', body: s, token: adminToken }));
    console.log(`  · ${s.name}`);
  }

  console.log('▶ Creating items');
  const items = [];
  for (const it of [
    { name: 'Shirt', category: 'Men', prices: { wash: 30, dry: 60, iron: 15, premium: 80 } },
    { name: 'Pants', category: 'Men', prices: { wash: 40, dry: 80, iron: 20, premium: 100 } },
    { name: 'Saree', category: 'Women', prices: { wash: 80, dry: 180, iron: 30, premium: 220 } },
    { name: 'Bedsheet', category: 'Home', prices: { wash: 50, dry: 100, iron: 25 } },
  ]) {
    items.push(await call('/items', { method: 'POST', body: it, token: adminToken }));
    console.log(`  · ${it.name} (${it.category})`);
  }

  console.log('▶ Creating offers');
  for (const o of [
    {
      code: 'NEW20',
      label: '20% off first order',
      discount: '20%',
      minOrder: 200,
      validTill: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      code: 'BULK50',
      label: '₹50 off above ₹500',
      discount: '₹50',
      minOrder: 500,
      validTill: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]) {
    await call('/offers', { method: 'POST', body: o, token: adminToken });
    console.log(`  · ${o.code}`);
  }

  console.log('▶ Creating map locations');
  for (const m of [
    { name: 'Main hub — Marine Drive', place: '12 Marine Drive, Kochi, KL 682001', description: 'Primary laundry processing facility.', pickupRadius: '8 km' },
    { name: 'Edappally branch', place: '88 Panampilly Nagar, Kochi, KL 682036', description: 'Secondary residential facility.', pickupRadius: '5 km' },
  ]) {
    await call('/maps', { method: 'POST', body: m, token: adminToken });
    console.log(`  · ${m.name}`);
  }

  console.log('▶ Creating agents');
  const agentSeeds = [
    {
      name: 'Suresh K.',
      phone: '+919999988888',
      email: 'suresh@cleanpro.in',
      password: 'agent@1234',
      place: '12 Marine Drive, Kochi',
      zone: 'Kochi Central',
      vehicle: 'KL-07-AB-4521',
    },
    {
      name: 'Anand P.',
      phone: '+919876512345',
      email: 'anand@cleanpro.in',
      password: 'agent@1234',
      place: '88 Panampilly Nagar, Kochi',
      zone: 'Edappally',
      vehicle: 'KL-07-CD-7890',
    },
  ];
  const agents = [];
  for (const ag of agentSeeds) {
    agents.push(await call('/agents', { method: 'POST', body: ag, token: adminToken }));
    console.log(`  · ${ag.name}`);
  }

  console.log('▶ Registering customers');
  const userSeeds = [
    {
      name: 'Aisha K.',
      phone: '+919876543210',
      email: 'aisha@example.com',
      password: 'user@1234',
      addresses: [
        { label: 'Home', line: '12 Marine Drive', city: 'Kochi', pincode: '682001' },
        { label: 'Office', line: '34 Infopark', city: 'Kochi', pincode: '682030' },
      ],
    },
    {
      name: 'Rahul M.',
      phone: '+919812345678',
      email: 'rahul@example.com',
      password: 'user@1234',
      addresses: [
        { label: 'Home', line: '88 Panampilly Nagar', city: 'Kochi', pincode: '682036' },
        { label: 'Parents', line: '5 MG Road', city: 'Kochi', pincode: '682011' },
      ],
    },
  ];
  const userSessions = [];
  for (const u of userSeeds) {
    const reg = await call('/auth/register', {
      method: 'POST',
      body: { name: u.name, phone: u.phone, email: u.email, password: u.password },
    });
    const userToken = reg.tokens.accessToken;
    // attach addresses to that user — each is its own Address document now,
    // created through the dedicated endpoint.
    for (const addr of u.addresses) {
      await call('/users/me/addresses', {
        method: 'POST',
        body: addr,
        token: userToken,
      });
    }
    userSessions.push({ profile: reg.profile, token: userToken });
    console.log(`  · ${u.name} (+${u.addresses.length} addresses)`);
  }

  console.log('▶ Placing requests as each customer');
  const [u1, u2] = userSessions;
  const r1 = await call('/requests', {
    method: 'POST',
    body: {
      address: '12 Marine Drive, Kochi, 682001',
      items: [
        { name: 'Shirt', qty: 3, price: 30, service: 'wash' },
        { name: 'Saree', qty: 1, price: 180, service: 'dry' },
      ],
    },
    token: u1.token,
  });
  console.log(`  · ${u1.profile.name} → ${r1.code} (₹${r1.total})`);
  const r2 = await call('/requests', {
    method: 'POST',
    body: {
      address: '88 Panampilly Nagar, Kochi, 682036',
      items: [
        { name: 'Pants', qty: 2, price: 80, service: 'iron' },
        { name: 'Bedsheet', qty: 1, price: 50, service: 'wash' },
      ],
    },
    token: u2.token,
  });
  console.log(`  · ${u2.profile.name} → ${r2.code} (₹${r2.total})`);

  console.log('▶ Admin assigns');
  await call(`/requests/${r1.id}/assign`, {
    method: 'POST',
    body: { agentId: agents[0].id },
    token: adminToken,
  });
  await call(`/requests/${r2.id}/assign`, {
    method: 'POST',
    body: { agentId: agents[1].id },
    token: adminToken,
  });
  console.log('  · both assigned');

  console.log('▶ Agent #1 walks request through to delivered');
  const ag1 = await login('agent', agentSeeds[0].email, agentSeeds[0].password);
  for (const status of ['in_progress', 'out_for_delivery', 'delivered']) {
    await call(`/requests/${r1.id}/status`, {
      method: 'PATCH',
      body: { status },
      token: ag1.token,
    });
  }
  console.log('  · NTR... → delivered');

  console.log('▶ Customer submits a review');
  const rev = await call('/reviews', {
    method: 'POST',
    body: { requestId: r1.id, rating: 5, comment: 'Spotless and quick!' },
    token: u1.token,
  });
  await call(`/reviews/${rev.id}/status`, {
    method: 'PATCH',
    body: { status: 'approved' },
    token: adminToken,
  });
  console.log('  · review submitted and approved');

  console.log('\nDone. Verify in Atlas:');
  console.log(`  GET ${BASE}/users     (admin token)`);
  console.log(`  GET ${BASE}/agents    (admin token)`);
  console.log(`  GET ${BASE}/services`);
  console.log(`  GET ${BASE}/items`);
  console.log(`  GET ${BASE}/offers`);
  console.log(`  GET ${BASE}/maps      (admin token)`);
  console.log(`  GET ${BASE}/requests  (admin token)`);
  console.log(`  GET ${BASE}/reviews`);
}

main().catch((err) => {
  console.error('\n✘', err.message);
  process.exit(1);
});
