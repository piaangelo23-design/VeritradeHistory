const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  tradeId: { type: String, required: true, unique: true, index: true },
  externalTradeId: { type: String, unique: true, sparse: true, index: true },
  discordMessageId: { type: String, unique: true, sparse: true, index: true },
  guildId: String,
  channelId: String,
  messageUrl: String,
  buyer: { type: String, required: true, trim: true },
  seller: { type: String, required: true, trim: true },
  buyerItem: { type: String, required: true, trim: true },
  sellerItem: { type: String, required: true, trim: true },
  buyerProfile: { type: mongoose.Schema.Types.Mixed },
  sellerProfile: { type: mongoose.Schema.Types.Mixed },
  itemsGiven: { type: [mongoose.Schema.Types.Mixed], default: [] },
  itemsReceived: { type: [mongoose.Schema.Types.Mixed], default: [] },
  paymentType: { type: String, trim: true },
  paymentAmount: { type: Number, min: 0 },
  value: { type: Number, required: true, min: 0 },
  middleman: { type: String, default: null },
  tradeSize: { type: String, enum: ['small', 'medium', 'large', 'test'], default: 'small' },
  status: { type: String, default: 'Completed' },
  verified: { type: Boolean, default: false },
  isTest: { type: Boolean, default: false },
  source: { type: String, default: 'discord' },
  verificationSource: { type: String, trim: true },
  verifiedAt: Date,
  completedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

tradeSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Trade', tradeSchema);
