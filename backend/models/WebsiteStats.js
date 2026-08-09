const mongoose = require('mongoose');

const websiteStatsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'global' },
  totalVisits: { type: Number, default: 0 },
  visitBaseline: { type: Number, default: 0 },
  totalMembers: { type: Number, default: 0 },
  memberBaseline: { type: Number, default: 0 },
  onlineMembers: { type: Number, default: 0 },
  activeMiddlemen: { type: Number, default: 0 },
  totalVouches: { type: Number, default: 0 },
  smallTrades: { type: Number, default: 0 },
  mediumTrades: { type: Number, default: 0 },
  largeTrades: { type: Number, default: 0 },
  totalTrades: { type: Number, default: 0 },
  valueChanges: { type: Number, default: 0 },
  newItems: { type: Number, default: 0 },
  lastTradeAt: Date,
  lastSyncAt: Date,
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WebsiteStats', websiteStatsSchema);
