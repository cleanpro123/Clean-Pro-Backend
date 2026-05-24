const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok, created, noContent } = require('../../../shared/utils/respond');
const AppError = require('../../../shared/errors/AppError');
const reviewRepo = require('../../../infrastructure/db/repositories/reviewRepository');
const requestRepo = require('../../../infrastructure/db/repositories/requestRepository');
const userRepo = require('../../../infrastructure/db/repositories/userRepository');

function paginate(req) {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  return { page, limit, skip: (page - 1) * limit };
}

exports.publicList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const filter = { status: 'approved' };
  const [items, total] = await Promise.all([
    reviewRepo.list({ filter, skip, limit }),
    reviewRepo.count(filter),
  ]);
  ok(res, items, { page, limit, total });
});

exports.userCreate = asyncHandler(async (req, res) => {
  const { requestId, rating, comment } = req.body;
  const order = await requestRepo.findById(requestId);
  if (!order) throw AppError.notFound('Order not found');
  if (String(order.userId) !== req.user.id) {
    throw AppError.forbidden('You can only review your own orders');
  }
  if (order.status !== 'delivered') {
    throw AppError.badRequest('Order must be delivered to review');
  }
  const existing = await reviewRepo.findByRequest(requestId);
  if (existing) throw AppError.conflict('Already reviewed');

  const user = await userRepo.findById(req.user.id);
  const review = await reviewRepo.create({
    requestId,
    userId: req.user.id,
    customerName: user?.name || 'Customer',
    rating,
    comment: comment || '',
    status: 'pending',
  });
  created(res, review);
});

exports.userMine = asyncHandler(async (req, res) => {
  const items = await reviewRepo.list({ filter: { userId: req.user.id } });
  ok(res, items);
});

exports.adminList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const [items, total, pending, approved, hidden] = await Promise.all([
    reviewRepo.list({ filter, skip, limit }),
    reviewRepo.count(filter),
    reviewRepo.count({ status: 'pending' }),
    reviewRepo.count({ status: 'approved' }),
    reviewRepo.count({ status: 'hidden' }),
  ]);
  ok(res, items, {
    page,
    limit,
    total,
    counts: { pending, approved, hidden, total },
  });
});

exports.setStatus = asyncHandler(async (req, res) => {
  const review = await reviewRepo.updateById(req.params.id, {
    status: req.body.status,
  });
  if (!review) throw AppError.notFound('Review not found');
  ok(res, review);
});

exports.remove = asyncHandler(async (req, res) => {
  const review = await reviewRepo.deleteById(req.params.id);
  if (!review) throw AppError.notFound('Review not found');
  noContent(res);
});
