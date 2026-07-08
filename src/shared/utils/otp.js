const crypto = require('crypto');

// Numeric one-time code, e.g. "048213"
function generateCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i += 1) code += crypto.randomInt(0, 10);
  return code;
}

function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

module.exports = { generateCode, hashCode };
