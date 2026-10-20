const { startFixture } = require('./user-flow-fixture.cjs');
async function startAgentFixture({ port = 0 } = {}) {
  const f = await startFixture({ port, databaseName: 'cleanpro_agent_flow_test' });
  const { hashPassword } = require('../src/infrastructure/security/password');
  const password = 'AgentTest123!';
  const hash = await hashPassword(password);
  const agent = await f.models.Agent.create({ name: 'QA Agent One', email: 'agent.qa@example.test', phone: '+97455551001', passwordHash: hash, vehicle: 'QA Van', place: 'Al Sadd, Doha' });
  const otherAgent = await f.models.Agent.create({ name: 'QA Agent Two', email: 'agent.other@example.test', phone: '+97455551002', passwordHash: hash });
  const user = await f.models.User.create({ name: 'QA Customer', email: 'customer.qa@example.test', phone: '+97455552001', passwordHash: hash, isSpecial: true });
  const address = await f.models.Address.create({ userId: user.id, label: 'QA Home', line1: 'Flat 12, QA Building', line2: 'Al Sadd', city: 'Doha', lat: 25.2854, lng: 51.531 });
  const statuses = ['pending','accepted','in_progress','out_for_delivery','delivered','cancelled'];
  const orders = {};
  for (const [kind, model] of [['normal', f.models.Request], ['special', f.models.SpecialRequest]]) {
    orders[kind] = [];
    for (let i = 0; i < 60; i++) {
      const order = await model.create({ code: `QA-${kind}-${String(i).padStart(3,'0')}`, userId: user.id, agentId: agent.id, addressId: address.id, status: statuses[i % 6], total: 25+i, createdAt: new Date(Date.now() - (60-i)*60000), updatedAt: new Date(Date.now() - (60-i)*60000), note: `QA ${kind} order ${i}`, ...(kind === 'normal' ? { items: [{ name: 'QA Shirt', service: 'wash', qty: 2, price: 12.5 }] } : { deliveryType: 'fast' }) });
      orders[kind].push(order);
      if(kind === 'normal') await f.models.Notification.create({ userId: user.id, orderId: order.id });
    }
    orders[kind+'Other'] = await model.create({ code: `QA-${kind}-OTHER`, userId: user.id, agentId: otherAgent.id, addressId: address.id, total: 99 });
    orders[kind+'Unassigned'] = await model.create({ code: `QA-${kind}-UNASSIGNED`, userId: user.id, addressId: address.id, total: 99 });
  }
  return { ...f, agent, otherAgent, user, address, orders, password };
}
module.exports = { startAgentFixture };
if (require.main === module) startAgentFixture({ port: 4401 }).then(f=>console.log(`Agent QA API ready at ${f.base}; agent.qa@example.test / ${f.password}`)).catch(e=>{console.error(e);process.exit(1)});
