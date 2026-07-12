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
    // Optional free-text note for the pickup/delivery agent.
    note: z.string().max(500).optional(),
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

// Date-window stats. from/to bound the main window; prevFrom/prevTo an optional
// comparison window. Coerced to Date so the controller/aggregation get real
// Dates. agentId optionally scopes the stats to one agent.
const statsSchema = z.object({
  query: z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    prevFrom: z.coerce.date().optional(),
    prevTo: z.coerce.date().optional(),
    agentId: objectIdSchema.optional(),
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

// Admin/agent adjust the order's total price (before delivery).
const setTotalSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({ total: z.number().nonnegative() }),
});

module.exports = {
  createSchema,
  idParamSchema,
  listSchema,
  statsSchema,
  setStatusSchema,
  assignSchema,
  setTotalSchema,
};
