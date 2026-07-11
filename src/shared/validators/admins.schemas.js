const { z } = require('zod');
const { objectIdSchema } = require('./common.schemas');

const createSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

const updateSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z
    .object({
      name: z.string().min(2).max(80).optional(),
      email: z.string().email().optional(),
      password: z.string().min(6).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' }),
});

const idParamSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

const listSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

module.exports = {
  createSchema,
  updateSchema,
  idParamSchema,
  listSchema,
};
