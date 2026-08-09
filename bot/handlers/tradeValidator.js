function validateParsedTrade(trade) {
  if (!trade) return { valid: false, reason: 'Parser returned null' };
  const required = ['buyer', 'seller', 'buyerItem', 'sellerItem', 'value', 'status'];
  for (const field of required) {
    if (!trade[field] && trade[field] !== 0) {
      return { valid: false, reason: `Missing field: ${field}` };
    }
  }
  if (trade.value < 0) return { valid: false, reason: 'Invalid value' };
  if (!/completed/i.test(trade.status)) return { valid: false, reason: 'Status not completed' };
  return { valid: true };
}

module.exports = { validateParsedTrade };
