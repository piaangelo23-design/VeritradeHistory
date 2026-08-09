const mongoose = require('mongoose');

const discordMemberSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true, index: true },
  guildId: { type: String, required: true, index: true },
  username: { type: String, required: true, trim: true },
  displayName: { type: String, trim: true },
  avatar: { type: String, trim: true },
  isOnline: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  lastSyncedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('DiscordMember', discordMemberSchema);