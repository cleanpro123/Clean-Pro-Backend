const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const ctrl = require('../controllers/notifications.controller');

router.use(authenticate);

// User  →  GET /api/notifications/mine
router.get('/mine', requireRole('user'), ctrl.userList);

module.exports = router;
