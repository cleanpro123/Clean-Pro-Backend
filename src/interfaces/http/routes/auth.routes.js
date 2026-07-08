const router = require('express').Router();
const validate = require('../../../shared/middleware/validate');
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  requestOtpSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  availabilitySchema,
} = require('../../../shared/validators/auth.schemas');
const authenticate = require('../middleware/authenticate');
const { authLimiter, otpRequestLimiter, globalLimiter } = require('../middleware/rateLimit');
const auth = require('../controllers/auth.controller');

router.post('/otp/request', otpRequestLimiter, validate(requestOtpSchema), auth.requestOtp);
router.post('/otp/verify', authLimiter, validate(verifyOtpSchema), auth.verifyOtp);
router.post('/password/reset', authLimiter, validate(resetPasswordSchema), auth.resetPassword);
router.post('/availability', globalLimiter, validate(availabilitySchema), auth.availability);
router.post('/register', authLimiter, validate(registerSchema), auth.register);
router.post('/login/user', authLimiter, validate(loginSchema), auth.loginUser);
router.post('/login/agent', authLimiter, validate(loginSchema), auth.loginAgent);
router.post('/login/admin', authLimiter, validate(loginSchema), auth.loginAdmin);
router.post('/refresh', authLimiter, validate(refreshSchema), auth.refresh);
router.post('/logout', validate(refreshSchema), auth.logout);
router.get('/me', authenticate, auth.me);

module.exports = router;
