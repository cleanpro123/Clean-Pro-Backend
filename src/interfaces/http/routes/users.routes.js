const router = require('express').Router();
const validate = require('../../../shared/middleware/validate');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const ctrl = require('../controllers/users.controller');
const {
  listSchema,
  idParamSchema,
  setStatusSchema,
  updateMeSchema,
} = require('../../../shared/validators/users.schemas');

router.use(authenticate);

// User self
router.get('/me', requireRole('user'), ctrl.me);
router.patch('/me', requireRole('user'), validate(updateMeSchema), ctrl.updateMe);

// Admin
router.get('/', requireRole('admin'), validate(listSchema), ctrl.list);
router.get('/:id', requireRole('admin'), validate(idParamSchema), ctrl.get);
router.patch(
  '/:id/status',
  requireRole('admin'),
  validate(setStatusSchema),
  ctrl.setStatus
);

module.exports = router;
