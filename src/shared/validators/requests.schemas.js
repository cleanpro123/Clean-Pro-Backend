const { z } = require('zod');
const { objectIdSchema } = require('./common.schemas');

const lineItem = z.object({
  name: z.string().min(1),
  qty: z.number().int().min(1),
  price: z.number().nonnegative(),
  service: z.string().default('wash'),
});

const createSchema = z.object({
  body: z.object({
    // The order links to one of the customer's saved addresses by id; every
    // view populates the full address from it.
    addressId: objectIdSchema,
    pickupSlot: z.string().optional(),
    // Only cash on delivery is accepted right now; UPI/card are placeholders.
    paymentMethod: z.enum(['cod', 'upi', 'card']).default('cod'),
    items: z.array(lineItem).min(1),
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
      'assigned',
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
