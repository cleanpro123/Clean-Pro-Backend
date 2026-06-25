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

// Any signed-in user can read the list of service areas — customers need
// it to pick a nearby area when adding an address. Mutations stay admin-only.
router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', validate(idParamSchema), ctrl.get);

router.post('/', requireRole('admin'), validate(mapCreateSchema), ctrl.create);
router.patch('/:id', requireRole('admin'), validate(mapUpdateSchema), ctrl.update);
router.delete('/:id', requireRole('admin'), validate(idParamSchema), ctrl.remove);

module.exports = router;
