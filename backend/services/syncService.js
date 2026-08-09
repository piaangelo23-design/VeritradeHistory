const { SyncLog, Trade } = require('../models');
const { getSettings, getStats } = require('./tradeService');

async function logSync(message, metadata = {}, success = true) {
  return SyncLog.create({ source: metadata.source || 'system', type: metadata.type || 'sync', message, metadata, success });
}

async function updateBotStatus(statusPayload) {
  const settings = await getSettings();
  const current = settings.botStatus?.toObject ? settings.botStatus.toObject() : (settings.botStatus || {});
  settings.botStatus = {
    ...current,
    ...statusPayload,
    lastHeartbeat: new Date()
  };
  settings.updatedAt = new Date();
  await settings.save();
  if (Number.isFinite(Number(statusPayload.memberCount))) {
    const stats = await getStats();
    stats.totalMembers = Number(statusPayload.memberCount);
    stats.updatedAt = new Date();
    await stats.save();
  }
  return settings.botStatus;
}

async function getDashboardStatus() {
  const settings = await getSettings();
  const stats = await getStats();
  const lastTrade = await Trade.findOne({ isTest: false, verified: true }).sort({ completedAt: -1 });
  const lastSync = await SyncLog.findOne({ type: 'sync' }).sort({ createdAt: -1 });
  const recentLogs = await SyncLog.find().sort({ createdAt: -1 }).limit(50);

  return {
    bot: settings.botStatus,
    trackingEnabled: settings.trackingEnabled,
    syncInterval: settings.syncInterval,
    tradeChannelId: settings.tradeChannelId || settings.tradeChannelId,
    guildId: settings.guildId,
    lastTradeAt: stats.lastTradeAt || lastTrade?.completedAt || null,
    lastSyncAt: stats.lastSyncAt || lastSync?.createdAt || null,
    lastTrade,
    logs: recentLogs
  };
}

module.exports = { logSync, updateBotStatus, getDashboardStatus };
