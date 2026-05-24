const router = require('express').Router();
const validate = require('../../../shared/middleware/validate');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const ctrl = require('../controllers/agents.controller');
const {
  createSchema,
  updateSchema,
  updateLocationSchema,
  idParamSchema,
  listSchema,
} = require('../../../shared/validators/agents.schemas');

router.use(authenticate);

// Agent self
router.get('/me', requireRole('agent'), ctrl.me);
router.patch(
  '/me/location',
  requireRole('agent'),
  validate(updateLocationSchema),
  ctrl.updateMyLocation
);

// Admin
router.get('/', requireRole('admin'), validate(listSchema), ctrl.list);
router.post('/', requireRole('admin'), validate(createSchema), ctrl.create);
router.get('/:id', requireRole('admin'), validate(idParamSchema), ctrl.get);
router.patch('/:id', requireRole('admin'), validate(updateSchema), ctrl.update);
router.delete('/:id', requireRole('admin'), validate(idParamSchema), ctrl.remove);

module.exports = router;
