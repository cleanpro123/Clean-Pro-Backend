const { z } = require('zod');
const { objectIdSchema } = require('./common.schemas');

const listSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    status: z.enum(['active', 'blocked']).optional(),
    accountType: z.enum(['personal', 'business']).optional(),
    approvalStatus: z.enum(['approved', 'pending', 'rejected']).optional(),
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

const setApprovalSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({ approvalStatus: z.enum(['approved', 'rejected']) }),
});

const updateMeSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80).optional(),
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
    isDefault: z.boolean().optional(),
  }),
});

const addressIdParamSchema = z.object({
  params: z.object({ addressId: objectIdSchema }),
});

module.exports = {
  listSchema,
  idParamSchema,
  setStatusSchema,
  setApprovalSchema,
  updateMeSchema,
  addAddressSchema,
  addressIdParamSchema,
};
