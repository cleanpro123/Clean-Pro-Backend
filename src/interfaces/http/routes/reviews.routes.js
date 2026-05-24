const router = require('express').Router();
const validate = require('../../../shared/middleware/validate');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const ctrl = require('../controllers/reviews.controller');
const {
  createSchema,
  idParamSchema,
  setStatusSchema,
  listSchema,
} = require('../../../shared/validators/reviews.schemas');

// Public: approved reviews feed
router.get('/', validate(listSchema), ctrl.publicList);

router.use(authenticate);

// User
router.post('/', requireRole('user'), validate(createSchema), ctrl.userCreate);
router.get('/mine', requireRole('user'), ctrl.userMine);

// Admin moderation
router.get('/admin', requireRole('admin'), validate(listSchema), ctrl.adminList);
router.patch(
  '/:id/status',
  requireRole('admin'),
  validate(setStatusSchema),
  ctrl.setStatus
);
router.delete(
  '/:id',
  requireRole('admin'),
  validate(idParamSchema),
  ctrl.remove
);

module.exports = router;
