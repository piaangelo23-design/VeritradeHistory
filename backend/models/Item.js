const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: true },
  slug: { type: String, unique: true, sparse: true },
  image: String,
  value: { type: Number, default: 0, min: 0 },
  rarity: { type: String, default: 'Common' },
  category: String,
  status: { type: String, enum: ['active', 'discontinued', 'new'], default: 'active' },
  dateAdded: { type: Date, default: Date.now },
  source: { type: String, default: 'manual' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Item', itemSchema);
