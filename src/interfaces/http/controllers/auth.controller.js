const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok, created } = require('../../../shared/utils/respond');
const registerUser = require('../../../application/use-cases/auth/registerUser');
const requestEmailOtp = require('../../../application/use-cases/auth/requestEmailOtp');
const verifyEmailOtp = require('../../../application/use-cases/auth/verifyEmailOtp');
const resetPassword = require('../../../application/use-cases/auth/resetPassword');
const checkAvailability = require('../../../application/use-cases/auth/checkAvailability');
const login = require('../../../application/use-cases/auth/login');
const refreshTokens = require('../../../application/use-cases/auth/refreshTokens');
const logout = require('../../../application/use-cases/auth/logout');
const userRepo = require('../../../infrastructure/db/repositories/userRepository');
const agentRepo = require('../../../infrastructure/db/repositories/agentRepository');
const adminRepo = require('../../../infrastructure/db/repositories/adminRepository');
const AppError = require('../../../shared/errors/AppError');

const repos = { user: userRepo, agent: agentRepo, admin: adminRepo };

exports.requestOtp = asyncHandler(async (req, res) => {
  const result = await requestEmailOtp(req.body);
  ok(res, result);
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  const result = await verifyEmailOtp(req.body);
  ok(res, result);
});

exports.register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body);
  if (result.pending) {
    return created(res, { pending: true, profile: result.user });
  }
  created(res, { profile: result.user, tokens: result.tokens });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const result = await resetPassword(req.body);
  ok(res, result);
});

exports.availability = asyncHandler(async (req, res) => {
  const result = await checkAvailability(req.body);
  ok(res, result);
});

exports.loginUser = asyncHandler(async (req, res) => {
  const { subject, tokens } = await login({ role: 'user', ...req.body });
  ok(res, { profile: subject, role: 'user', tokens });
});

exports.loginAgent = asyncHandler(async (req, res) => {
  const { subject, tokens } = await login({ role: 'agent', ...req.body });
  ok(res, { profile: subject, role: 'agent', tokens });
});

exports.loginAdmin = asyncHandler(async (req, res) => {
  const { subject, tokens } = await login({ role: 'admin', ...req.body });
  ok(res, { profile: subject, role: 'admin', tokens });
});

exports.refresh = asyncHandler(async (req, res) => {
  const { tokens, role } = await refreshTokens(req.body);
  ok(res, { tokens, role });
});

exports.logout = asyncHandler(async (req, res) => {
  await logout(req.body);
  res.json({ ok: true });
});

exports.me = asyncHandler(async (req, res) => {
  const repo = repos[req.user.role];
  if (!repo) throw AppError.unauthorized();
  const profile = await repo.findById(req.user.id);
  if (!profile) throw AppError.notFound('Profile not found');
  ok(res, { profile, role: req.user.role });
});
