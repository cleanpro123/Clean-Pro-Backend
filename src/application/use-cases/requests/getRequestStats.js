const requestRepo = require('../../../infrastructure/db/repositories/requestRepository');
const specialRepo = require('../../../infrastructure/db/repositories/specialRequestRepository');

async function combinedStats(options) {
  const rows = await Promise.all([requestRepo.statsFor(options), specialRepo.statsFor(options)]);
  return rows.reduce((total, row) => ({
    orders: total.orders + row.orders,
    delivered: total.delivered + row.delivered,
    revenue: total.revenue + row.revenue,
  }), { orders: 0, delivered: 0, revenue: 0 });
}

// Server-side stats for a date window, plus an optional previous window used for
// the "% vs previous period" comparison. Scoped to one agent when agentId given.
async function getRequestStats({ from, to, prevFrom, prevTo, agentId } = {}) {
  const [current, previous] = await Promise.all([
    combinedStats({ from, to, agentId }),
    prevFrom || prevTo
      ? combinedStats({ from: prevFrom, to: prevTo, agentId })
      : Promise.resolve({ orders: 0, delivered: 0, revenue: 0 }),
  ]);

  return {
    orders: current.orders,
    delivered: current.delivered,
    revenue: current.revenue,
    prevRevenue: previous.revenue,
  };
}

module.exports = getRequestStats;
