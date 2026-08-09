const express = require('express');
const { Trade } = require('../models');
const { createVerifiedTrade } = require('../services/tradeService');
const { validateTradePayload } = require('../middleware/validate');
const { requireApiSecret } = require('../middleware/auth');
const { botLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/trades', botLimiter, requireApiSecret, async (req, res) => {
  try {
    const errors = validateTradePayload(req.body);
    if (errors.length) return res.status(400).json({ error: errors.join(', ') });

    const result = await createVerifiedTrade(req.body);
    if (result.duplicate) {
      return res.status(200).json({ duplicate: true, trade: result.trade });
    }
    return res.status(201).json({ success: true, trade: result.trade });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({ duplicate: true });
    }
    console.error('[Bot API] Trade create error:', error);
    return res.status(500).json({ error: 'Failed to save trade' });
  }
});

router.post('/status', botLimiter, requireApiSecret, async (req, res) => {
  try {
    const { updateBotStatus } = require('../services/syncService');
    const status = await updateBotStatus(req.body);
    return res.json({ success: true, status });
  } catch (error) {
    console.error('[Bot API] Status update error:', error);
    return res.status(500).json({ error: 'Failed to update status' });
  }
});

router.post('/sync', botLimiter, requireApiSecret, async (req, res) => {
  try {
    const { logSync } = require('../services/syncService');
    const { getStats } = require('../services/tradeService');
    await logSync(req.body.message || 'Bot synchronization completed', req.body.metadata || {}, true);
    const stats = await getStats();
    stats.lastSyncAt = new Date();
    await stats.save();
    return res.json({ success: true, lastSyncAt: stats.lastSyncAt });
  } catch (error) {
    console.error('[Bot API] Sync log error:', error);
    return res.status(500).json({ error: 'Failed to log sync' });
  }
});

router.get('/settings', requireApiSecret, async (req, res) => {
  try {
    const { getSettings } = require('../services/tradeService');
    const settings = await getSettings();
    return res.json({
      trackingEnabled: settings.trackingEnabled,
      syncInterval: settings.syncInterval,
      tradeChannelId: settings.tradeChannelId,
      guildId: settings.guildId,
      tradeParser: settings.tradeParser
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.get('/trades/check/:messageId', requireApiSecret, async (req, res) => {
  const existing = await Trade.findOne({ discordMessageId: req.params.messageId });
  return res.json({ exists: Boolean(existing), trade: existing });
});

module.exports = router;
