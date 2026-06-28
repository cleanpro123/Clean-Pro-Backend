const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok } = require('../../../shared/utils/respond');
const notificationRepo = require('../../../infrastructure/db/repositories/notificationRepository');

// Statuses to hide from the feed: the order hasn't been accepted by an agent
// yet, so there's nothing to notify the customer about. Everything from
// "accepted" onward is shown.
const HIDDEN_STATUSES = new Set(['pending', 'assigned']);

// LIST MY NOTIFICATIONS  →  GET /api/notifications/mine
exports.userList = asyncHandler(async (req, res) => {
  const items = await notificationRepo.list({
    filter: { userId: req.user.id },
    limit: 100,
  });
  const visible = items
    // Drop notifications whose order was deleted, or is still pending/assigned.
    .filter((n) => n.orderId && !HIDDEN_STATUSES.has(n.orderId.status))
    // Most recently updated order first.
    .sort(
      (a, b) =>
        new Date(b.orderId.updatedAt) - new Date(a.orderId.updatedAt)
    );
  ok(res, visible);
});
