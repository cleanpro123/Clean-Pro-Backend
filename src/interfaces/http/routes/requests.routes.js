const router = require('express').Router();
const validate = require('../../../shared/middleware/validate');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const ctrl = require('../controllers/requests.controller');
const {
  createSchema,
  listSchema,
  statsSchema,
  idParamSchema,
  setStatusSchema,
  assignSchema,
  setTotalSchema,
} = require('../../../shared/validators/requests.schemas');

router.use(authenticate);

// User

// CREATE ORDER  →  POST /api/requests
// Only logged-in users with the "user" role can place an order.
// validate(createSchema) checks the request body before it reaches the controller.
router.post(
  '/',
  requireRole('user'),
  validate(createSchema),
  ctrl.userCreate
);
router.get('/mine', requireRole('user'), validate(listSchema), ctrl.userList);

// Agent
router.get(
  '/assigned',
  requireRole('agent'),
  validate(listSchema),
  ctrl.agentList
);

// Admin
// NOTE: /stats must be declared before /:id, else "stats" is matched as an id.
router.get('/stats', requireRole('admin'), validate(statsSchema), ctrl.adminStats);
router.get('/', requireRole('admin'), validate(listSchema), ctrl.adminList);
router.post(
  '/:id/assign',
  requireRole('admin'),
  validate(assignSchema),
  ctrl.assignAgent
);

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
// Adjust the order total (admin any order; agent only their assigned ones).
// Blocked once the order is delivered/cancelled.
router.patch(
  '/:id/total',
  requireRole('agent', 'admin'),
  validate(setTotalSchema),
  ctrl.updateTotal
);

module.exports = router;
