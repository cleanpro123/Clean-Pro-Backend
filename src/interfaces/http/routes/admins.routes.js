const router = require('express').Router();
const validate = require('../../../shared/middleware/validate');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const ctrl = require('../controllers/admins.controller');
const { otpRequestLimiter } = require('../middleware/rateLimit');
const { requestStaffOtpSchema } = require('../../../shared/validators/staffOtp.schemas');
const {
  createSchema,
  updateSchema,
  idParamSchema,
  listSchema,
} = require('../../../shared/validators/admins.schemas');

router.use(authenticate);

router.post('/otp/request', requireRole('admin'), otpRequestLimiter, validate(requestStaffOtpSchema), ctrl.requestOtp);

router.get('/', requireRole('admin'), validate(listSchema), ctrl.list);
router.post('/', requireRole('admin'), validate(createSchema), ctrl.create);
router.get('/:id', requireRole('admin'), validate(idParamSchema), ctrl.get);
router.patch('/:id', requireRole('admin'), validate(updateSchema), ctrl.update);
router.delete('/:id', requireRole('admin'), validate(idParamSchema), ctrl.remove);

module.exports = router;
