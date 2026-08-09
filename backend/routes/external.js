const express = require('express');
const { processExternalTrade } = require('../services/externalTradeService');
const { requireBearerApiSecret } = require('../middleware/auth');
const { validateTradePayload, sanitizeString } = require('../middleware/validate');
const { botLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/trades', botLimiter, requireBearerApiSecret, async (req, res) => {
  const body = req.body || {};
  const normalizedBody = {
    ...body,
    buyer: typeof body.buyer === 'object' ? body.buyer.username || body.buyer.displayName : body.buyer,
    seller: typeof body.seller === 'object' ? body.seller.username || body.seller.displayName : body.seller,
    buyerItem: body.buyerItem || body.itemsGiven?.[0]?.name,
    sellerItem: body.sellerItem || body.itemsReceived?.[0]?.name,
    value: body.value ?? body.paymentAmount
  };
  const errors = validateTradePayload(normalizedBody);
  if (!sanitizeString(body.externalTradeId || body.tradeId, 160)) errors.push('tradeId is required');
  if (body.verifiedAt && Number.isNaN(new Date(body.verifiedAt).getTime())) errors.push('verifiedAt must be a valid date');
  if (body.completedAt && Number.isNaN(new Date(body.completedAt).getTime())) errors.push('completedAt must be a valid date');
  if (!/completed/i.test(String(body.status || 'completed'))) errors.push('status must be completed');
  if (body.isTest) errors.push('test trades are not accepted by external ingestion');
  if (errors.length) return res.status(400).json({ error: errors.join(', ') });

  try {
    const result = await processExternalTrade({ ...body, ...normalizedBody });
    return res.status(result.duplicate ? 200 : 201).json({ success: true, duplicate: result.duplicate, trade: result.trade });
  } catch (error) {
    if (error.code === 11000) return res.status(200).json({ duplicate: true });
    console.error('[External API] Trade create error:', error.message);
    return res.status(500).json({ error: 'Failed to save trade' });
  }
});

module.exports = router;