const { z } = require('zod');

const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    phone: z.string().min(7).max(20),
    email: z.string().email(),
    password: passwordSchema,
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: passwordSchema,
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10),
  }),
});

module.exports = { registerSchema, loginSchema, refreshSchema };
