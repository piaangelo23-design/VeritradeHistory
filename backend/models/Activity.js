const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['trade', 'vouch', 'value_change', 'new_item', 'announcement', 'market_update', 'sync', 'system'],
    required: true,
    index: true
  },
  title: { type: String, required: true },
  message: String,
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  isTest: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('Activity', activitySchema);
