const AppError = require('../../../shared/errors/AppError');
const requestRepo = require('../../../infrastructure/db/repositories/requestRepository');
const userRepo = require('../../../infrastructure/db/repositories/userRepository');
const agentRepo = require('../../../infrastructure/db/repositories/agentRepository');

function genCode() {
  const stamp = Math.floor(Date.now() / 1000).toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `NTR-${stamp}-${rand}`;
}

// Pick the active agent currently carrying the fewest in-flight assignments.
// Returns null if no eligible agent is online.
async function pickAgent() {
  const agents = await agentRepo.list({ status: 'active', limit: 200 });
  if (!agents.length) return null;
  const counts = await Promise.all(
    agents.map(async (a) => ({
      agent: a,
      load: await requestRepo.count({
        agentId: a._id,
        status: { $in: ['assigned', 'accepted', 'in_progress', 'out_for_delivery'] },
      }),
    }))
  );
  counts.sort((a, b) => a.load - b.load);
  return counts[0].agent;
}

async function createRequest({ userId, address, pickupSlot, items }) {
  const user = await userRepo.findById(userId);
  if (!user) throw AppError.notFound('User not found');
  if (user.status === 'blocked') throw AppError.forbidden('Account blocked');

  const total = items.reduce((sum, it) => sum + it.qty * it.price, 0);

  // Auto-assign at creation. If no agents are active right now the request
  // stays pending and can be assigned later.
  const picked = await pickAgent();

  const req = await requestRepo.create({
    code: genCode(),
    userId: user._id,
    customerName: user.name,
    phone: user.phone,
    address,
    pickupSlot: pickupSlot || '',
    items,
    total,
    status: picked ? 'assigned' : 'pending',
    agentId: picked ? picked._id : null,
  });
  return req;
}

module.exports = createRequest;
