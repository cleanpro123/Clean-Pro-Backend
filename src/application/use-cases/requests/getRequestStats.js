const requestRepo = require('../../../infrastructure/db/repositories/requestRepository');

// Server-side stats for a date window, plus an optional previous window used for
// the "% vs previous period" comparison. Scoped to one agent when agentId given.
async function getRequestStats({ from, to, prevFrom, prevTo, agentId } = {}) {
  const [current, previous] = await Promise.all([
    requestRepo.statsFor({ from, to, agentId }),
    prevFrom || prevTo
      ? requestRepo.statsFor({ from: prevFrom, to: prevTo, agentId })
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
