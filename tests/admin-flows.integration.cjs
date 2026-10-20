const assert = require('node:assert/strict');
const { test } = require('node:test');
const { startFixture } = require('./user-flow-fixture.cjs');

// Requires a disposable MongoDB on 127.0.0.1:27028. Never uses backend/.env.
test('Admin acceptance checklist with isolated example data', async t => {
  t.after(() => require('mongoose').disconnect());
  const f = await startFixture({ databaseName: 'cleanpro_admin_integration_test' });
  t.after(() => f.stop());
  const call = async (method, path, body, token, status = 200) => {
    if (method === 'POST' && ['/agents', '/admins'].includes(path) && body?.email) {
      const otp = await f.request('POST', `${path}/otp/request`, { email: body.email }, token);
      assert.equal(otp.status, 200, JSON.stringify(otp.body));
      body = { ...body, otpCode: f.mailbox.get(body.email) };
    }
    const r = await f.request(method, path, body, token);
    assert.equal(r.status, status, `${method} ${path}: ${JSON.stringify(r.body)}`);
    return r.body?.data;
  };
  const sessions = new Map();
  const login = async (role, email, password = 'Laundry123!') => {
    const { tokens } = await call('POST', `/auth/login/${role}`, { email, password });
    sessions.set(email, tokens);
    return tokens.accessToken;
  };
  const admin = await login('admin', 'admin@example.test', 'TestAdmin1!');
  const { hashPassword } = require('../src/infrastructure/security/password');
  const user = await f.models.User.create({ name: 'Aisha Admin QA', email: 'customer@example.test', phone: '+97455550123', passwordHash: await hashPassword('Laundry123!'), isSpecial: true });
  const customer = await login('user', user.email);
  const agents = [];
  for (let n = 1; n <= 2; n++) agents.push(await call('POST', '/agents', { name: `QA Agent ${n}`, email: `agent${n}@example.test`, phone: `+9745555012${n}`, password: 'Laundry123!', place: 'Al Sadd, Doha' }, admin, 201));
  const agentTokens = await Promise.all(agents.map(a => login('agent', a.email)));
  const address = await call('POST', '/users/me/addresses', { label: 'Home', line1: 'Flat 12 QA Building', line2: 'Al Sadd, Doha', city: 'Doha', lat: 25.2854, lng: 51.531 }, customer, 201);
  const regular = await call('POST', '/requests', { addressId: address.id, items: [{ name: 'Shirt', service: 'wash', qty: 2, price: 10 }], note: 'Admin QA regular pickup' }, customer, 201);
  const direct = await call('POST', '/special-requests', { addressId: address.id, deliveryType: 'fast', note: 'Admin QA direct pickup' }, customer, 201);

  await t.test('1: admin login succeeds; customer and agent credentials/tokens cannot access admin', async () => {
    for (const email of [user.email, agents[0].email]) await call('POST', '/auth/login/admin', { email, password: 'Laundry123!' }, null, 401);
    for (const token of [customer, agentTokens[0]]) await call('GET', '/admins', undefined, token, 403);
    await call('GET', '/admins', undefined, undefined, 401);
  });
  await t.test('3: admin lists and opens regular and direct orders', async () => {
    for (const [route, order] of [['requests', regular], ['special-requests', direct]]) {
      assert.ok((await call('GET', `/${route}`, undefined, admin)).some(x => x.id === order.id));
      const detail = await call('GET', `/${route}/${order.id}`, undefined, admin);
      assert.equal(detail.userId.id, user.id); assert.equal(detail.addressId.id, address.id);
    }
  });
  await t.test('4: assignment and reassignment propagate; previous agent loses access to both order types', async () => {
    for (const [route, order] of [['requests', regular], ['special-requests', direct]]) {
      for (let n = 0; n < 2; n++) {
        await call('POST', `/${route}/${order.id}/assign`, { agentId: agents[n].id }, admin);
        assert.ok((await call('GET', `/${route}/assigned`, undefined, agentTokens[n])).some(x => x.id === order.id));
        assert.equal((await call('GET', `/${route}/${order.id}`, undefined, agentTokens[n])).agentId.id, agents[n].id);
      }
      assert.ok(!(await call('GET', `/${route}/assigned`, undefined, agentTokens[0])).some(x => x.id === order.id));
      await call('GET', `/${route}/${order.id}`, undefined, agentTokens[0], 403);
      await call('PATCH', `/${route}/${order.id}/total`, { total: 1 }, agentTokens[0], 403);
    }
  });
  await t.test('5: admin price/status changes are returned consistently to customer and assigned agent', async () => {
    for (const [route, order, total] of [['requests', regular, 45], ['special-requests', direct, 75]]) {
      await call('PATCH', `/${route}/${order.id}/total`, { total }, admin);
      for (const status of ['accepted', 'in_progress', 'out_for_delivery', 'delivered']) {
        await call('PATCH', `/${route}/${order.id}/status`, { status }, admin);
        for (const token of [customer, agentTokens[1]]) {
          const detail = await call('GET', `/${route}/${order.id}`, undefined, token);
          assert.equal(detail.total, total); assert.equal(detail.status, status);
        }
      }
    }
  });
  await t.test('2a: date window and comparison include both stored order types', async () => {
    const date = new Date(); const from = new Date(date.getFullYear(), date.getMonth(), date.getDate()); const to = new Date(from); to.setDate(to.getDate()+1);
    const qs = new URLSearchParams({ from: from.toISOString(), to: to.toISOString(), prevFrom: '2000-01-01', prevTo: '2000-01-02' });
    assert.deepEqual(await call('GET', `/requests/stats?${qs}`, undefined, admin), { orders: 2, delivered: 2, revenue: 120, prevRevenue: 0 });
    assert.deepEqual(await call('GET', '/requests/stats?from=2000-01-01&to=2000-01-02', undefined, admin), { orders: 0, delivered: 0, revenue: 0, prevRevenue: 0 });
  });
  await t.test('2b: dashboard totals include regular AND direct orders (acceptance requirement)', async () => {
    const stats = await call('GET', '/requests/stats', undefined, admin);
    assert.deepEqual(stats, { orders: 2, delivered: 2, revenue: 120, prevRevenue: 0 });
  });
  await t.test('2c: date filtering includes start, excludes end, and calculates previous revenue', async () => {
    for (const [code, placedAt, status, total] of [
      ['QA-PREV', '2020-05-09T12:00:00Z', 'delivered', 10],
      ['QA-START', '2020-05-10T00:00:00Z', 'delivered', 20],
      ['QA-PENDING', '2020-05-10T12:00:00Z', 'pending', 99],
      ['QA-CANCEL', '2020-05-10T16:00:00Z', 'cancelled', 88],
      ['QA-END', '2020-05-11T00:00:00Z', 'delivered', 30],
    ]) await f.models.Request.create({ code, placedAt, status, total, agentId: agents[1].id, userId: user.id, addressId: address.id, items: [{name:'Shirt',qty:1,price:total,service:'wash'}] });
    for (const [code, placedAt, total] of [
      ['QA-DIRECT-PREV', '2020-05-09T12:00:00Z', 5],
      ['QA-DIRECT-START', '2020-05-10T00:00:00Z', 7],
      ['QA-DIRECT-END', '2020-05-11T00:00:00Z', 9],
    ]) await f.models.SpecialRequest.create({ code, placedAt, total, status: 'delivered', agentId: agents[0].id, userId: user.id, addressId: address.id });
    const query = '/requests/stats?from=2020-05-10T00:00:00Z&to=2020-05-11T00:00:00Z&prevFrom=2020-05-09T00:00:00Z&prevTo=2020-05-10T00:00:00Z';
    assert.deepEqual(await call('GET', query, undefined, admin), { orders: 4, delivered: 2, revenue: 27, prevRevenue: 15 });
    assert.deepEqual(await call('GET', query + '&agentId=' + agents[0].id, undefined, admin), { orders: 1, delivered: 1, revenue: 7, prevRevenue: 5 });
    assert.deepEqual(await call('GET', query + '&agentId=' + agents[1].id, undefined, admin), { orders: 3, delivered: 1, revenue: 20, prevRevenue: 10 });
  });
  await t.test('6: service and item create/edit/visibility propagate to public customer catalog', async () => {
    const service = await call('POST', '/services', { key: 'qa_dry', name: 'QA Dry Clean' }, admin, 201);
    await call('PATCH', `/services/${service.id}`, { name: 'QA Premium Dry Clean' }, admin);
    assert.equal((await call('GET', '/services')).find(s => s.id === service.id).name, 'QA Premium Dry Clean');
    const item = await call('POST', '/items', { name: 'QA Jacket', category: 'Men', prices: { qa_dry: 25 } }, admin, 201);
    await call('PATCH', `/items/${item.id}`, { prices: { qa_dry: 30 } }, admin);
    assert.equal((await call('GET', '/items')).find(x => x.id === item.id).prices.qa_dry, 30);
    for (const [route, id] of [['items', item.id], ['services', service.id]]) {
      await call('PATCH', `/${route}/${id}`, { active: false }, admin);
      assert.ok(!(await call('GET', `/${route}`)).some(x => x.id === id));
      await call('DELETE', `/${route}/${id}`, undefined, admin, 204);
    }
  });
  await t.test('7: offers create, deactivate, activate, edit and delete on admin/customer endpoints', async () => {
    const offer = await call('POST', '/offers', { code: 'QA20', label: 'QA Offer', discount: '20%', active: true }, admin, 201);
    assert.ok((await call('GET', '/offers')).some(x => x.id === offer.id));
    await call('PATCH', `/offers/${offer.id}`, { active: false }, admin);
    assert.ok(!(await call('GET', '/offers')).some(x => x.id === offer.id));
    assert.ok((await call('GET', '/offers/admin', undefined, admin)).some(x => x.id === offer.id));
    await call('PATCH', `/offers/${offer.id}`, { active: true, discount: '25%' }, admin);
    assert.equal((await call('GET', '/offers')).find(x => x.id === offer.id).discount, '25%');
    await call('DELETE', `/offers/${offer.id}`, undefined, admin, 204);
    assert.ok(!(await call('GET', '/offers')).some(x => x.id === offer.id));
  });
  await t.test('8a: account CRUD, blocked login rejection and self-admin deletion prevention', async () => {
    await call('PATCH', `/agents/${agents[0].id}`, { name: 'QA Renamed Agent', status: 'blocked' }, admin);
    await call('POST', '/auth/login/agent', { email: agents[0].email, password: 'Laundry123!' }, null, 403);
    await call('PATCH', `/users/${user.id}/status`, { status: 'blocked' }, admin);
    await call('POST', '/auth/login/user', { email: user.email, password: 'Laundry123!' }, null, 403);
    await call('PATCH', `/users/${user.id}/status`, { status: 'active' }, admin);
    await call('PATCH', `/users/${user.id}/special`, { isSpecial: false }, admin);
    assert.equal((await call('GET', `/users/${user.id}`, undefined, admin)).isSpecial, false);
    const second = await call('POST', '/admins', { name: 'QA Second Admin', email: 'second@example.test', password: 'Laundry123!' }, admin, 201);
    await call('PATCH', `/admins/${second.id}`, { name: 'QA Edited Admin' }, admin);
    await login('admin', 'second@example.test');
    await call('DELETE', `/admins/${f.admin.id}`, undefined, admin, 400);
    await call('DELETE', `/admins/${second.id}`, undefined, admin, 204);
  });
  await t.test('8b: already-issued customer token is rejected immediately after blocking', async () => {
    await call('PATCH', `/users/${user.id}/status`, { status: 'blocked' }, admin);
    const r = await f.request('GET', '/requests/mine', undefined, customer);
    assert.ok([401,403].includes(r.status), `Blocked customer retained protected access: HTTP ${r.status}`);
    await call('POST', '/auth/refresh', { refreshToken: sessions.get(user.email).refreshToken }, null, 401);
  });
  await t.test('8c: already-issued agent token is rejected immediately after blocking', async () => {
    const r = await f.request('GET', '/requests/assigned', undefined, agentTokens[0]);
    assert.ok([401,403].includes(r.status), `Blocked agent retained protected access: HTTP ${r.status}`);
    await call('POST', '/auth/refresh', { refreshToken: sessions.get(agents[0].email).refreshToken }, null, 401);
  });
  await t.test('8d: deleted admin token cannot manage accounts', async () => {
    const a = await call('POST', '/admins', { name: 'QA Delete Admin', email: 'deleted@example.test', password: 'Laundry123!' }, admin, 201);
    const token = await login('admin', 'deleted@example.test');
    await call('DELETE', `/admins/${a.id}`, undefined, admin, 204);
    const r = await f.request('GET', '/admins', undefined, token);
    assert.ok([401,403].includes(r.status), `Deleted admin retained protected access: HTTP ${r.status}`);
    await call('POST', '/auth/refresh', { refreshToken: sessions.get(a.email).refreshToken }, null, 401);
  });
  await t.test('8f: self-deactivated customer loses protected access and refresh capability', async () => {
    await call('PATCH', `/users/${user.id}/status`, { status: 'active' }, admin);
    const token = await login('user', user.email);
    await call('POST', '/users/me/deactivate', {}, token);
    await call('GET', '/requests/mine', undefined, token, 403);
    await call('POST', '/auth/refresh', { refreshToken: sessions.get(user.email).refreshToken }, null, 401);
  });
  await t.test('8e: admin deletes example customer and agent', async () => {
    await call('DELETE', `/agents/${agents[0].id}`, undefined, admin, 204);
    await call('GET', `/agents/${agents[0].id}`, undefined, admin, 404);
    await call('DELETE', `/users/${user.id}`, undefined, admin);
    await call('GET', `/users/${user.id}`, undefined, admin, 404);
  });
});
