const router = require('express').Router();
const validate = require('../../../shared/middleware/validate');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const ctrl = require('../controllers/offers.controller');
const {
  offerCreateSchema,
  offerUpdateSchema,
  idParamSchema,
} = require('../../../shared/validators/catalog.schemas');

router.get('/', ctrl.publicList);

router.use(authenticate);
router.get('/admin', requireRole('admin'), ctrl.adminList);
router.post('/', requireRole('admin'), validate(offerCreateSchema), ctrl.create);
router.patch('/:id', requireRole('admin'), validate(offerUpdateSchema), ctrl.update);
router.delete('/:id', requireRole('admin'), validate(idParamSchema), ctrl.remove);

module.exports = router;
