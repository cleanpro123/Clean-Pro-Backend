// Dependencies: error helper + the database repositories this use case talks to
const AppError = require('../../../shared/errors/AppError');
const requestRepo = require('../../../infrastructure/db/repositories/requestRepository');
const userRepo = require('../../../infrastructure/db/repositories/userRepository');
const agentRepo = require('../../../infrastructure/db/repositories/agentRepository');
const mapRepo = require('../../../infrastructure/db/repositories/mapRepository');
const addressRepo = require('../../../infrastructure/db/repositories/addressRepository');
const notificationRepo = require('../../../infrastructure/db/repositories/notificationRepository');

// Flatten an Address document into a single readable line — used only to match
// the order against an agent's service area (the address itself is stored as a
// reference, not a snapshot).
function formatAddress(a) {
  return [a.label, a.line1, a.line2, a.line, a.city, a.area, a.pincode]
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .join(', ');
}

// Words that appear in almost every address and carry no locality signal —
// excluded so they don't inflate a match.
const STOP_WORDS = new Set([
  'home', 'office', 'parents', 'flat', 'apt', 'no', 'near',
  'kl', 'rd', 'road', 'st', 'street', 'nagar', 'lane',
]);

// Break a free-text location into comparable tokens. Words are lowercased;
// 5–6 digit pincodes are kept separately so an exact pincode hit can be
// weighted far higher than a shared common word.
function tokenize(text) {
  const raw = String(text || '').toLowerCase();
  const words = (raw.match(/[a-z]+/g) || []).filter(
    (w) => w.length > 2 && !STOP_WORDS.has(w)
  );
  const pins = raw.match(/\b\d{5,6}\b/g) || [];
  return { words: new Set(words), pins: new Set(pins) };
}

// Score how well an agent's service area matches the order address.
// A matching pincode dominates; each shared place/zone word adds a little.
function matchScore(orderAddress, agentText) {
  const a = tokenize(orderAddress);
  const b = tokenize(agentText);
  let score = 0;
  for (const p of a.pins) if (b.pins.has(p)) score += 100;
  for (const w of a.words) if (b.words.has(w)) score += 10;
  return score;
}

// Generates a unique, human-readable order code (e.g. "NTR-LXK3-9Q2")
// from a timestamp segment + a short random segment.
function genCode() {
  const stamp = Math.floor(Date.now() / 1000).toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `NTR-${stamp}-${rand}`;
}

// Pick the active agent whose service area best matches the order's pickup
// address. Each agent's location is built from its place + zone + the linked
// map location (when set). The best match wins; ties — including the case
// where nothing matches — fall back to the agent with the lightest load.
// Returns null if no agent is active.
async function pickAgent(user, address) {
  const agents = await agentRepo.list({ status: 'active', limit: 200 });
  if (!agents.length) return null;

  // Resolve linked map locations once so we don't query per agent.
  const maps = await mapRepo.list();
  const mapPlaceById = new Map(maps.map((m) => [String(m._id), m.place]));

  const scored = await Promise.all(
    agents.map(async (a) => {
      const agentText = [
        a.place,
        a.zone,
        a.mapId ? mapPlaceById.get(String(a.mapId)) : '',
      ]
        .filter(Boolean)
        .join(' ');
      return {
        agent: a,
        score: matchScore(address, agentText),
        load: await requestRepo.count({
          agentId: a._id,
          status: { $in: ['assigned', 'accepted', 'in_progress', 'out_for_delivery'] },
        }),
      };
    })
  );

  // Highest location match first; break ties by lightest current load.
  scored.sort((x, y) => y.score - x.score || x.load - y.load);
  return scored[0].agent;
}

// MAIN ORDER-CREATION USE CASE
// Takes the customer's id and order details, validates the customer,
// computes the price, auto-assigns a delivery agent, then saves the order.
async function createRequest({ userId, addressId, paymentMethod, items, note }) {
  // 1) Load the customer placing the order and make sure they're allowed to
  const user = await userRepo.findById(userId);
  if (!user) throw AppError.notFound('User not found');
  if (user.status === 'blocked') throw AppError.forbidden('Account blocked');

  // 2) Resolve the saved pickup address and confirm it belongs to this user.
  const addressDoc = await addressRepo.findById(addressId);
  if (!addressDoc || String(addressDoc.userId) !== String(user._id)) {
    throw AppError.notFound('Address not found');
  }
  // Flattened text is used only to match the order to an agent's service area.
  const addressText = formatAddress(addressDoc);

  // 3) Sum up the order total (quantity × price for every item)
  const total = items.reduce((sum, it) => sum + it.qty * it.price, 0);

  // 4) Auto-assign at creation to the agent whose area best matches the
  // pickup address. If no agents are active right now the request stays
  // pending and can be assigned later.
  const picked = await pickAgent(user, addressText);

  // 5) Persist the new order to the database
  const req = await requestRepo.create({
    code: genCode(),
    userId: user._id,
    addressId: addressDoc._id,
    note: (note || '').trim(),
    paymentMethod: paymentMethod || 'cod',
    items,
    total,
    status: picked ? 'assigned' : 'pending',
    agentId: picked ? picked._id : null,
  });

  // 6) Open a notification for this order, linked to the customer. It stays
  // hidden in the feed until the order moves past pending/assigned (the feed
  // reads the order's live status), so the record exists from the moment the
  // order is placed.
  await notificationRepo.create({ userId: user._id, orderId: req._id });

  // Return the order with its address populated so the caller gets the full,
  // ready-to-render address straight away.
  return requestRepo.findById(req._id);
}

module.exports = createRequest;
