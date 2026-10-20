const path = require('node:path');
const crypto = require('node:crypto');

async function startFixture({ port = 0, reset = true, databaseName = 'cleanpro_user_flow_test' } = {}) {
  if (!['cleanpro_user_flow_test', 'cleanpro_user_api_test', 'cleanpro_agent_flow_test', 'cleanpro_admin_flow_test', 'cleanpro_admin_integration_test', 'cleanpro_admin_retest_browser'].includes(databaseName)) throw Error('Unsafe test database');
  // All settings are local test values; never load the development database.
  Object.assign(process.env, {
    NODE_ENV: 'test', MONGO_URI: `mongodb://127.0.0.1:27028/${databaseName}`,
    JWT_ACCESS_SECRET: 'cleanpro-test-access-only-123456789',
    JWT_REFRESH_SECRET: 'cleanpro-test-refresh-only-123456789',
    EMAIL_USER: 'local-test@example.test', EMAIL_APP_PASSWORD: 'local-test-only',
    LOG_LEVEL: 'silent', BCRYPT_ROUNDS: '4', SENTRY_DSN: '',
  });
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  const mailbox = new Map();
  const nodemailer = require('nodemailer');
  nodemailer.createTransport = () => ({ sendMail: async mail => {
    mailbox.set(mail.to, mail.text.match(/\b\d{6}\b/)[0]);
    return { messageId: crypto.randomUUID() };
  }});
  const createApp = require('../src/app');
  const app = createApp();
  const models = {};
  for (const name of ['User','Admin','Agent','Service','Item','Offer','Address','Request','SpecialRequest','Review','Notification','StaffOtp','EmailOtp','RefreshToken','MapLocation']) {
    models[name] = require(`../src/infrastructure/db/models/${name}`);
  }
  // Reset only the explicitly named disposable test database.
  if (mongoose.connection.name !== databaseName) throw Error('Unsafe test database');
  if (reset) await Promise.all(Object.values(models).map(model => model.deleteMany({})));
  await Promise.all(Object.values(models).map(model => model.init()));
  const { hashPassword } = require('../src/infrastructure/security/password');
  const admin = await models.Admin.findOne({ email: 'admin@example.test' }) || await models.Admin.create({ name: 'QA Admin', email: 'admin@example.test', passwordHash: await hashPassword('TestAdmin1!') });
  if (!await models.Service.countDocuments()) {
  await models.Service.create({ key: 'wash', name: 'Wash & Fold', description: 'QA wash service', icon: 'water-outline' });
  await models.Service.create({ key: 'iron', name: 'Ironing', icon: 'shirt-outline' });
  await models.Item.create({ name: 'Shirt', category: 'Men', prices: { wash: 10, iron: 5 } });
  await models.Item.create({ name: 'Trousers', category: 'Men', prices: { wash: 15, iron: 7 } });
  await models.Item.create({ name: 'Hidden test item', category: 'Home', prices: { wash: 99 }, active: false });
  await models.MapLocation.create({ name: 'Doha QA Zone', place: 'Al Sadd, Doha' });
  }
  // Mailbox is reachable only from this local test fixture, never the app server.
  app.get('/__test/otp', (req, res) => res.json({ code: mailbox.get(req.query.email) }));
  app.router.stack.unshift(app.router.stack.pop());
  const server = await new Promise((resolve, reject) => {
    const instance = app.listen(port, '127.0.0.1', () => resolve(instance));
    instance.on('error', reject);
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  let ip = 1;
  async function request(method, route, body, token) {
    // Independent simulated clients avoid exhausting the per-IP auth limiter.
    const response = await fetch(base + '/api' + route, {
      method, headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `198.51.100.${ip++ % 250 + 1}`, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: response.status === 204 ? null : await response.json() };
  }
  return { base, request, mailbox, models, admin, stop: async () => {
    await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
  }};
}
module.exports = { startFixture };
if (require.main === module) startFixture({ port: 4400, reset: !process.argv.includes('--preserve') }).then(f => console.log(`QA fixture running at ${f.base}`)).catch(e => { console.error(e); process.exit(1); });
