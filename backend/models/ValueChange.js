const mongoose = require('mongoose');

const valueChangeSchema = new mongoose.Schema({
  itemName: { type: String, required: true, trim: true, index: true },
  previousValue: { type: Number, default: 0 },
  newValue: { type: Number, required: true },
  change: { type: Number, default: 0 },
  changePercent: { type: Number, default: 0 },
  source: { type: String, default: 'neblio' },
  detectedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ValueChange', valueChangeSchema);
