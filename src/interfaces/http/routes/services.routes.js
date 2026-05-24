const router = require('express').Router();
const validate = require('../../../shared/middleware/validate');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const ctrl = require('../controllers/services.controller');
const {
  serviceCreateSchema,
  serviceUpdateSchema,
  idParamSchema,
} = require('../../../shared/validators/catalog.schemas');

// Public for customers
router.get('/', ctrl.publicList);

router.use(authenticate);
router.get('/admin', requireRole('admin'), ctrl.adminList);
router.post(
  '/',
  requireRole('admin'),
  validate(serviceCreateSchema),
  ctrl.create
);
router.patch(
  '/:id',
  requireRole('admin'),
  validate(serviceUpdateSchema),
  ctrl.update
);
router.delete(
  '/:id',
  requireRole('admin'),
  validate(idParamSchema),
  ctrl.remove
);

module.exports = router;
