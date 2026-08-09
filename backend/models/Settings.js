const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'app' },
  tradeChannelId: String,
  guildId: String,
  trackingEnabled: { type: Boolean, default: true },
  syncInterval: { type: Number, default: 60 },
  smallTradeMax: { type: Number, default: 500 },
  mediumTradeMax: { type: Number, default: 5000 },
  tradeParser: {
    headerPattern: { type: String, default: 'TRADE COMPLETED' },
    fields: {
      buyer: { type: String, default: 'Buyer:' },
      seller: { type: String, default: 'Seller:' },
      buyerItem: { type: String, default: 'gave:' },
      sellerItem: { type: String, default: 'gave:' },
      value: { type: String, default: 'Value:' },
      status: { type: String, default: 'Status:' },
      middleman: { type: String, default: 'Middleman:' }
    }
  },
  botStatus: {
    connected: { type: Boolean, default: false },
    guildConnected: { type: Boolean, default: false },
    channelAccessible: { type: Boolean, default: false },
    trackingActive: { type: Boolean, default: false },
    lastHeartbeat: Date
  },
  announcements: [{
    title: String,
    message: String,
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }],
  neblioLastUpdate: Date,
  seedVersion: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settings', settingsSchema);
