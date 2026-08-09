const { v4: uuidv4 } = require('uuid');
const { Trade, Activity, WebsiteStats, Settings, Middleman } = require('../models');

let ioInstance = null;

function setIO(io) {
  ioInstance = io;
}

function getTradeSize(value, settings) {
  const smallMax = settings?.smallTradeMax ?? 500;
  const mediumMax = settings?.mediumTradeMax ?? 5000;
  if (value <= smallMax) return 'small';
  if (value <= mediumMax) return 'medium';
  return 'large';
}

async function getSettings() {
  let settings = await Settings.findOne({ key: 'app' });
  if (!settings) {
    settings = await Settings.create({ key: 'app' });
  }
  return settings;
}

async function getStats() {
  let stats = await WebsiteStats.findOne({ key: 'global' });
  if (!stats) {
    stats = await WebsiteStats.create({ key: 'global', totalVisits: 0 });
  }
  return stats;
}

async function normalizeMiddlemanName(name) {
  if (!name || name.toLowerCase() === 'none' || name.toLowerCase().includes('direct')) {
    return null;
  }
  const middlemen = await Middleman.find({ active: true });
  const normalized = name.trim().toLowerCase();
  for (const mm of middlemen) {
    const names = [mm.name, mm.displayName, ...(mm.aliases || [])].filter(Boolean);
    for (const n of names) {
      if (normalized === n.toLowerCase() || normalized.includes(n.toLowerCase()) || n.toLowerCase().includes(normalized)) {
        return mm.name;
      }
    }
  }
  return name.trim();
}

async function createVerifiedTrade(payload, options = {}) {
  const settings = await getSettings();

  if (payload.discordMessageId) {
    const existing = await Trade.findOne({ discordMessageId: payload.discordMessageId });
    if (existing) {
      return { duplicate: true, trade: existing };
    }
  }

  if (payload.externalTradeId) {
    const existing = await Trade.findOne({ externalTradeId: payload.externalTradeId });
    if (existing) return { duplicate: true, trade: existing };
  }

  const isTest = Boolean(payload.isTest);
  const value = Number(payload.value) || 0;
  const middleman = await normalizeMiddlemanName(payload.middleman);
  const tradeSize = isTest ? 'test' : getTradeSize(value, settings);

  const trade = await Trade.create({
    tradeId: payload.tradeId || uuidv4(),
    externalTradeId: payload.externalTradeId || undefined,
    discordMessageId: payload.discordMessageId || null,
    guildId: payload.guildId,
    channelId: payload.channelId,
    messageUrl: payload.messageUrl,
    buyer: payload.buyer,
    seller: payload.seller,
    buyerItem: payload.buyerItem,
    sellerItem: payload.sellerItem,
    buyerProfile: payload.buyerProfile,
    sellerProfile: payload.sellerProfile,
    itemsGiven: payload.itemsGiven || [],
    itemsReceived: payload.itemsReceived || [],
    paymentType: payload.paymentType,
    paymentAmount: payload.paymentAmount,
    value,
    middleman,
    tradeSize,
    status: payload.status || 'Completed',
    verified: !isTest,
    isTest,
    source: payload.source || 'discord',
    verificationSource: payload.verificationSource,
    verifiedAt: payload.verifiedAt ? new Date(payload.verifiedAt) : undefined,
    completedAt: payload.completedAt ? new Date(payload.completedAt) : new Date()
  });

  if (!isTest) {
    const stats = await getStats();
    stats.totalTrades += 1;
    if (tradeSize === 'small') stats.smallTrades += 1;
    else if (tradeSize === 'medium') stats.mediumTrades += 1;
    else if (tradeSize === 'large') stats.largeTrades += 1;
    stats.lastTradeAt = trade.completedAt;
    stats.updatedAt = new Date();
    await stats.save();

    if (middleman) {
      const mm = await Middleman.findOne({
        $or: [
          { name: middleman },
          { displayName: middleman },
          { aliases: middleman }
        ]
      });
      if (mm) {
        mm.completedTrades += 1;
        await mm.save();
        if (ioInstance) ioInstance.emit('middleman:updated', mm);
      }
    }

    const activity = await Activity.create({
      type: 'trade',
      title: 'New verified trade',
      message: `${trade.buyer} ↔ ${trade.seller}`,
      metadata: {
        tradeId: trade.tradeId,
        buyer: trade.buyer,
        seller: trade.seller,
        buyerItem: trade.buyerItem,
        sellerItem: trade.sellerItem,
        value: trade.value,
        middleman: trade.middleman
      }
    });
    if (ioInstance) ioInstance.emit('activity:new', activity);
  } else {
    const activity = await Activity.create({
      type: 'trade',
      title: 'Test trade created',
      message: '⚠ TEST TRADE — NOT A REAL TRANSACTION',
      isTest: true,
      metadata: { tradeId: trade.tradeId }
    });
    if (ioInstance) ioInstance.emit('activity:new', activity);
  }

  if (ioInstance) {
    ioInstance.emit('trade:new', trade);
    const stats = await getStats();
    ioInstance.emit('stats:update', stats);
  }

  return { duplicate: false, trade };
}

async function processExternalTrade(payload) {
  return createVerifiedTrade({
    ...payload,
    source: payload.source || 'external',
    verified: true,
    isTest: false
  });
}

async function recalculateStats() {
  const realTrades = await Trade.find({ isTest: false, verified: true });
  const stats = await getStats();
  stats.smallTrades = realTrades.filter(t => t.tradeSize === 'small').length;
  stats.mediumTrades = realTrades.filter(t => t.tradeSize === 'medium').length;
  stats.largeTrades = realTrades.filter(t => t.tradeSize === 'large').length;
  stats.totalTrades = realTrades.length;
  const middlemen = await Middleman.find({ active: true });
  stats.totalVouches = middlemen.reduce((sum, m) => sum + (m.vouches || 0), 0);
  stats.activeMiddlemen = middlemen.filter(m => m.isOnline && !m.isPlaceholder).length;
  stats.updatedAt = new Date();
  await stats.save();
  return stats;
}

async function incrementVisit() {
  const stats = await getStats();
  stats.totalVisits += 1;
  stats.updatedAt = new Date();
  await stats.save();
  if (ioInstance) ioInstance.emit('stats:update', stats);
  return stats;
}

module.exports = {
  setIO,
  getSettings,
  getStats,
  getTradeSize,
  createVerifiedTrade,
  processExternalTrade,
  recalculateStats,
  incrementVisit,
  normalizeMiddlemanName
};
