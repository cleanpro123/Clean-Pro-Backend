const AppError = require('../../../shared/errors/AppError');
const requestRepo = require('../../../infrastructure/db/repositories/requestRepository');

// What status moves are allowed from any given status.
const transitions = {
  pending: ['accepted', 'assigned', 'cancelled'],
  assigned: ['accepted', 'in_progress', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

// Which statuses an actor of a given role is allowed to set.
const agentAllowed = new Set([
  'accepted',
  'in_progress',
  'out_for_delivery',
  'delivered',
  'cancelled',
]);

async function transitionStatus({ id, status, actor }) {
  const req = await requestRepo.findById(id);
  if (!req) throw AppError.notFound('Request not found');

  if (actor?.role === 'agent') {
    if (!req.agentId || String(req.agentId) !== actor.id) {
      throw AppError.forbidden('Not your request');
    }
    if (!agentAllowed.has(status)) {
      throw AppError.forbidden('Agents cannot perform this transition');
    }
  }

  const allowed = transitions[req.status] || [];
  if (!allowed.includes(status)) {
    throw AppError.badRequest(
      `Cannot transition from ${req.status} to ${status}`
    );
  }

  return requestRepo.updateById(id, { status });
}

module.exports = transitionStatus;
