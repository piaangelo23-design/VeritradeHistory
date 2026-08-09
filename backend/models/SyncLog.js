const mongoose = require('mongoose');

const syncLogSchema = new mongoose.Schema({
  source: { type: String, default: 'bot' },
  type: { type: String, enum: ['sync', 'error', 'status', 'trade'], default: 'sync' },
  message: String,
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  success: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('SyncLog', syncLogSchema);
