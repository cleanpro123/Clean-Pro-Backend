const { z } = require('zod');
const { objectIdSchema } = require('./common.schemas');

const idParamSchema = z.object({ params: z.object({ id: objectIdSchema }) });

// Service
const serviceCreateSchema = z.object({
  body: z.object({
    key: z.string().min(2).max(20),
    name: z.string().min(2).max(60),
    description: z.string().max(280).optional(),
    icon: z.string().max(40).optional(),
    active: z.boolean().optional(),
  }),
});
const serviceUpdateSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    active: z.boolean().optional(),
  }),
});

// Item
const priceMap = z.record(z.string(), z.number().nonnegative());
const itemCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(60),
    category: z.enum(['Men', 'Women', 'Home']),
    prices: priceMap.default({}),
    active: z.boolean().optional(),
  }),
});
const itemUpdateSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    name: z.string().optional(),
    category: z.enum(['Men', 'Women', 'Home']).optional(),
    prices: priceMap.optional(),
    active: z.boolean().optional(),
  }),
});

// Offer
const offerCreateSchema = z.object({
  body: z.object({
    code: z.string().min(2).max(30),
    label: z.string().optional(),
    discount: z.string().min(1),
    minOrder: z.number().nonnegative().optional(),
    validTill: z.coerce.date().optional(),
    active: z.boolean().optional(),
  }),
});
const offerUpdateSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    code: z.string().optional(),
    label: z.string().optional(),
    discount: z.string().optional(),
    minOrder: z.number().nonnegative().optional(),
    validTill: z.coerce.date().optional(),
    active: z.boolean().optional(),
  }),
});

// Map
const mapCreateSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    place: z.string().min(2),
    description: z.string().optional(),
    pickupRadius: z.string().optional(),
  }),
});
const mapUpdateSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    name: z.string().optional(),
    place: z.string().optional(),
    description: z.string().optional(),
    pickupRadius: z.string().optional(),
  }),
});

module.exports = {
  idParamSchema,
  serviceCreateSchema,
  serviceUpdateSchema,
  itemCreateSchema,
  itemUpdateSchema,
  offerCreateSchema,
  offerUpdateSchema,
  mapCreateSchema,
  mapUpdateSchema,
};
