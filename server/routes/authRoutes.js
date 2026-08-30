const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
  generateMagicLink,
  verifyMagicLink,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const {
  registerSchema,
  loginSchema,
  magicLinkGenerateSchema,
} = require('../validators');

router.post('/register', validate(registerSchema), asyncHandler(register));
router.post('/login', validate(loginSchema), asyncHandler(login));
router.get('/me', protect, asyncHandler(getMe));

router.post(
  '/magic-link/generate',
  protect,
  requireAdmin,
  validate(magicLinkGenerateSchema),
  asyncHandler(generateMagicLink)
);
router.post('/magic-link/verify/:token', asyncHandler(verifyMagicLink));

module.exports = router;
