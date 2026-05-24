const router = require('express').Router();
const validate = require('../../../shared/middleware/validate');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const ctrl = require('../controllers/maps.controller');
const {
  mapCreateSchema,
  mapUpdateSchema,
  idParamSchema,
} = require('../../../shared/validators/catalog.schemas');

router.use(authenticate, requireRole('admin'));

router.get('/', ctrl.list);
router.post('/', validate(mapCreateSchema), ctrl.create);
router.get('/:id', validate(idParamSchema), ctrl.get);
router.patch('/:id', validate(mapUpdateSchema), ctrl.update);
router.delete('/:id', validate(idParamSchema), ctrl.remove);

module.exports = router;
