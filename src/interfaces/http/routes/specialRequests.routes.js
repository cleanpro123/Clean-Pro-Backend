const router = require('express').Router();
const validate = require('../../../shared/middleware/validate');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const ctrl = require('../controllers/specialRequests.controller');
const {
  createSchema,
  listSchema,
  idParamSchema,
  setStatusSchema,
  assignSchema,
  setTotalSchema,
} = require('../../../shared/validators/specialRequests.schemas');

router.use(authenticate);

// User — place a direct order (special customers only; enforced in the use case)
router.post('/', requireRole('user'), validate(createSchema), ctrl.userCreate);
router.get('/mine', requireRole('user'), validate(listSchema), ctrl.userList);

// Agent
router.get('/assigned', requireRole('agent'), validate(listSchema), ctrl.agentList);

// Admin
router.get('/', requireRole('admin'), validate(listSchema), ctrl.adminList);
router.post('/:id/assign', requireRole('admin'), validate(assignSchema), ctrl.assignAgent);

// Shared
router.get(
  '/:id',
  requireRole('user', 'agent', 'admin'),
  validate(idParamSchema),
  ctrl.get
);
router.patch(
  '/:id/status',
  requireRole('agent', 'admin'),
  validate(setStatusSchema),
  ctrl.setStatus
);
router.patch(
  '/:id/total',
  requireRole('agent', 'admin'),
  validate(setTotalSchema),
  ctrl.updateTotal
);

module.exports = router;
