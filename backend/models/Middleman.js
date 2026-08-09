const mongoose = require('mongoose');

const middlemanSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  displayName: { type: String, trim: true },
  avatar: { type: String, required: true },
  discordId: String,
  vouches: { type: Number, default: 0, min: 0 },
  completedTrades: { type: Number, default: 0, min: 0 },
  successRate: { type: Number, default: 100, min: 0, max: 100 },
  isOnline: { type: Boolean, default: false },
  isTrusted: { type: Boolean, default: true },
  isPlaceholder: { type: Boolean, default: false },
  aliases: [{ type: String, trim: true }],
  profileUrl: String,
  sortOrder: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

middlemanSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Middleman', middlemanSchema);
