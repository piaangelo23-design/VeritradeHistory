function sanitizeString(value, max = 200) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function validateTradePayload(body) {
  const errors = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) return ['JSON object is required'];
  if (!sanitizeString(body.buyer)) errors.push('buyer is required');
  if (!sanitizeString(body.seller)) errors.push('seller is required');
  if (!sanitizeString(body.buyerItem)) errors.push('buyerItem is required');
  if (!sanitizeString(body.sellerItem)) errors.push('sellerItem is required');
  if (body.value === undefined || body.value === null || !Number.isFinite(Number(body.value)) || Number(body.value) < 0) {
    errors.push('value must be a number');
  }
  return errors;
}

module.exports = { sanitizeString, validateTradePayload };
