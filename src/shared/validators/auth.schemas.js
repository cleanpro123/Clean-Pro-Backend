const { z } = require('zod');

const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const companySchema = z.object({
  name: z.string().min(2).max(120),
  businessType: z.enum(['laundry_company', 'clothing_company', 'authority', 'other']),
  registrationNo: z.string().min(3).max(60),
  address: z.string().min(5).max(240),
  website: z.string().max(200).optional().default(''),
});

const registerSchema = z.object({
  body: z
    .object({
      name: z.string().min(2).max(80),
      phone: z.string().min(7).max(20),
      email: z.string().email(),
      password: passwordSchema,
      avatar: z.string().max(2048).optional().default(''),
      accountType: z.enum(['personal', 'business']).optional().default('personal'),
      company: companySchema.optional(),
    })
    .superRefine((data, ctx) => {
      if (data.accountType === 'business' && !data.company) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['company'],
          message: 'Company details are required for business accounts',
        });
      }
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

const requestOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().regex(/^\d{4,8}$/, 'Enter the code from your email'),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  requestOtpSchema,
  verifyOtpSchema,
};
