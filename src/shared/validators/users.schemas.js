const { z } = require('zod');
const { objectIdSchema } = require('./common.schemas');

const listSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    status: z.enum(['active', 'blocked']).optional(),
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
    addresses: z
      .array(
        z.object({
          label: z.string().optional(),
          line: z.string(),
          city: z.string().optional(),
          pincode: z.string().optional(),
        })
      )
      .optional(),
  }),
});

module.exports = { listSchema, idParamSchema, setStatusSchema, updateMeSchema };
