const { z } = require('zod');
const { objectIdSchema } = require('./common.schemas');

// A direct (special) order carries no items — just the pickup address, delivery
// speed, payment method and an optional note. Mirrors the normal create schema
// minus items, plus deliveryType.
const createSchema = z.object({
  body: z.object({
    addressId: objectIdSchema,
    deliveryType: z.enum(['normal', 'fast']).default('normal'),
    paymentMethod: z.enum(['cod', 'upi', 'card']).default('cod'),
    note: z.string().max(500).optional(),
  }),
});

const idParamSchema = z.object({ params: z.object({ id: objectIdSchema }) });

const listSchema = z.object({
  query: z.object({
    status: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

const setStatusSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    status: z.enum([
      'pending',
      'accepted',
      'in_progress',
      'out_for_delivery',
      'delivered',
      'cancelled',
    ]),
  }),
});

const assignSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({ agentId: objectIdSchema }),
});

module.exports = {
  createSchema,
  idParamSchema,
  listSchema,
  setStatusSchema,
  assignSchema,
};
