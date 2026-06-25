const router = require('express').Router();
const validate = require('../../../shared/middleware/validate');
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  requestOtpSchema,
  verifyOtpSchema,
} = require('../../../shared/validators/auth.schemas');
const authenticate = require('../middleware/authenticate');
const auth = require('../controllers/auth.controller');

router.post('/otp/request', validate(requestOtpSchema), auth.requestOtp);
router.post('/otp/verify', validate(verifyOtpSchema), auth.verifyOtp);
router.post('/register', validate(registerSchema), auth.register);
router.post('/login/user', validate(loginSchema), auth.loginUser);
router.post('/login/agent', validate(loginSchema), auth.loginAgent);
router.post('/login/admin', validate(loginSchema), auth.loginAdmin);
router.post('/refresh', validate(refreshSchema), auth.refresh);
router.post('/logout', validate(refreshSchema), auth.logout);
router.get('/me', authenticate, auth.me);

module.exports = router;
