const { z } = require('zod');
const { objectIdSchema } = require('./common.schemas');

const listSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    status: z.enum(['active', 'blocked', 'deactivated']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

const idParamSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

const setStatusSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({ status: z.enum(['active', 'blocked']) }),
});

const updateMeSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80).optional(),
    avatar: z.string().max(2048).optional(),
  }),
});

const changeEmailSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Za-z]/, 'Password must include a letter')
      .regex(/\d/, 'Password must include a number')
      .regex(/[^A-Za-z0-9]/, 'Password must include a symbol (e.g. !@#$)'),
  }),
});

// A single address sent when creating one. Fields are permissive so the
// client can save whatever shape its form produces (line1/line2, phone, etc.).
const addAddressSchema = z.object({
  body: z.object({
    label: z.string().optional(),
    icon: z.string().optional(),
    line: z.string().optional(),
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    pincode: z.string().optional(),
    phone: z.string().optional(),
    areaId: objectIdSchema.optional(),
    area: z.string().optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    isDefault: z.boolean().optional(),
  }),
});

const addressIdParamSchema = z.object({
  params: z.object({ addressId: objectIdSchema }),
});

// Editing an existing address — same fields as create, all optional, with the
// address id in the path.
const updateAddressSchema = z.object({
  params: z.object({ addressId: objectIdSchema }),
  body: z.object({
    label: z.string().optional(),
    icon: z.string().optional(),
    line: z.string().optional(),
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    pincode: z.string().optional(),
    phone: z.string().optional(),
    areaId: objectIdSchema.optional(),
    area: z.string().optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    isDefault: z.boolean().optional(),
  }),
});

module.exports = {
  listSchema,
  idParamSchema,
  setStatusSchema,
  updateMeSchema,
  changeEmailSchema,
  changePasswordSchema,
  addAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
};
