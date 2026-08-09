const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = {
  token: process.env.DISCORD_TOKEN,
  guildId: process.env.DISCORD_GUILD_ID,
  tradeChannelId: process.env.TRADE_CHANNEL_ID,
  backendUrl: (process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/$/, ''),
  apiSecret: process.env.API_SECRET,
  syncInterval: parseInt(process.env.SYNC_INTERVAL, 10) || 60,
  tradeFeedInterval: parseInt(process.env.TRADE_FEED_INTERVAL, 10) || 15,
  memberListPath: process.env.MEMBER_LIST_PATH || 'C:/Users/User6/Documents/bpt.txt',
  trackingEnabled: process.env.TRACKING_ENABLED !== 'false',
  autoTradesEnabled: process.env.AUTO_TRADES_ENABLED === 'true',
  adminDiscordIds: (process.env.ADMIN_DISCORD_IDS || '').split(',').map(s => s.trim()).filter(Boolean),
  enablePresenceIntent: process.env.ENABLE_PRESENCE_INTENT === 'true'
};
