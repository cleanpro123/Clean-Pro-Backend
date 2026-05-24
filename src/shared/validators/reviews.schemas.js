const { z } = require('zod');
const { objectIdSchema } = require('./common.schemas');

const createSchema = z.object({
  body: z.object({
    requestId: objectIdSchema,
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
  }),
});

const idParamSchema = z.object({ params: z.object({ id: objectIdSchema }) });

const setStatusSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({ status: z.enum(['pending', 'approved', 'hidden']) }),
});

const listSchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'approved', 'hidden']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

module.exports = { createSchema, idParamSchema, setStatusSchema, listSchema };
