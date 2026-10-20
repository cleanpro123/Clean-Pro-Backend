const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const AppError = require('../src/shared/errors/AppError');

function load(file, mocks) {
  const filename = path.resolve(__dirname, '../src', file);
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    module, exports: module.exports, Date,
    require(name) {
      for (const [suffix, value] of Object.entries(mocks)) if (name.endsWith(suffix)) return value;
      return require(path.resolve(path.dirname(filename), name));
    },
  }, { filename });
  return module.exports;
}

function harness() {
  const records = new Map();
  const emails = [];
  const key = ({ email, role, requestedBy }) => `${email}:${role}:${requestedBy}`;
  const repo = {
    upsert: async (identity, data) => {
      records.set(key(identity), { ...identity, ...data, attempts: 0, _id: key(identity) });
    },
    find: async (identity) => records.get(key(identity)),
    incrementAttempts: async (id) => { records.get(id).attempts++; },
    consume: async (id, hash, max) => {
      const rec = records.get(id);
      if (!rec || rec.codeHash !== hash || rec.attempts >= max || rec.expiresAt <= new Date()) return null;
      records.delete(id);
      return rec;
    },
  };
  const staff = load('application/use-cases/auth/staffOtp.js', {
    '/env': { otp: { length: 6, ttlMinutes: 10, maxAttempts: 5 } },
    '/staffOtpRepository': repo,
    '/adminRepository': { findByEmail: async () => null },
    '/agentRepository': { findByEmail: async () => null },
    '/mailer': {
      otpEmail: (code) => ({ subject: 'OTP', text: code }),
      sendMail: async (mail) => emails.push(mail),
    },
    '/otp': { generateCode: () => '123456', hashCode: (value) => `hashed:${value}` },
  });
  const input = { email: 'new@example.com', role: 'admin', requestedBy: 'admin-1', otpCode: '123456' };
  return { staff, records, emails, input };
}

for (const role of ['admin', 'agent']) {
  test(`${role}: code is emailed to the new address and is single use`, async () => {
    const { staff, input, records, emails } = harness();
    input.role = role;
    const response = await staff.request({ ...input, email: ' NEW@Example.com ' });
    assert.equal(response.sent, true);
    assert.equal(response.codeLength, 6);
    assert.equal(emails[0].to, input.email);
    assert.equal([...records.values()][0].codeHash, 'hashed:123456');
    await staff.consume(input);
    await assert.rejects(staff.consume(input), { statusCode: 400 });
  });
}

test('verification is bound to the recipient, role, and creating admin', async () => {
  const { staff, input } = harness();
  await staff.request(input);
  for (const change of [{ email: 'other@example.com' }, { role: 'agent' }, { requestedBy: 'admin-2' }]) {
    await assert.rejects(staff.consume({ ...input, ...change }), { statusCode: 400 });
  }
  await staff.consume(input);
});

test('wrong codes count toward attempt limit; resending resets attempts', async () => {
  const { staff, input, records } = harness();
  await staff.request(input);
  for (let attempt = 0; attempt < 5; attempt++) {
    await assert.rejects(staff.consume({ ...input, otpCode: '000000' }), { statusCode: 400 });
  }
  assert.equal([...records.values()][0].attempts, 5);
  await assert.rejects(staff.consume(input), /Too many attempts/);
  await staff.request(input);
  await staff.consume(input);
});

test('expired codes cannot create an account', async () => {
  const { staff, input, records } = harness();
  await staff.request(input);
  [...records.values()][0].expiresAt = new Date(Date.now() - 1);
  await assert.rejects(staff.consume(input), /Code expired/);
});

for (const role of ['admin', 'agent']) {
  test(`${role}: creation endpoint enforces verification before storing the account`, async () => {
    let creates = 0;
    let allow = false;
    const repo = { findByEmail: async () => null, create: async () => { creates++; return { id: 'new-account' }; } };
    const ctrl = load(`interfaces/http/controllers/${role}s.controller.js`, {
      [`/${role}Repository`]: repo,
      '/mapRepository': {},
      '/password': { hashPassword: async () => 'password-hash' },
      '/staffOtp': { consume: async (input) => {
        assert.equal(input.role, role);
        assert.equal(input.requestedBy, 'creator');
        if (!allow) throw AppError.badRequest('Invalid verification code');
      } },
    });
    const request = { body: { email: 'new@example.com', name: 'New Account', password: 'secret', otpCode: '123456' }, user: { id: 'creator' } };
    let error;
    const res = { status: () => res, json: () => {} };
    await ctrl.create(request, res, (err) => { error = err; });
    assert.equal(error.statusCode, 400);
    assert.equal(creates, 0);
    allow = true;
    await ctrl.create(request, res, (err) => { throw err; });
    assert.equal(creates, 1);
  });
}

test('both creation validators reject requests without an OTP', () => {
  const admin = require('../src/shared/validators/admins.schemas').createSchema;
  const agent = require('../src/shared/validators/agents.schemas').createSchema;
  const body = { name: 'New Account', email: 'new@example.com', password: 'secret', phone: '12345678' };
  for (const schema of [admin, agent]) {
    assert.equal(schema.safeParse({ body }).success, false);
    assert.equal(schema.safeParse({ body: { ...body, otpCode: '123456' } }).success, true);
  }
});
