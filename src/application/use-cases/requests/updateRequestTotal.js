const AppError = require('../../../shared/errors/AppError');
const requestRepo = require('../../../infrastructure/db/repositories/requestRepository');

// The price is final once the order is delivered (or cancelled) — it can only
// be adjusted while the order is still in progress.
const LOCKED = new Set(['delivered', 'cancelled']);

async function updateRequestTotal({ id, total, actor }) {
  const req = await requestRepo.findById(id);
  if (!req) throw AppError.notFound('Request not found');

  // Agents may only edit orders assigned to them; admins can edit any.
  if (actor?.role === 'agent') {
    if (!req.agentId || String(req.agentId) !== actor.id) {
      throw AppError.forbidden('Not your request');
    }
  }

  if (LOCKED.has(req.status)) {
    throw AppError.badRequest(
      `The price of a ${req.status} order can no longer be changed`
    );
  }

  return requestRepo.updateById(id, { total });
}

module.exports = updateRequestTotal;
