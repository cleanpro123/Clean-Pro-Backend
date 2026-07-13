const { z } = require('zod');

const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

// Stronger rules for setting a new password (register / reset). Login keeps the
// plain length check so existing accounts aren't locked out.
const strongPasswordSchema = passwordSchema
  .regex(/[A-Za-z]/, 'Password must include a letter')
  .regex(/\d/, 'Password must include a number')
  .regex(/[^A-Za-z0-9]/, 'Password must include a symbol (e.g. !@#$)');

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    phone: z.string().min(7).max(20),
    email: z.string().email(),
    password: strongPasswordSchema,
    avatar: z.string().max(2048).optional().default(''),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: passwordSchema, // login: keep length-only so existing users can sign in
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10),
  }),
});

const requestOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    purpose: z.enum(['register', 'reset', 'change-email']).optional(),
  }),
});

const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().regex(/^\d{4,8}$/, 'Enter the code from your email'),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: strongPasswordSchema,
  }),
});

// Pre-flight check used by the signup form to catch a taken email before
// sending an OTP. Phone is not checked (numbers may be shared across accounts).
const availabilitySchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  requestOtpSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  availabilitySchema,
};
