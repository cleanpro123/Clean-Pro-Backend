const { z } = require('zod');

exports.requestStaffOtpSchema = z.object({
  body: z.object({ email: z.string().trim().toLowerCase().email() }),
});
exports.staffOtpCode = z.string().regex(/^\d{4,8}$/, 'Enter the verification code sent to the new account email');
