const assert = require('node:assert/strict');
const { test } = require('node:test');
const { startFixture } = require('./user-flow-fixture.cjs');

test('Clean Pro user journeys with an isolated MongoDB and captured OTP email', async t => {
  t.after(() => require('mongoose').disconnect());
  const f = await startFixture({ databaseName: 'cleanpro_user_api_test' });
  t.after(() => f.stop());
  let tokens, address, order, adminToken;
  const signup = { name: 'Aisha QA', email: 'aisha@example.test', phone: '+97455550123', password: 'Laundry123!' };
  const call = async (method, path, body, token, status = 200) => {
    const r = await f.request(method, path, body, token);
    assert.equal(r.status, status, `${method} ${path}: ${JSON.stringify(r.body)}`);
    return r.body.data;
  };
  await t.test('1: signup rejects unverified email, verifies OTP, logs in and revokes logout session', async () => {
    await call('POST', '/auth/register', signup, null, 400);
    await call('POST', '/auth/availability', { email: signup.email });
    const code = f.mailbox.get(signup.email);
    assert.match(code, /^\d{6}$/);
    await call('POST', '/auth/otp/verify', { email: signup.email, code: code === '000000' ? '111111' : '000000' }, null, 400);
    await call('POST', '/auth/otp/verify', { email: signup.email, code });
    const registration = await call('POST', '/auth/register', signup, null, 201);
    assert.equal(registration.profile.name, signup.name);
    assert.equal(registration.profile.passwordHash, undefined);
    const login = await call('POST', '/auth/login/user', { email: signup.email, password: signup.password });
    tokens = login.tokens;
    assert.equal((await call('GET', '/auth/me', undefined, tokens.accessToken)).role, 'user');
    await call('POST', '/auth/logout', { refreshToken: tokens.refreshToken });
    await call('POST', '/auth/refresh', { refreshToken: tokens.refreshToken }, null, 401);
    tokens = (await call('POST', '/auth/login/user', { email: signup.email, password: signup.password })).tokens;
  });
  await t.test('2: empty, malformed, weak-password and incorrect-credential errors are explicit', async () => {
    for (const body of [{}, { email: 'wrong', password: '' }, { email: signup.email, password: 'Wrong123!' }]) {
      const r = await f.request('POST', '/auth/login/user', body);
      assert.ok([400, 401].includes(r.status));
      assert.ok(r.body.error.message);
      if (r.status === 400) assert.ok(r.body.error.details);
    }
    await call('POST', '/auth/register', { ...signup, password: 'weak' }, null, 400);
  });
  await t.test('3: verified reset changes password, rejects old password and revokes existing refresh sessions', async () => {
    await call('POST', '/auth/password/reset', { email: signup.email, password: 'FreshLaundry456!' }, null, 400);
    await call('POST', '/auth/otp/request', { email: signup.email, purpose: 'reset' });
    await call('POST', '/auth/otp/verify', { email: signup.email, code: f.mailbox.get(signup.email) });
    await call('POST', '/auth/password/reset', { email: signup.email, password: 'FreshLaundry456!' });
    await call('POST', '/auth/login/user', { email: signup.email, password: signup.password }, null, 401);
    await call('POST', '/auth/refresh', { refreshToken: tokens.refreshToken }, null, 401);
    tokens = (await call('POST', '/auth/login/user', { email: signup.email, password: 'FreshLaundry456!' })).tokens;
  });
  await t.test('4: catalog returns active services and correct item prices', async () => {
    const services = await call('GET', '/services');
    assert.ok(services.some(s => s.key === 'wash'));
    const items = await call('GET', '/items');
    assert.equal(items.find(i => i.name === 'Shirt').prices.wash, 10);
    assert.equal(items.find(i => i.name === 'Trousers').prices.wash, 15);
    assert.ok(!items.some(i => i.name === 'Hidden test item'));
  });
  await t.test('6: save/edit/select addresses and reject another user’s address', async () => {
    address = await call('POST', '/users/me/addresses', { label: 'Home', line1: 'Flat 12, QA Building', line2: 'Al Sadd, Doha', city: 'Doha', phone: signup.phone, lat: 25.2854, lng: 51.531, isDefault: true }, tokens.accessToken, 201);
    address = await call('PATCH', `/users/me/addresses/${address.id}`, { line1: 'Flat 14, QA Building' }, tokens.accessToken);
    assert.equal(address.line1, 'Flat 14, QA Building');
    const office = await call('POST', '/users/me/addresses', { label: 'Office', line1: 'Office 5', line2: 'West Bay, Doha', lat: 25.32, lng: 51.53 }, tokens.accessToken, 201);
    const addresses = await call('GET', '/users/me/addresses', undefined, tokens.accessToken);
    assert.equal(addresses.length, 2);
    assert.ok(addresses.some(a => a.id === office.id));
    const foreign = await f.models.Address.create({ userId: new (require('mongoose').Types.ObjectId)(), line1: 'Not yours' });
    await call('PATCH', `/users/me/addresses/${foreign.id}`, { line1: 'Overwrite' }, tokens.accessToken, 404);
  });
  await t.test('5: place order with quantities, selected address, notes and QAR 35 total; reject invalid orders', async () => {
    const payload = { addressId: address.id, paymentMethod: 'cod', note: 'Call before pickup', items: [{ name: 'Shirt', service: 'wash', qty: 2, price: 10 }, { name: 'Trousers', service: 'wash', qty: 1, price: 15 }] };
    await call('POST', '/requests', { ...payload, items: [] }, tokens.accessToken, 400);
    order = await call('POST', '/requests', payload, tokens.accessToken, 201);
    assert.equal(order.total, 35); assert.equal(order.items.length, 2);
    assert.equal(order.addressId.id, address.id); assert.equal(order.note, payload.note);
    assert.equal(order.status, 'pending');
  });
  await t.test('5b: fast delivery preserves the checkout surcharge in the saved total', async () => {
    const express = await call('POST', '/requests', {
      addressId: address.id, paymentMethod: 'cod', delivery: 'fast',
      items: [{ name: 'Shirt', service: 'wash', qty: 2, price: 10 }, { name: 'Trousers', service: 'wash', qty: 1, price: 15 }],
    }, tokens.accessToken, 201);
    assert.equal(express.total, 85, 'QAR 35 clothes + QAR 50 fast delivery');
    assert.equal(express.delivery, 'fast');
    assert.equal(express.deliveryFee, 50);
  });
  await t.test('7: status transitions appear in user history and notifications', async () => {
    // Login uses the real seeded test admin to move this user’s order forward.
    adminToken = (await call('POST', '/auth/login/admin', { email: 'admin@example.test', password: 'TestAdmin1!' })).tokens.accessToken;
    assert.equal((await call('GET', '/notifications/mine', undefined, tokens.accessToken)).length, 0);
    for (const status of ['accepted', 'in_progress', 'out_for_delivery', 'delivered']) {
      await call('PATCH', `/requests/${order.id}/status`, { status }, adminToken);
      const history = await call('GET', '/requests/mine', undefined, tokens.accessToken);
      assert.equal(history.find(o => o.id === order.id).status, status);
      const notifications = await call('GET', '/notifications/mine', undefined, tokens.accessToken);
      assert.equal(notifications.find(n => n.orderId.id === order.id).orderId.status, status);
    }
  });
  await t.test('8: order details preserve items, quantities, price, address and final status; reject unauthorized access', async () => {
    const detail = await call('GET', `/requests/${order.id}`, undefined, tokens.accessToken);
    assert.equal(detail.total, 35); assert.equal(detail.items[0].qty, 2);
    assert.equal(detail.addressId.line1, 'Flat 14, QA Building');
    assert.equal(detail.status, 'delivered');
    await call('GET', `/requests/${order.id}`, undefined, null, 401);
  });
  await t.test('10: profile update persists; completed order can be reviewed once', async () => {
    await call('PATCH', '/users/me', { name: 'Aisha Updated QA', avatar: 'https://example.test/avatar.png' }, tokens.accessToken);
    const profile = await call('GET', '/users/me', undefined, tokens.accessToken);
    assert.equal(profile.name, 'Aisha Updated QA');
    const review = { requestId: order.id, rating: 5, comment: 'QA: clean clothes and on-time delivery.' };
    const pending = await f.models.Request.findOne({ status: 'pending' });
    await call('POST', '/reviews', { ...review, requestId: pending.id }, tokens.accessToken, 400);
    const foreignOrder = await f.models.Request.create({
      code: 'QA-FOREIGN-ORDER', userId: new (require('mongoose').Types.ObjectId)(),
      addressId: address.id, items: order.items, total: 35, status: 'delivered',
    });
    await call('POST', '/reviews', { ...review, requestId: foreignOrder.id }, tokens.accessToken, 403);
    const created = await call('POST', '/reviews', review, tokens.accessToken, 201);
    assert.equal(created.rating, 5);
    await call('POST', '/reviews', review, tokens.accessToken, 409);
    assert.ok((await call('GET', '/reviews/mine', undefined, tokens.accessToken)).some(r => r.id === created.id));
  });
});
