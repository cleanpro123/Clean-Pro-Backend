const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Types } = require('mongoose');
const AppError = require('../src/shared/errors/AppError');
const Agent = require('../src/infrastructure/db/models/Agent');

const agentId = '507f1f77bcf86cd799439011';
const otherAgentId = '507f1f77bcf86cd799439012';

function load(filename, repo) {
  const fullPath = path.resolve(__dirname, '../src', filename);
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(fullPath, 'utf8'), {
    module, exports: module.exports,
    require(name) {
      if (name.endsWith('/requestRepository')) return repo;
      if (name.endsWith('/AppError')) return AppError;
      if (name.endsWith('/asyncHandler') || name.endsWith('/respond')) {
        return require(path.resolve(path.dirname(fullPath), name));
      }
      // Other handlers' dependencies are outside the operations under test.
      return {};
    },
  }, { filename: fullPath });
  return module.exports;
}

for (const [label, assignedId] of [
  ['populated agent', { _id: new Types.ObjectId(agentId), name: 'Assigned agent' }],
  ['populated Mongoose document', new Agent({ _id: agentId, name: 'Assigned agent' })],
  ['ObjectId reference', new Types.ObjectId(agentId)],
  ['string reference', agentId],
]) {
  test(`${label}: assigned agent can read details, update status and edit total`, async () => {
    const request = { id: 'request-1', agentId: assignedId, status: 'pending', total: 20 };
    const repo = {
      findById: async () => request,
      updateById: async (_id, patch) => ({ ...request, ...patch }),
    };
    const ctrl = load('interfaces/http/controllers/requests.controller.js', repo);
    let response;
    let error;
    await ctrl.get(
      { params: { id: request.id }, user: { role: 'agent', id: agentId } },
      { json: (body) => { response = body; } },
      (err) => { error = err; }
    );
    assert.equal(error, undefined);
    assert.equal(response.data, request);
    const transition = load('application/use-cases/requests/transitionStatus.js', repo);
    const updateTotal = load('application/use-cases/requests/updateRequestTotal.js', repo);
    const actor = { role: 'agent', id: agentId };
    assert.equal((await transition({ id: request.id, status: 'accepted', actor })).status, 'accepted');
    assert.equal((await updateTotal({ id: request.id, total: 30, actor })).total, 30);
  });
}

for (const assignedId of [{ _id: new Types.ObjectId(otherAgentId) }, null]) {
  test(`another agent's or unassigned request remains forbidden (${assignedId ? 'other' : 'none'})`, async () => {
    const repo = {
      findById: async () => ({ agentId: assignedId, status: 'pending' }),
      updateById: async () => { throw new Error('Must not update an unauthorized request'); },
    };
    const actor = { role: 'agent', id: agentId };
    const ctrl = load('interfaces/http/controllers/requests.controller.js', repo);
    let error;
    await ctrl.get({ params: { id: 'request-1' }, user: actor }, {
      json: () => assert.fail('Must not return an unauthorized request'),
    }, (err) => { error = err; });
    assert.equal(error.statusCode, 403);
    for (const [file, input] of [
      ['transitionStatus', { status: 'accepted' }],
      ['updateRequestTotal', { total: 30 }],
    ]) {
      const fn = load(`application/use-cases/requests/${file}.js`, repo);
      await assert.rejects(fn({ id: 'request-1', actor, ...input }), { statusCode: 403 });
    }
  });
}
