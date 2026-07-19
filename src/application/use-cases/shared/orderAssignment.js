// Shared order helpers used by both normal orders (createRequest) and special
// "direct" orders (createSpecialRequest): a human-readable order code, address
// flattening, and the agent auto-assignment (best service-area match, ties
// broken by lightest current load).
const agentRepo = require('../../../infrastructure/db/repositories/agentRepository');
const mapRepo = require('../../../infrastructure/db/repositories/mapRepository');
const requestRepo = require('../../../infrastructure/db/repositories/requestRepository');

function formatAddress(a) {
  return [a.label, a.line1, a.line2, a.line, a.city, a.area, a.pincode]
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .join(', ');
}

const STOP_WORDS = new Set([
  'home', 'office', 'parents', 'flat', 'apt', 'no', 'near',
  'kl', 'rd', 'road', 'st', 'street', 'nagar', 'lane',
]);

function tokenize(text) {
  const raw = String(text || '').toLowerCase();
  const words = (raw.match(/[a-z]+/g) || []).filter(
    (w) => w.length > 2 && !STOP_WORDS.has(w)
  );
  const pins = raw.match(/\b\d{5,6}\b/g) || [];
  return { words: new Set(words), pins: new Set(pins) };
}

function matchScore(orderAddress, agentText) {
  const a = tokenize(orderAddress);
  const b = tokenize(agentText);
  let score = 0;
  for (const p of a.pins) if (b.pins.has(p)) score += 100;
  for (const w of a.words) if (b.words.has(w)) score += 10;
  return score;
}

// Generates a unique, human-readable order code (e.g. "NTR-LXK3-9Q2").
function genCode() {
  const stamp = Math.floor(Date.now() / 1000).toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `NTR-${stamp}-${rand}`;
}

// Pick the active agent whose service area best matches the pickup address.
// Ties (and no-match) fall back to the lightest current load. Null if no agent
// is active.
async function pickAgent(address) {
  const agents = await agentRepo.list({ status: 'active', limit: 200 });
  if (!agents.length) return null;

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
          status: { $in: ['pending', 'accepted', 'in_progress', 'out_for_delivery'] },
        }),
      };
    })
  );

  scored.sort((x, y) => y.score - x.score || x.load - y.load);
  return scored[0].agent;
}

module.exports = { formatAddress, genCode, pickAgent, matchScore, tokenize };
