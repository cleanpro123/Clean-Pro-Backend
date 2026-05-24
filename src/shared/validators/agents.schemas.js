const { z } = require('zod');
const { objectIdSchema } = require('./common.schemas');

const createSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    phone: z.string().min(7).max(20),
    email: z.string().email(),
    password: z.string().min(6),
    mapId: objectIdSchema.optional(),
    place: z.string().optional(),
    zone: z.string().optional(),
    vehicle: z.string().optional(),
  }),
});

const updateSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    name: z.string().min(2).optional(),
    mapId: objectIdSchema.nullable().optional(),
    place: z.string().optional(),
    zone: z.string().optional(),
    vehicle: z.string().optional(),
    status: z.enum(['active', 'offline', 'blocked']).optional(),
  }),
});

const updateLocationSchema = z.object({
  body: z.object({
    place: z.string().min(1).optional(),
    mapId: objectIdSchema.nullable().optional(),
  }).refine((v) => v.place || v.mapId !== undefined, {
    message: 'Provide place or mapId',
  }),
});

const idParamSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

const listSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    status: z.enum(['active', 'offline', 'blocked']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

module.exports = {
  createSchema,
  updateSchema,
  updateLocationSchema,
  idParamSchema,
  listSchema,
};
